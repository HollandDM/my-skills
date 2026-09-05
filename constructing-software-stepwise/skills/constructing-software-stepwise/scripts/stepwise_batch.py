"""Translate structured batch operations into CLI arguments; never invoke a shell."""
import json


def operations(payload: object) -> list[list[str]]:
    if not isinstance(payload, list) or not payload:
        raise ValueError('expected a nonempty array of operation objects or argument arrays')
    result = []
    for item in payload:
        if isinstance(item, list) and item and all(isinstance(v, str) for v in item):
            result.append(item)
            continue
        if not isinstance(item, dict) or not isinstance(item.get('verb'), str):
            raise ValueError('each operation needs a verb')
        verb = item['verb']
        if 'args' in item:
            if set(item) != {'verb', 'args'} or not isinstance(item['args'], list):
                raise ValueError('generic operations accept only verb and args')
            result.append([verb, *[v if isinstance(v, str) else json.dumps(v) for v in item['args']]])
            continue
        shapes = {'new': ('statement',), 'set': ('fields',), 'body': ('text',),
                  'terminal': ('target',), 'approve': ('by',), 'ready': ('approach', 'validation'),
                  'reopen': ('reason',), 'stale': ('reason',), 'retire': ('reason',)}
        if verb not in shapes or set(item) - {'verb', 'id', *shapes.get(verb, ())}:
            raise ValueError(f'{verb}: use verb/args for this operation or correct its fields')
        if not isinstance(item.get('id'), str):
            raise ValueError(f'{verb}: id is required')
        args = [verb, item['id']]
        for field in shapes[verb]:
            if field not in item:
                if (verb, field) in [('new', 'statement'), ('approve', 'by')]:
                    continue
                raise ValueError(f'{verb}: {field} is required')
            value = item[field]
            if field != 'fields' and not isinstance(value, str):
                raise ValueError(f'{verb}.{field} must be a string')
            if field in ('text', 'by', 'approach', 'validation'):
                args.append('--' + field)
            args.append(json.dumps(value) if field == 'fields' else value)
        result.append(args)
    return result
