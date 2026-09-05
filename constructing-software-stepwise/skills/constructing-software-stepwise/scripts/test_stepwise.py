#!/usr/bin/env python3
"""Focused CLI regressions for approval, evidence, and transactional updates."""
import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr
from pathlib import Path
from unittest.mock import patch

import stepwise as sw


class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.d = Path(self.temp.name) / 'docs/design/example'

    def run_cli(self, *args, stdin='', ok=True):
        stream = io.StringIO()
        with patch('sys.stdin', io.StringIO(stdin)), redirect_stdout(stream), redirect_stderr(stream):
            rc = sw.main(['stepwise.py', args[0], str(self.d), *args[1:]])
        self.assertEqual(rc == 0, ok, stream.getvalue())
        return stream.getvalue()

    def data(self):
        return json.loads((self.d / 'ledger.json').read_text())

    def batch(self, ops, ok=True):
        return self.run_cli('batch', stdin=json.dumps(ops), ok=ok)

    def root(self):
        self.batch([
            {'verb':'new','id':'D-000','statement':'result <- normalize(value)'},
            {'verb':'set','id':'D-000','fields':{'gloss':'Normalize a string.','effect':'Trim surrounding whitespace.',
                'contract':{'pre':'Input is a string.','post':'Result has no surrounding whitespace.'}}},
            {'verb':'ready','id':'D-000','approach':'Call str.strip without mutating input.','validation':'Check empty and padded strings.'},
            {'verb':'approve','id':'D-000','by':'standing approval'}])

    def evidence(self, result, *clauses):
        args = ['evidence','D-000','--kind','test','--ref','test_normalize','--result',result]
        for clause in clauses: args += ['--clause',clause]
        self.run_cli(*args)

    def test_evidence_covers_current_clauses_and_never_implements(self):
        self.root()
        self.evidence('pass','pre')
        self.assertEqual(self.data()['nodes']['D-000']['verification'],'partial')
        self.evidence('pass','post')
        n=self.data()['nodes']['D-000']
        self.assertEqual((n['verification'],n['realization']),('verified','not-started'))
        self.evidence('fail','post')
        self.assertEqual(self.data()['nodes']['D-000']['verification'],'failed')
        self.run_cli('evidence','D-000','--kind','other-test','--ref','other','--result','pass','--clause','post')
        self.assertEqual(self.data()['nodes']['D-000']['verification'],'failed')
        self.evidence('pass','post')
        self.assertEqual(self.data()['nodes']['D-000']['verification'],'verified')
        self.run_cli('reopen','D-000','Use a different normalization rule.')
        self.run_cli('approve','D-000')
        self.assertEqual(self.data()['nodes']['D-000']['verification'],'stale')
        self.assertEqual(len(self.data()['nodes']['D-000']['revisions']),1)

    def test_approved_content_is_frozen(self):
        self.root()
        self.evidence('pass','pre','post')
        before=self.data()
        for args in [('terminal','D-000','python: str.upper'),('set','D-000','{"decisions":["Changed silently"]}'),
                     ('set','D-000','{"depends":[]}'),('body','D-000','--text','-> value')]:
            # Empty depends is unchanged and may be treated as a no-op by JSON set.
            if args[0]=='set' and 'depends' in args[2]: continue
            self.run_cli(*args,ok=False)
            self.assertEqual(self.data(),before)
        self.run_cli('set','D-000','verification','unverified',ok=False)
        self.run_cli('check')

    def test_batch_rolls_back_invalid_final_graph_and_individual_errors(self):
        self.root()
        before={p.relative_to(self.d):p.read_bytes() for p in self.d.rglob('*') if p.is_file()}
        self.batch([{'verb':'reopen','id':'D-000','reason':'Replace the implementation'},
                    {'verb':'set','id':'D-000','fields':{'effect':'This must not persist.'}},
                    {'verb':'new','id':'D-099','statement':'orphan()'}],ok=False)
        self.assertEqual({p.relative_to(self.d):p.read_bytes() for p in self.d.rglob('*') if p.is_file()},before)
        self.batch([{'verb':'reopen','id':'D-000','reason':'Change'}, {'verb':'set','id':'D-000','fields':{'unknown_field':3}}],ok=False)
        self.assertEqual({p.relative_to(self.d):p.read_bytes() for p in self.d.rglob('*') if p.is_file()},before)

    def test_no_arbitrary_size_caps(self):
        self.run_cli('new','D-000','result <- normalize(value)')
        contract={key:'An explicit obligation.' for key in ('pre','post','failure','budget','ordering','cleanup','safety','progress')}
        self.run_cli('set','D-000',json.dumps({'gloss':'Normalize.','effect':'Normalize values.','contract':contract,'walkthrough':['A sentence.']*4}))
        self.run_cli('ready','D-000','--approach','Bounded string processing.','--validation','Check every obligation.')
        self.run_cli('approve','D-000')
        self.assertEqual(len(self.data()['nodes']['D-000']['contract']),8)

    def test_context_changes_invalidate_dependents_atomically(self):
        self.run_cli('entry','term','Run Key','A caller-supplied identity.','--source','user')
        self.root()
        self.batch([{'verb':'reopen','id':'D-000','reason':'Record identity'}, {'verb':'set','id':'D-000','fields':{'depends':['Run Key']}}, {'verb':'approve','id':'D-000'}])
        self.evidence('pass','pre','post')
        self.run_cli('change','Run Key','--definition','A durable identity across retries.','--reason','Clarified scope')
        n=self.data()['nodes']['D-000']
        self.assertEqual((n['design'],n['verification']),('stale','stale'))
        self.run_cli('check')

    def test_legacy_evidence_is_preserved_without_false_verification(self):
        self.root()
        data=self.data();n=data['nodes']['D-000']
        for key in ['approved_content_hash','revision']:n.pop(key,None)
        n['verification']='verified';n['evidence']=[{'date':'2026-01-01','kind':'test','ref':'legacy','result':'pass'}]
        (self.d/'ledger.json').write_text(json.dumps(data))
        self.run_cli('sync')
        self.assertEqual(self.data()['nodes']['D-000']['verification'],'stale')
        self.assertEqual(len(self.data()['nodes']['D-000']['evidence']),1)

    def test_batch_renders_once_and_recovers_interrupted_commit(self):
        with patch.object(sw,'render_all',wraps=sw.render_all) as render:
            self.root()
        self.assertEqual(render.call_count,1)
        from stepwise_transaction import commit, recover, atomic_write
        destination=self.d/'recovery.txt'
        with patch('stepwise_transaction.atomic_write',side_effect=lambda path,value: atomic_write(path,value) if path.name=='.stepwise-transaction.json' else (_ for _ in ()).throw(OSError('interrupted'))):
            with self.assertRaises(OSError):commit(self.d,{destination:'Recovered content'})
        recover(self.d)
        self.assertEqual(destination.read_text(),'Recovered content')
        self.assertFalse((self.d/'.stepwise-transaction.json').exists())

    def test_adr_updates_are_staged_with_the_batch(self):
        self.root()
        self.batch([{'verb':'adr','args':['new','Durability','--constrains','D-000']},
                    {'verb':'set','id':'D-000','fields':{'not_a_field':'wrong'}}],ok=False)
        self.assertFalse((self.d.parents[1]/'adr').exists())
        self.run_cli('adr','new','Durability','--constrains','D-000')
        self.assertEqual(self.data()['nodes']['D-000']['design'],'draft')
        adr=next((self.d.parents[1]/'adr').glob('*.md'))
        adr.write_text(adr.read_text().replace('<1–3 sentences: what forced this decision, what was chosen, and the real trade-off.>','Use durable storage to retain outcomes.'))
        self.run_cli('adr','accept','ADR-0001')
        self.run_cli('approve','D-000')


if __name__ == '__main__':
    unittest.main()
