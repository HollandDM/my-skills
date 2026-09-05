"""Notation regressions: preserve blocks, procedure boundaries, and approved data."""
import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr
from pathlib import Path
from unittest.mock import patch

import stepwise as sw
from stepwise_pseudocode import display_code, signature
from stepwise_html import render_html


class PseudocodeTests(unittest.TestCase):
    def test_paper_blocks_and_uppercase_calls(self):
        items = sw.parse_body('''procedure TransformAll(X)
  Y ← []
  for each x in X do
    if x ≠ ∅ then
      y ← Transform(x) ▷ D-001: Transform one item.
      Y ← Y ⧺ [y]
    else
      continue
    end if
  end for
  return Y
end procedure''', 'TransformAll')
        self.assertEqual(len(items), 10)
        self.assertEqual(items[3]['indent'], 4)
        self.assertEqual(items[3]['child'], 'D-001')
        self.assertEqual(sw.fn_of('y ← Transform(x)'), 'Transform')
        self.assertEqual(sw.fn_of(sw.frontier_statement(items[3]['code'])), 'Transform')
        self.assertEqual(sw.call_names('return Transform(x)'), ['Transform'])
        self.assertEqual(sw.call_names('return (x, y)'), [])
        self.assertEqual(sw.call_names('text ← "Transform(x)"'), [])
        self.assertEqual(sw.stmt_kind('IF x ∈ X THEN'), 'control')
        self.assertEqual(sw.stmt_kind('assert x ∈ X'), 'assert')
        self.assertEqual(sw.parse_body('repeat\n  x ← x + 1\nuntil x ≥ 3', 'Count')[1]['indent'], 2)

    def test_literals_and_legacy_notation(self):
        text = 'Echo("a <- b -- c ▷ d")'
        self.assertEqual(signature(text), text)
        self.assertEqual(signature('(a, b) ← Pair(x)'), 'Pair(x)')
        self.assertEqual(display_code('-> '+text), 'return '+text)
        items=sw.parse_body('Echo(x):\n  y <- Echo("-- literal") -- ⇒ python: print -- Echo a literal.\n  -> y', 'Echo')
        self.assertEqual(items[0]['code'], 'y <- Echo("-- literal")')
        self.assertEqual(items[0]['target'], 'python: print')
        self.assertEqual(display_code(items[0]['code']), 'y ← Echo("-- literal")')

    def test_reject_misplaced_contracts_and_other_procedures(self):
        for text in ['Require: x is positive\nreturn x', 'procedure Other(x)\nreturn x\nend procedure', 'procedure Run(x)\nprocedure Nested(x)\nreturn x\nend procedure']:
            with self.assertRaises(ValueError):sw.parse_body(text,'Run')

    def test_end_to_end_named_procedures_and_readonly_export(self):
        with tempfile.TemporaryDirectory() as temp:
            d=Path(temp)/'docs/design/paper'
            ops=[
                {'verb':'new','id':'D-000','statement':'Y ← TransformAll(X)'},
                {'verb':'set','id':'D-000','fields':{'gloss':'Transform a sequence','effect':'Map every input.', 'contract':{'pre':'X is a finite sequence.','post':'Y is its transformed sequence.'},'walkthrough':['Apply Transform in input order.'],'composition':['After each iteration, Y is the transformed prefix.']}},
                {'verb':'body','id':'D-000','text':'procedure TransformAll(X)\n  Y ← []\n  for each x in X do\n    y ← Transform(x) ▷ D-001: Transform an input.\n    Y ← Y ⧺ [y]\n  end for\n  return Y\nend procedure'},
                {'verb':'approve','id':'D-000','by':'test'},
                {'verb':'new','id':'D-001'},
                {'verb':'set','id':'D-001','fields':{'gloss':'Transform an input','effect':'Return the same value.','contract':{'pre':'x is supplied.','post':'The result equals x.'},'walkthrough':['Return x unchanged.'],'composition':['Identity establishes the postcondition.']}},
                {'verb':'body','id':'D-001','text':'return x'},
                {'verb':'approve','id':'D-001','by':'test'}]
            output=io.StringIO()
            with patch('sys.stdin',io.StringIO(json.dumps(ops))),redirect_stdout(output),redirect_stderr(output):
                rc=sw.main(['stepwise.py','batch',str(d)])
            self.assertEqual(rc,0,output.getvalue())
            before=(d/'ledger.json').read_bytes();data=json.loads(before)
            view=(d/'DESIGN.md').read_text()
            self.assertIn('Require: X is a finite sequence.',view)
            self.assertEqual(view.count('procedure TransformAll(X)'),1)
            self.assertEqual(view.count('procedure Transform(x)'),1)
            root=view.split('### Procedures')[0]
            self.assertNotIn('return x',root)
            document=render_html(data,title='Paper',exported_at='test',adrs=[])
            self.assertIn('algorithm-card',document)
            self.assertEqual((d/'ledger.json').read_bytes(),before)
            self.assertEqual(data['nodes']['D-000']['approved_content_hash'],sw.fingerprint(data['nodes']['D-000']))


if __name__=='__main__':unittest.main()
