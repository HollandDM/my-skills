"""Paper-style pseudocode helpers. Presentation never rewrites approved content."""
from __future__ import annotations


def split_comment(line: str) -> tuple[str, str, str]:
    """Recognize Stepwise and paper-style comments outside string literals."""
    quote = ''
    escaped = False
    for i, ch in enumerate(line):
        if quote:
            if escaped:
                escaped = False
            elif ch == '\\':
                escaped = True
            elif ch == quote:
                quote = ''
        elif ch in ('"', "'"):
            quote = ch
        elif ch == '▷' or line.startswith('--', i):
            width = 1 if ch == '▷' else 2
            return line[:i], line[i:i + width], line[i + width:]
    return line, '', ''


def signature(statement: str) -> str:
    value = statement.strip()
    quote, depth, escaped = '', 0, False
    for i, ch in enumerate(value):
        if quote:
            if escaped:
                escaped = False
            elif ch == '\\':
                escaped = True
            elif ch == quote:
                quote = ''
        elif ch in ('"', "'"):
            quote = ch
        elif ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
        elif depth == 0 and (ch == '←' or value.startswith('<-', i)):
            value = value[i + (1 if ch == '←' else 2):].strip()
            break
    for prefix in ('procedure ', 'function ', 'return ', '->'):
        if value.lower().startswith(prefix):
            value = value[len(prefix):].strip()
            break
    depth, quote, escaped = 0, '', False
    for i, ch in enumerate(value):
        if quote:
            if escaped:
                escaped = False
            elif ch == '\\':
                escaped = True
            elif ch == quote:
                quote = ''
        elif ch in ('"', "'"):
            quote = ch
        elif ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
            if depth == 0:
                return value[:i + 1]
    return value.rstrip(':')


def display_code(code: str) -> str:
    """Normalize legacy assignment/return glyphs outside quoted literals only."""
    value = code.strip()
    if value.startswith('->'):
        value = 'return ' + value[2:].lstrip()
    result, quote, escaped, i = [], '', False, 0
    while i < len(value):
        ch = value[i]
        if quote:
            result.append(ch)
            if escaped:
                escaped = False
            elif ch == '\\':
                escaped = True
            elif ch == quote:
                quote = ''
        elif ch in ('"', "'"):
            quote = ch
            result.append(ch)
        elif value.startswith('<-', i):
            result.append('←')
            i += 1
        else:
            result.append(ch)
        i += 1
    return ''.join(result)


def contract_heading(label: str) -> str:
    return {'pre': 'Require', 'post': 'Ensure', 'input': 'Input', 'output': 'Output'}.get(label, label.title())


def algorithm_lines(nid: str, node: dict, tag) -> list[str]:
    """One procedure per node: calls stay calls, preserving return/state scope."""
    out = [f"Algorithm {nid}: {node.get('gloss') or signature(node['statement'])}"]
    out += [f'{contract_heading(k)}: {v}' for k, v in node.get('contract', {}).items()]
    body = node.get('body', [])
    if not body:
        if node.get('target'):
            out.append('Implementation target: ' + node['target'])
        elif node.get('implementation_plan'):
            out.append('Implementation approach: ' + node['implementation_plan']['approach'])
            out.append('Validation plan: ' + node['implementation_plan']['validation'])
        return out
    width = len(str(len(body) + 2))
    out.append(f"{1:>{width}}: procedure {signature(node['statement'])}")
    for i, item in enumerate(body, 2):
        note = tag(item)
        code = ' ' * (2 + item.get('indent', 0)) + display_code(item['code'])
        out.append(f"{i:>{width}}: {code}" + (f'  ▷ {note}' if note else ''))
    out.append(f"{len(body) + 2:>{width}}: end procedure")
    return out


def presentation(ledger: dict) -> dict:
    """Keep HTML and Markdown notation identical without altering ledger data."""
    signatures, code = {}, {}
    def visit(value):
        if isinstance(value, dict):
            for key, item in value.items():
                if key in ('statement', 'code') and isinstance(item, str):
                    signatures[item] = signature(item)
                    code[item] = display_code(item)
                visit(item)
        elif isinstance(value, list):
            for item in value:
                visit(item)
    visit(ledger)
    return {'signatures': signatures, 'code': code}
