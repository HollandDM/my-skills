"""Source tracking and descriptive reconstruction, separate from intended contracts."""
from __future__ import annotations

import copy
import hashlib
import json
import os
import subprocess
from datetime import datetime
from pathlib import Path, PurePosixPath

from stepwise_state import fingerprint, validate_behavior


def stamp() -> str:
    return datetime.now().isoformat(timespec='microseconds')


def digest(value) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def repository(led, override=None) -> Path | None:
    if override:
        return Path(override).expanduser().resolve()
    root = led.data.get('source_root')
    return (led.dir / root).resolve() if root else None


def set_repository(led, root) -> Path:
    path = Path(root).expanduser().resolve()
    if not path.is_dir():
        raise ValueError(f'repository directory does not exist: {path}')
    led.data['source_root'] = os.path.relpath(path, led.dir)
    return path


def relative_path(value: str) -> str:
    path = PurePosixPath(value)
    if not value or path.is_absolute() or '..' in path.parts or '\\' in value or ':' in value:
        raise ValueError('source paths must be relative to the repository, without .. or drive prefixes')
    return path.as_posix()


def read_source(root: Path | None, path: str) -> dict:
    try:
        relative_path(path)
        if root is None or not root.is_dir():
            return {'state': 'unavailable', 'reason': 'repository root is unavailable'}
        file = (root / path).resolve()
        if not file.is_relative_to(root):
            return {'state': 'unavailable', 'reason': 'source resolves outside the repository'}
        # Hash the entire containing file, including edits outside the named symbol.
        hasher = hashlib.sha256()
        with file.open('rb') as stream:
            for chunk in iter(lambda: stream.read(128 * 1024), b''):
                hasher.update(chunk)
        return {'state': 'available', 'sha256': hasher.hexdigest()}
    except FileNotFoundError:
        return {'state': 'missing', 'reason': 'source file was removed or moved'}
    except (OSError, ValueError) as exc:
        return {'state': 'unavailable', 'reason': str(exc)}


def edges(led, nid: str) -> list[str]:
    node = led.nodes[nid]
    refs = [*node.get('observed_children', []), *node.get('depends', [])]
    for body in [node.get('body', []), node.get('observation', {}).get('body', [])]:
        refs.extend(line.get('child') or line.get('reuse') for line in body)
    return sorted({ref for ref in refs if ref in led.nodes and ref != nid})


def assessment(node: dict, source_state: str) -> dict:
    contract = node.get('contract', {})
    observation = node.get('observation', {})
    if not contract:
        return {'status': 'unassessed', 'reason': 'No intended contract is recorded.'}
    if source_state != 'current':
        return {'status': 'unknown', 'reason': 'Current source inspection is required.'}
    if observation.get('design_hash') != fingerprint(node) or observation.get('design_context') != node.get('evidence_context'):
        return {'status': 'unknown', 'reason': 'The intended design changed after this assessment.'}
    comparisons = observation.get('comparisons', {})
    differences = [key for key in contract if comparisons.get(key, {}).get('status') == 'differs']
    if differences:
        return {'status': 'differs', 'reason': 'Differences recorded for: ' + ', '.join(differences)}
    if all(comparisons.get(key, {}).get('status') == 'matches' for key in contract):
        return {'status': 'matches', 'reason': 'The recorded inspection assesses every intended clause as matching.'}
    return {'status': 'unknown', 'reason': 'Some intended clauses have not been assessed or remain uncertain.'}


def git_commit(root: Path | None) -> str | None:
    if root is None:
        return None
    try:
        result = subprocess.run(['git', '-C', str(root), 'rev-parse', 'HEAD'], capture_output=True, text=True, timeout=5)
        return result.stdout.strip() if result.returncode == 0 else None
    except (OSError, subprocess.TimeoutExpired):
        return None


def implementation_hash(files: dict) -> str | None:
    if not files:
        return None
    if len(files) == 1:
        source = next(iter(files.values()))
        if source.get('state') == 'available':
            return source['sha256']
    return digest(files)


def record_version(node: dict, row: dict, commit: str | None) -> None:
    version = row['implementation_version']
    if not node.get('bindings') or node.get('design') in ('retired', 'superseded'):
        return
    if node.get('implementation_version') != version:
        previous = node.get('implementation_version')
        node['implementation_revision'] = node.get('implementation_revision', 0) + 1
        node.setdefault('implementation_history', []).append({'date': stamp(), 'revision': node['implementation_revision'],
            'previous': previous, 'version': version, 'commit': commit, 'reason': row['reason']})
        node['implementation_version'] = version
    node['implementation_commit'] = commit


