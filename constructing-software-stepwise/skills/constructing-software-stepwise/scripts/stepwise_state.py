"""Approval fingerprints, evidence coverage, and behavior-diagram validation."""
from __future__ import annotations
import hashlib
import json

CONTENT_FIELDS = ('statement', 'gloss', 'effect', 'contract', 'body', 'target', 'walkthrough',
                  'composition', 'decisions', 'deferred', 'adaptation', 'depends', 'implementation_plan', 'behavior')


def fingerprint(node: dict) -> str:
    content = {key: node[key] for key in CONTENT_FIELDS if node.get(key)}
    return hashlib.sha256(json.dumps(content, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def current_evidence(node: dict) -> list[tuple[str, dict]]:
    if node.get('design') != 'approved' or node.get('approved_content_hash') != fingerprint(node):
        return []
    return [(f'EV-{i}', ev) for i, ev in enumerate(node.get('evidence', []), 1)
            if ev.get('dependency_hash', '') == node.get('evidence_context', '')
            and ev.get('revision') == node.get('revision', 0)
            and ev.get('content_hash') == node.get('approved_content_hash')]


def coverage(node: dict) -> dict:
    """Latest result per check, with explicit resolution across different checks."""
    clauses = set(node.get('contract', {}))
    records = node.get('evidence', [])
    evidence = current_evidence(node)
    resolved = {ref for _, ev in evidence if ev.get('result') == 'pass' and not ev.get('withdrawn') for ref in ev.get('resolves', [])}
    latest = {}
    for eid, ev in evidence:
        if ev.get('withdrawn'):
            continue
        if ev.get('result') == 'fail' and eid in resolved:
            continue
        for clause in ev.get('clauses', []) or ['']:
            latest[(clause, ev.get('kind'), ev.get('ref'))] = ev.get('result')
    failures = sorted({clause or '(unscoped)' for (clause, _, _), result in latest.items() if result == 'fail'})
    passed = {clause for (clause, _, _), result in latest.items() if result == 'pass' and clause in clauses}
    if failures:
        status = 'failed'
    elif clauses and passed == clauses:
        status = 'verified'
    elif latest:
        status = 'partial'
    elif records:
        status = 'stale'
    else:
        status = 'unverified'
    return {'status': status, 'covered': sorted(passed), 'missing': sorted(clauses - passed), 'failed': failures}


def refresh(nodes: dict) -> None:
    for node in nodes.values():
        node['verification'] = coverage(node)['status']


def validate_behavior(value: object) -> str:
    if not isinstance(value, dict) or set(value) - {'states', 'transitions', 'participants', 'messages'}:
        return 'behavior must contain states/transitions and/or participants/messages arrays'
    ids = {}
    for field in ('states', 'participants'):
        rows = value.get(field, [])
        if not isinstance(rows, list):
            return f'behavior.{field} must be an array'
        ids[field] = set()
        for row in rows:
            if not isinstance(row, dict) or not isinstance(row.get('id'), str) or not row['id'].strip() or not isinstance(row.get('label'), str) or not row['label'].strip():
                return f'behavior.{field} items need nonempty id and label strings'
            if row['id'] in ids[field]:
                return f'behavior.{field}: duplicate id {row["id"]}'
            ids[field].add(row['id'])
            for flag in ('initial', 'terminal'):
                if flag in row and not isinstance(row[flag], bool):
                    return f'behavior.{field}.{flag} must be boolean'
            if 'node' in row and not isinstance(row['node'], str):
                return f'behavior.{field}.node must be a node ID'
    for field, endpoints, label in [('transitions', 'states', 'event'), ('messages', 'participants', 'label')]:
        rows = value.get(field, [])
        if not isinstance(rows, list):
            return f'behavior.{field} must be an array'
        for row in rows:
            if not isinstance(row, dict) or not isinstance(row.get(label), str) or not row[label].strip():
                return f'behavior.{field} items need a nonempty {label}'
            if not isinstance(row.get('from'), str) or not isinstance(row.get('to'), str) or row['from'] not in ids[endpoints] or row['to'] not in ids[endpoints]:
                return f'behavior.{field} endpoints must name recorded {endpoints}'
            for key in ('guard', 'action', 'node', 'kind'):
                if key in row and not isinstance(row[key], str):
                    return f'behavior.{field}.{key} must be a string'
    return ''
