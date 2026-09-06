#!/usr/bin/env python3
"""Focused source-version and reconstruction regressions using a disposable repo."""
import io
import hashlib
import json
import subprocess
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr
from pathlib import Path
from unittest.mock import patch

import stepwise as sw


class ExistingCodeTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo=Path(self.temp.name)/'repo';self.repo.mkdir()
        self.d=self.repo/'docs/design/normalization'
        (self.repo/'normalize.py').write_text('def normalize(value):\n    return value.strip()\n')
        (self.repo/'run.py').write_text('from normalize import normalize\ndef run(value):\n    return normalize(value)\n')
        subprocess.run(['git','init','-q',str(self.repo)],check=True)
        subprocess.run(['git','-C',str(self.repo),'add','normalize.py','run.py'],check=True)
        subprocess.run(['git','-C',str(self.repo),'-c','user.name=Fixture','-c','user.email=fixture@example.test','-c','commit.gpgsign=false','commit','-qm','Initial implementation'],check=True)

    def run_cli(self,*args,stdin='',ok=True):
        output=io.StringIO()
        with patch('sys.stdin',io.StringIO(stdin)),redirect_stdout(output),redirect_stderr(output):
            rc=sw.main(['stepwise.py',args[0],str(self.d),*args[1:]])
        self.assertEqual(rc==0,ok,output.getvalue())
        return output.getvalue()

    def data(self):return json.loads((self.d/'ledger.json').read_text())
    def scan(self):return json.loads(self.run_cli('scan','--json'))

    def adopt(self):
        ops=[{'verb':'adopt','id':'D-000','statement':'result <- run(value)'},
             {'verb':'adopt','id':'D-001','statement':'result <- normalize(value)','parent':'D-000'},
             {'verb':'bind','args':['D-000','run.py','--repo',str(self.repo),'--symbol','run']},
             {'verb':'bind','args':['D-001','normalize.py','--symbol','normalize']}]
        self.run_cli('batch',stdin=json.dumps(ops))

    def observe(self,nid='D-001',comparisons=None):
        token=self.scan()['nodes'][nid]['inspection_token']
        payload={'effect':'Return a normalized string.','claims':[{'text':'Whitespace is stripped.','basis':'observed','sources':['S01']}], 'unknowns':[]}
        if comparisons is not None:payload['comparisons']=comparisons
        self.run_cli('observe',nid,json.dumps(payload),'--at',token)

    def test_adoption_never_promotes_an_observed_behavior_to_a_contract(self):
        self.adopt();self.observe();self.observe('D-000')
        n=self.data()['nodes']['D-001']
        self.assertEqual(n['contract'],{})
        self.assertEqual(n['design'],'draft')
        self.assertEqual(n['realization'],'not-started')
        self.assertEqual(n['verification'],'unverified')
        self.assertEqual(self.scan()['pending'],[])
        self.assertEqual(self.scan()['nodes']['D-001']['conformance']['status'],'unassessed')
        self.run_cli('check')

    def test_dirty_edits_signal_nodes_and_parents_without_rewriting_observations(self):
        self.adopt();self.observe();self.observe('D-000')
        before=self.data();old=self.scan()
        (self.repo/'normalize.py').write_text('def normalize(value):\n    return value.upper()\n')
        current=self.scan()
        self.assertEqual(current['commit'],old['commit'])
        self.assertNotEqual(current['nodes']['D-001']['implementation_version'],old['nodes']['D-001']['implementation_version'])
        self.assertEqual(set(current['pending']),{'D-000','D-001'})
        self.assertEqual(self.data(),before)
        self.run_cli('sync')
        n=self.data()['nodes']['D-001']
        self.assertEqual(n['observation'],before['nodes']['D-001']['observation'])
        self.assertEqual(n['implementation_revision'],2)
        self.assertEqual(n['source_state'],'stale')
        self.assertEqual(self.scan()['nodes']['D-000']['changed_bindings'],[])
        self.assertEqual(len(self.scan()['notifications']),2)

    def test_observation_token_rejects_changes_since_inspection(self):
        self.adopt();token=self.scan()['nodes']['D-001']['inspection_token'];before=self.data()
        (self.repo/'normalize.py').write_text('def normalize(value):\n    return value.upper()\n')
        payload={'effect':'Trim whitespace.','claims':[{'text':'Uses strip.','basis':'observed','sources':['S01']}]}
        self.run_cli('observe','D-001',json.dumps(payload),'--at',token,ok=False)
        self.assertEqual(self.data(),before)
        self.observe()
        self.assertEqual(self.scan()['nodes']['D-001']['state'],'current')

    def test_observation_round_trip_preserves_omitted_pseudocode_only_when_sources_match(self):
        self.adopt(); token=self.scan()['nodes']['D-001']['inspection_token']
        payload={'effect':'Trim whitespace.','claims':[{'text':'Uses strip.','basis':'observed','sources':['S01']}],
                 'unknowns':[],'pseudocode':'return value.strip() -- ⇒ python: str.strip -- Trim whitespace.'}
        self.run_cli('observe','D-001',json.dumps(payload),'--at',token)
        body=self.data()['nodes']['D-001']['observation']['body']
        exported=json.loads(self.run_cli('observation','D-001'))
        self.assertIn('str.strip',exported['pseudocode'])
        update={'effect':'Return a trimmed value.','claims':payload['claims']}
        self.run_cli('observe','D-001',json.dumps(update),'--at',token)
        self.assertEqual(self.data()['nodes']['D-001']['observation']['body'],body)
        before=self.data();(self.repo/'normalize.py').write_text('def normalize(value):\n    return value.upper()\n')
        fresh=self.scan()['nodes']['D-001']['inspection_token']
        self.run_cli('observe','D-001',json.dumps(update),'--at',fresh,ok=False)
        self.assertEqual(self.data(),before)
        update['pseudocode']='return value.upper() -- ⇒ python: str.upper -- Uppercase the value.'
        self.run_cli('observe','D-001',json.dumps(update),'--at',fresh)
        self.assertIn('upper',self.data()['nodes']['D-001']['observation']['body'][0]['code'])
        update['pseudocode']=''
        self.run_cli('observe','D-001',json.dumps(update),'--at',fresh)
        self.assertEqual(self.data()['nodes']['D-001']['observation']['body'],[])

    def test_conformance_is_separate_and_code_changes_invalidate_evidence(self):
        self.adopt()
        self.run_cli('set','D-001',json.dumps({'gloss':'Normalize a string.','effect':'Trim whitespace.','contract':{'post':'Whitespace is stripped.'}}))
        self.run_cli('terminal','D-001','python: str.strip')
        self.run_cli('approve','D-001','--by','user')
        self.run_cli('evidence','D-001','--kind','test','--ref','fixture','--result','pass','--clause','post',
                     '--scope','implementation','--scenario','padded input','--assessment','The implementation strips whitespace for the fixture input.')
        before=self.data()['nodes']['D-001'];self.observe(comparisons={'post':{'status':'matches','reason':'The inspected implementation calls str.strip.'}})
        after=self.data()['nodes']['D-001']
        self.assertEqual(after['approved_content_hash'],before['approved_content_hash'])
        self.assertEqual(after['approved'],before['approved'])
        self.assertEqual(after['verification'],'verified')
        self.assertEqual(self.scan()['nodes']['D-001']['conformance']['status'],'matches')
        (self.repo/'normalize.py').write_text('def normalize(value):\n    return value.upper()\n')
        self.run_cli('sync')
        changed=self.data()['nodes']['D-001']
        self.assertEqual(changed['verification'],'stale')
        self.assertEqual(changed['design'],'approved')
        self.assertEqual(changed['conformance']['status'],'unknown')
        self.observe(comparisons={'post':{'status':'differs','reason':'The implementation uppercases without stripping whitespace.'}})
        self.assertEqual(self.scan()['differences'],['D-001'])
        self.assertEqual(self.data()['nodes']['D-001']['contract'],before['contract'])

    def test_missing_files_and_rebinding_do_not_clear_drift(self):
        self.adopt();self.observe()
        (self.repo/'normalize.py').rename(self.repo/'labels.py')
        self.assertEqual(self.scan()['nodes']['D-001']['state'],'missing')
        self.run_cli('bind','D-001','labels.py','--binding','S01','--symbol','normalize')
        self.assertEqual(self.scan()['nodes']['D-001']['state'],'stale')
        self.observe()
        self.assertEqual(self.scan()['nodes']['D-001']['state'],'current')
        self.run_cli('bind','D-001','../outside.py',ok=False)
        self.run_cli('unbind','D-001','S01','--reason','This implementation was removed.')
        self.assertEqual(self.scan()['nodes']['D-001']['state'],'unbound')

    def test_whole_file_hashes_ignore_locator_hints_but_include_unrelated_code(self):
        self.adopt();self.observe()
        before=self.scan()['nodes']['D-001']
        self.assertEqual(before['implementation_version'],hashlib.sha256((self.repo/'normalize.py').read_bytes()).hexdigest())
        self.run_cli('bind','D-001','normalize.py','--binding','S01','--symbol','normalize','--lines','2:2')
        hints=self.scan()['nodes']['D-001']
        self.assertEqual(hints['implementation_version'],before['implementation_version'])
        self.assertEqual(hints['inspection_token'],before['inspection_token'])
        self.assertEqual(hints['state'],'current')
        with (self.repo/'normalize.py').open('a') as stream:
            stream.write('\ndef unrelated():\n    return 42\n')
        changed=self.scan()['nodes']['D-001']
        self.assertNotEqual(changed['implementation_version'],before['implementation_version'])
        self.assertEqual(changed['state'],'stale')

    def test_scan_counts_every_active_node_in_a_source_backed_model(self):
        self.adopt();self.observe();self.observe('D-000')
        self.run_cli('unbind','D-001','S01','--reason','Binding needs reconstruction.')
        report=self.scan()
        self.assertEqual(report['coverage']['active'],2)
        self.assertEqual(report['coverage']['bound'],1)
        self.assertEqual(report['coverage']['unbound'],['D-001'])
        self.assertFalse(report['coverage']['complete'])
        self.assertIn('D-001',report['pending'])
        self.run_cli('bind','D-001','normalize.py','--binding','S01','--symbol','normalize')
        self.observe()
        complete=self.scan()['coverage']
        self.assertEqual(complete['current'],complete['active'])
        self.assertTrue(complete['complete'])

    def test_observed_hierarchy_and_claims_are_validated_transactionally(self):
        self.adopt();before=self.data()
        self.run_cli('adopt','D-000','--parent','D-001',ok=False)
        self.assertEqual(self.data(),before)
        token=self.scan()['nodes']['D-001']['inspection_token']
        payload={'effect':'Normalize.','claims':[{'text':'A guess','basis':'certain','sources':['S01']}]}
        self.run_cli('batch',stdin=json.dumps([{'verb':'observe','id':'D-001','payload':payload,'at':token}]),ok=False)
        self.assertEqual(self.data(),before)

    def test_reconcile_starts_an_independent_model_and_never_overwrites(self):
        self.adopt(); self.observe()
        before = {p.relative_to(self.d):p.read_bytes() for p in self.d.rglob('*') if p.is_file()}
        destination = self.d.with_name('rebuilt')
        self.run_cli('reconcile', '--output', str(destination))
        fresh = json.loads((destination/'ledger.json').read_text())
        self.assertEqual(fresh['nodes'], {})
        self.assertEqual(fresh['terms'], {})
        self.assertEqual((destination/fresh['source_root']).resolve(), self.repo)
        self.assertEqual((destination/fresh['reconstruction']['previous_ledger']).resolve(), self.d/'ledger.json')
        self.assertEqual({p.relative_to(self.d):p.read_bytes() for p in self.d.rglob('*') if p.is_file()}, before)
        self.run_cli('reconcile', '--output', str(destination), ok=False)
        self.run_cli('reconcile', '--output', str(self.d), ok=False)
        self.run_cli('batch', stdin=json.dumps([['reconcile','--output',str(self.d.with_name('bad'))]]), ok=False)
        self.assertFalse(self.d.with_name('bad').exists())


if __name__=='__main__':unittest.main()