def scan(led, override=None) -> dict:
    root = repository(led, override)
    commit = git_commit(root)
    cache = {}
    for n in led.nodes.values():
        for binding in n.get('bindings', {}).values():
            path = binding['path']
            if path not in cache:
                cache[path] = read_source(root, path)
    report = {}
    for nid, node in led.nodes.items():
        bindings = node.get('bindings', {})
        if not bindings and not node.get('observation') and not node.get('observed_children') and node.get('origin') != 'existing-code':
            continue
        visited, pending, files = set(), [nid], {}
        while pending:
            current = pending.pop()
            if current in visited:
                continue
            visited.add(current)
            for binding in led.nodes[current].get('bindings', {}).values():
                files[binding['path']] = cache[binding['path']]
            pending.extend(edges(led, current))
        # Symbols/ranges are navigation hints. Only whole-file bytes and binding paths version code.
        identity = {sid: {'path': b['path']} for sid, b in bindings.items()}
        token = digest({'bindings': identity, 'files': files})
        obs = node.get('observation', {})
        direct = []
        details = {}
        for sid, binding in bindings.items():
            path = binding['path']
            current = cache[path]
            baseline = obs.get('inspected_files', {}).get(path, {}).get('sha256') or binding.get('baseline_sha256')
            changed = current.get('sha256') != baseline or current['state'] != 'available'
            if changed:
                direct.append(sid)
            details[sid] = {**binding, 'current': current, 'changed': changed, 'inspected_sha256': baseline}
        if not bindings:
            state, reason = 'unbound', 'Bind source locations before recording behavior.'
        elif any(value['state'] != 'available' for value in files.values()):
            state, reason = 'missing', 'One or more bound or dependent source files are missing or unavailable.'
        elif not obs:
            state, reason = 'unobserved', 'Sources are bound but behavior has not been recorded.'
        elif obs.get('scope_hash') != token:
            state, reason = 'stale', 'Bound sources changed.' if direct else 'A dependency or source binding changed.'
        else:
            state, reason = 'current', 'Recorded observations match the inspected source fingerprints.'
        report[nid] = {'design': node['design'], 'state': state, 'reason': reason, 'inspection_token': token, 'bindings': details,
                       'scope_files': files, 'scope_nodes': sorted(visited), 'changed_bindings': direct,
                       'conformance': assessment(node, state), 'implementation_version': implementation_hash(files),
                       'recorded_version': node.get('implementation_version'), 'observed_version': obs.get('implementation_version')}
    pending = [nid for nid, row in report.items() if row['state'] != 'current' and led.nodes[nid]['design'] not in ('retired', 'superseded')]
    assessment_pending = [nid for nid, row in report.items() if led.nodes[nid]['design'] not in ('retired', 'superseded')
                          and led.nodes[nid].get('contract') and (led.nodes[nid].get('observation', {}).get('design_hash') != fingerprint(led.nodes[nid])
                          or led.nodes[nid].get('observation', {}).get('design_context') != led.nodes[nid].get('evidence_context')
                          or set(led.nodes[nid]['contract']) - set(led.nodes[nid].get('observation', {}).get('comparisons', {})))]
    notifications = [{'node': nid, 'kind': 'implementation_changed' if report[nid]['implementation_version'] != report[nid]['observed_version'] else 'inspection_stale',
                      'previous': report[nid]['observed_version'], 'current': report[nid]['implementation_version'], 'reason': report[nid]['reason']} for nid in pending]
    notifications.extend({'node': nid, 'kind': 'assessment_required', 'reason': report[nid]['conformance']['reason']} for nid in assessment_pending if nid not in pending)
    return {'repository': str(root) if root else None, 'commit': commit, 'assessment_pending': assessment_pending, 'nodes': report, 'pending': pending, 'notifications': notifications,
            'current': [nid for nid, row in report.items() if row['state'] == 'current'],
            'differences': [nid for nid, row in report.items() if row['conformance']['status'] == 'differs']}


def refresh_sources(led, override=None) -> dict:
    report = scan(led, override)
    for nid, row in report['nodes'].items():
        node = led.nodes[nid]
        node['current_implementation_version'] = row['implementation_version']
        node['source_state'] = row['state']
        node['source_scope_hash'] = row['inspection_token']
        node['conformance'] = row['conformance']
    return report


