import importlib.util, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
spec = importlib.util.spec_from_file_location('publish', Path(__file__).with_name('publish_prototype.py'))
p = importlib.util.module_from_spec(spec); spec.loader.exec_module(p)
class ArtifactTests(unittest.TestCase):
    def test_only_safe_registered_remedials_can_follow_initial_publication(self):
        state = {'implementationReady': True, 'prs': [{'status': 'merged'} for _ in range(8)]}
        state['prs'].append({'status': 'queued', 'remedial': True})
        self.assertTrue(p.delivery_ready(state))
        state['prs'][0]['status'] = 'queued'; self.assertFalse(p.delivery_ready(state))
        state['prs'][0]['status'] = 'merged'; state['implementationReady'] = False
        self.assertFalse(p.delivery_ready(state))
    def test_artifact_contains_runtime_and_no_operations_or_credentials(self):
        for path in ['index.html','print-trail.html','src/trailController.js','vendor/js-yaml.min.js','data/trails.yaml','images/tapestry/landscape-b-early.png']:
            self.assertTrue(p.allowed(path), path)
        for path in ['.git/config','.herenow/state.json','../credentials','tools/prototype/babysitter.py','run/state.json','docs/ui-improvements/ui-improvement-analysis-second-pass.html','images/tapestry/README.md','AGENTS.md']:
            self.assertFalse(p.allowed(path), path)
    def test_packaging_bounds_each_git_show(self):
        paths = 'index.html\nprint-trail.html\ndata/trails.yaml\ndata/relations.yaml'
        with tempfile.TemporaryDirectory() as directory, patch.object(p, 'command', return_value=paths) as command, patch.object(p.subprocess, 'check_output', return_value=b'page') as check_output:
            p.package(Path(directory), 'commit', Path(directory)/'artifact')
        self.assertEqual(command.call_count, 1)
        self.assertTrue(all(call.kwargs['timeout'] == 120 for call in check_output.call_args_list))
class OwnerVerificationTests(unittest.TestCase):
    def fixture(self, branch=p.PROTOTYPE):
        import hashlib, json
        paths=['index.html','data/trails.yaml','src/trailController.js',
               'images/tapestry/landscape-b-revolutions.png','print-trail.html',
               'prototype-version.json','images/tapestry/example-threads.webp', 'style.css']
        files={path:path.encode() for path in paths}
        files['prototype-version.json']=json.dumps({'branch':branch,'commit':'expected'}).encode()
        return files,[dict(path=path,hash=hashlib.sha256(contents).hexdigest()) for path,contents in files.items()]

    def test_owner_verification_checks_entry_points_and_thread_bytes(self):
        files,manifest=self.fixture()
        seen=[]
        def fetch(slug,path,key):
            seen.append((slug,path,key));return files[path]
        p.verify_live_artifact('review','expected',manifest,'test-key',fetch)
        self.assertEqual({path for _,path,_ in seen},set(files))
        self.assertTrue(all(slug=='review' and key=='test-key' for slug,_,key in seen))

    def test_owner_verification_rejects_stale_bytes_or_wrong_source(self):
        files,manifest=self.fixture()
        with self.assertRaisesRegex(RuntimeError,'hash mismatch'):
            p.verify_live_artifact('review','expected',manifest,'test-key',lambda *args:b'stale')
        with self.assertRaisesRegex(RuntimeError,'commit or branch mismatch'):
            p.verify_live_artifact('review','different',manifest,'test-key',lambda slug,path,key:files[path])
        files,manifest=self.fixture('main')
        with self.assertRaisesRegex(RuntimeError,'commit or branch mismatch'):
            p.verify_live_artifact('review','expected',manifest,'test-key',lambda slug,path,key:files[path])

    def test_owner_file_uses_authenticated_api_and_blocks_cross_host_redirect(self):
        from unittest.mock import MagicMock
        response=MagicMock();response.__enter__.return_value.read.return_value=b'bytes'
        opener=MagicMock();opener.open.return_value=response
        with patch.object(p.urllib.request,'build_opener',return_value=opener) as build:
            self.assertEqual(p.read_owner_file('review','index.html','test-key'),b'bytes')
        request=opener.open.call_args.args[0]
        self.assertEqual(request.full_url,'https://here.now/api/v1/publish/review/files/index.html')
        self.assertEqual(request.get_header('Authorization'),'Bearer test-key')
        with self.assertRaisesRegex(RuntimeError,'redirect changed host'):
            build.call_args.args[0].redirect_request(request,None,302,'',{},'https://untrusted.example/file')
        with self.assertRaisesRegex(RuntimeError,'redirect changed host or scheme'):
            build.call_args.args[0].redirect_request(request,None,302,'',{},'http://here.now/file')

    def test_visitor_entry_points_are_checked_at_the_live_site(self):
        seen=[]
        p.verify_live_entry_points('https://review.here.now/', lambda site_url, path: seen.append((site_url,path)))
        self.assertEqual(seen,[('https://review.here.now/',''),('https://review.here.now/','print-trail.html')])
        with self.assertRaisesRegex(RuntimeError,'escaped here.now'):
            p.verify_live_entry_points('http://review.here.now/', lambda *args: None)

if __name__ == '__main__': unittest.main()
