import importlib.util, unittest
from pathlib import Path
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
if __name__ == '__main__': unittest.main()