def refresh_assessments(led, report: dict) -> None:
    # Called after the ledger has refreshed intended dependency/evidence context.
    pending = []
    for nid, row in report['nodes'].items():
        node = led.nodes[nid]
        row['conformance'] = assessment(node, row['state'])
        node['conformance'] = row['conformance']
        obs = node.get('observation', {})
        if node['design'] not in ('retired', 'superseded') and node.get('contract') and (
            obs.get('design_hash') != fingerprint(node) or obs.get('design_context') != node.get('evidence_context')
            or set(node['contract']) - set(obs.get('comparisons', {}))):
            pending.append(nid)
    report['assessment_pending'] = pending
    report['differences'] = [nid for nid, row in report['nodes'].items() if row['conformance']['status'] == 'differs']
    report['notifications'] = [n for n in report['notifications'] if n['kind'] != 'assessment_required']
    report['notifications'].extend({'node': nid, 'kind': 'assessment_required', 'reason': report['nodes'][nid]['conformance']['reason']} for nid in pending if nid not in report['pending'])


def adopt(led, nid: str, statement: str | None, parent: str | None) -> str:
    if parent and parent not in led.nodes:
        raise ValueError(f'parent {parent} does not exist; adopt it first')
    if nid in led.nodes:
        if led.nodes[nid]['design'] in ('retired', 'superseded'):
            raise ValueError('use the live replacement or explicitly reopen a retired node before adopting it')
        if statement and statement != led.nodes[nid]['statement']:
            raise ValueError('adopt cannot change an existing node statement')
        if not parent:
            raise ValueError('node already exists; use bind/observe or supply --parent to link it')
    else:
        if not statement:
            raise ValueError('new observational nodes need an abstract statement')
        if led.nodes and not parent:
            raise ValueError('a root already exists; supply --parent for this observational node')
        led.nodes[nid] = {'statement': statement, 'gloss': '', 'effect': '', 'contract': {}, 'depends': [],
                         'design': 'draft', 'realization': 'not-started', 'verification': 'unverified',
                         'approved': '', 'origin': 'existing-code'}
    if parent:
        children = led.nodes[parent].setdefault('observed_children', [])
        if nid not in children:
            children.append(nid)
    return f'{nid} adopted for observation; intended contract and approval are unchanged'


def bind(led, nid: str, path: str, *, root=None, binding_id=None, symbol='', lines=None) -> str:
    node = led.nodes[nid]
    if node['design'] in ('retired', 'superseded'):
        raise ValueError('cannot rebind a historical node; revive or use its replacement')
    existing_root = repository(led)
    if root:
        proposed = Path(root).expanduser().resolve()
        if existing_root and existing_root != proposed:
            raise ValueError('this ledger uses another repository; use reconcile --repo to relocate it explicitly')
        existing_root = set_repository(led, root)
    if existing_root is None:
        raise ValueError('the first bind needs --repo pointing at the inspected repository')
    path = relative_path(path)
    current = read_source(existing_root, path)
    if current['state'] != 'available':
        raise ValueError(f'{path}: {current["reason"]}')
    bindings = node.setdefault('bindings', {})
    if binding_id and (not binding_id.startswith('S') or not binding_id[1:].isdigit()):
        raise ValueError('binding IDs use S followed by digits, such as S01')
    sid = binding_id or f'S{max((int(k[1:]) for k in bindings), default=0)+1:02d}'
    binding = {'path': path, 'baseline_sha256': current['sha256'], 'bound_at': stamp()}
    if symbol:
        binding['symbol'] = symbol
    if lines:
        parts = lines.split(':')
        if len(parts) != 2 or not all(p.isdigit() for p in parts) or int(parts[0]) < 1 or int(parts[1]) < int(parts[0]):
            raise ValueError('--lines must be a positive START:END range')
        binding['lines'] = [int(p) for p in parts]
    binding['commit'] = git_commit(existing_root)
    if sid in bindings:
        node.setdefault('binding_history', []).append({'date': stamp(), 'id': sid, 'previous': bindings[sid]})
    bindings[sid] = binding
    return f'{nid} bound {sid}: {path}; run scan, inspect the code, then observe with its inspection token'


def unbind(led, nid: str, sid: str, reason: str) -> str:
    node = led.nodes[nid]
    if node['design'] in ('retired', 'superseded'):
        raise ValueError('historical source bindings cannot be removed')
    if not reason.strip() or sid not in node.get('bindings', {}):
        raise ValueError('unbind needs an existing binding ID and a reason')
    previous = node['bindings'].pop(sid)
    node.setdefault('binding_history', []).append({'date': stamp(), 'id': sid, 'previous': previous, 'reason': reason})
    return f'{nid} removed binding {sid}; previous observations remain in history'


