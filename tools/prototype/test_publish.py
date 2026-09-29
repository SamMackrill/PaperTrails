import importlib.util, unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location('publish', Path(__file__).with_name('publish_prototype.py'))
p = importlib.util.module_from_spec(spec); spec.loader.exec_module(p)
class ArtifactTests(unittest.TestCase):
    def test_artifact_contains_runtime_and_no_operations_or_credentials(self):
        for path in ['index.html','print-trail.html','src/trailController.js','vendor/js-yaml.min.js','data/trails.yaml','images/tapestry/landscape-b-early.png']:
            self.assertTrue(p.allowed(path), path)
        for path in ['.git/config','.herenow/state.json','../credentials','tools/prototype/babysitter.py','run/state.json','docs/ui-improvements/ui-improvement-analysis-second-pass.html','images/tapestry/README.md','AGENTS.md']:
            self.assertFalse(p.allowed(path), path)
if __name__ == '__main__': unittest.main()