def observe(led, nid: str, payload: dict, token: str, *, by: str, parse_body, fn_of) -> str:
    node = led.nodes[nid]
    if node['design'] in ('retired', 'superseded'):
        raise ValueError('historical observations cannot be replaced')
    allowed = {'effect', 'claims', 'unknowns', 'pseudocode', 'behavior', 'comparisons'}
    if not isinstance(payload, dict) or set(payload) - allowed:
        raise ValueError('observation fields: effect, claims, unknowns, pseudocode, behavior, comparisons')
    if not isinstance(payload.get('effect'), str) or not payload['effect'].strip():
        raise ValueError('observation needs a nonempty effect')
    claims = payload.get('claims')
    if not isinstance(claims, list) or not claims:
        raise ValueError('observation needs source-backed claims')
    bindings = node.get('bindings', {})
    for claim in claims:
        if not isinstance(claim, dict) or set(claim) - {'text', 'basis', 'sources'}:
            raise ValueError('claims contain text, basis, and sources')
        if not isinstance(claim.get('text'), str) or not claim['text'].strip() or claim.get('basis') not in ('observed', 'inferred'):
            raise ValueError('each claim needs text and basis observed|inferred')
        refs = claim.get('sources')
        if not isinstance(refs, list) or not refs or any(not isinstance(ref, str) or ref not in bindings for ref in refs):
            raise ValueError('each claim must cite existing local binding IDs in sources')
    unknowns = payload.get('unknowns', [])
    if not isinstance(unknowns, list) or any(not isinstance(v, str) or not v.strip() for v in unknowns):
        raise ValueError('unknowns must be an array of nonempty strings')
    comparisons = payload.get('comparisons', {})
    if not isinstance(comparisons, dict) or set(comparisons) - set(node.get('contract', {})):
        raise ValueError('comparisons must name intended contract clauses')
    for value in comparisons.values():
        if not isinstance(value, dict) or set(value) != {'status', 'reason'} or value.get('status') not in ('matches', 'differs', 'unknown') or not isinstance(value.get('reason'), str) or not value['reason'].strip():
            raise ValueError('each comparison needs status matches|differs|unknown and a reason')
    if 'behavior' in payload and (why := validate_behavior(payload['behavior'])):
        raise ValueError(why)
    body = []
    if 'pseudocode' in payload:
        if not isinstance(payload['pseudocode'], str):
            raise ValueError('pseudocode must be a string')
        body = parse_body(payload['pseudocode'], fn_of(node['statement']))
        for line in body:
            ref = line.get('child') or line.get('reuse')
            if ref and ref not in led.nodes:
                raise ValueError(f'observed call refers to missing node {ref}; adopt it first')
    previous = node.get('observation')
    candidate = {**copy.deepcopy(payload), 'body': body}
    candidate.pop('pseudocode', None)
    # Validate the token against the proposed dependency scope as well as current source bytes.
    node['observation'] = candidate
    try:
        row = scan(led)['nodes'][nid]
        if not bindings or any(v['state'] != 'available' for v in row['scope_files'].values()):
            raise ValueError('bind accessible source files before recording observations')
        if row['inspection_token'] != token:
            raise ValueError('sources or inspection scope changed; bind any new dependencies, rescan and reinspect before observing')
    finally:
        if previous is None:
            node.pop('observation', None)
        else:
            node['observation'] = previous
    if previous:
        node.setdefault('observation_history', []).append(copy.deepcopy(previous))
    candidate.update(bindings=copy.deepcopy(bindings), date=stamp(), by=by, revision=(previous or {}).get('revision', 0)+1,
                     scope_hash=token, inspected_files=copy.deepcopy(row['scope_files']), design_hash=fingerprint(node),
                     implementation_version=row['implementation_version'], implementation_commit=git_commit(repository(led)), design_context=node.get('evidence_context'))
    node['observation'] = candidate
    record_version(node, row, candidate['implementation_commit'])
    return f'{nid} observation {candidate["revision"]} recorded; intended design and approval unchanged'


def validate(led) -> list[str]:
    errors = []
    for nid, n in led.nodes.items():
        for child in n.get('observed_children', []):
            if child not in led.nodes or child == nid:
                errors.append(f'{nid}: observed child {child} must name another existing node')
    visiting, visited = set(), set()
    def walk(nid):
        if nid in visiting:
            errors.append(f'{nid}: observed hierarchy contains a cycle; put recursive calls in observed pseudocode instead')
            return
        if nid in visited:
            return
        visiting.add(nid)
        for child in led.nodes[nid].get('observed_children', []):
            if child in led.nodes:
                walk(child)
        visiting.remove(nid)
        visited.add(nid)
    for nid in led.nodes:
        walk(nid)
    return errors
