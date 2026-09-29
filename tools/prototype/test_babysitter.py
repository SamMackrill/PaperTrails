import importlib.util, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
spec = importlib.util.spec_from_file_location('babysitter', Path(__file__).with_name('babysitter.py'))
b = importlib.util.module_from_spec(spec); spec.loader.exec_module(b)

class ReviewQueueTests(unittest.TestCase):
    def setUp(self):
        self.entry = {'number': 53, 'branch': 'ui-pass2/a', 'base': b.PROTOTYPE, 'status': 'reviewing', 'request': {'head': 'abc', 'base': 'def', 'at': 1000, 'marker': 'unique', 'diff': 'patch'}}
        self.pr = {'head': {'sha': 'abc', 'ref': 'ui-pass2/a'}, 'base': {'sha': 'def', 'ref': b.PROTOTYPE}}
        self.review = {'user': {'login': b.BOT}, 'commit_id': 'abc', 'submitted_at': '1970-01-01T00:20:00Z', 'id': 123, 'body': '**Actionable comments posted: 0**'}

    def test_shared_hour_and_active_review(self):
        state = {'nextEligible': 4660}
        self.assertFalse(b.eligible(state, 4659, False))
        self.assertTrue(b.eligible(state, 4660, False))
        self.assertFalse(b.eligible(state, 5000, True))

    def test_summary_and_green_bot_check_are_not_a_review(self):
        with patch.object(b, 'pages', side_effect=[[], []]), patch.object(b.time, 'time', return_value=1400):
            b.reconcile_review({}, self.entry, self.pr)
        self.assertEqual(self.entry['status'], 'reviewing')
        with patch.object(b, 'api', return_value={'check_runs': [{'name': 'CodeRabbit', 'status': 'completed', 'conclusion': 'success'}]}):
            self.assertFalse(b.native_green('abc'))

    def test_inline_bot_chat_empty_review_is_not_code_review(self):
        chat = {**self.review, 'body': ''}
        with patch.object(b, 'pages', side_effect=[[], [chat]]), patch.object(b.time, 'time', return_value=1400):
            b.reconcile_review({}, self.entry, self.pr)
        self.assertEqual(self.entry['status'], 'reviewing')

    def test_actual_head_review_and_stale_head(self):
        with patch.object(b, 'pages', side_effect=[[], [self.review]]):
            b.reconcile_review({}, self.entry, self.pr)
        self.assertEqual(self.entry['reviewed']['reviewId'], 123)
        self.entry['status'] = 'reviewing'; self.pr['head']['sha'] = 'changed'
        with patch.object(b, 'pages', side_effect=[[], [self.review]]):
            b.reconcile_review({}, self.entry, self.pr)
        self.assertEqual(self.entry['status'], 'queued')

    def test_rate_limit_does_not_record_review(self):
        message = {'user': {'login': b.BOT}, 'updated_at': '1970-01-01T00:20:00Z', 'body': 'Rate limit exceeded. Please wait 80 minutes.'}
        state = {'nextEligible': 4660}
        with patch.object(b, 'pages', return_value=[message]), patch.object(b.time, 'time', return_value=1400):
            b.reconcile_review(state, self.entry, self.pr)
        self.assertEqual(state['nextEligible'], 6200)
        self.assertEqual(self.entry['status'], 'queued')
        self.assertNotIn('reviewed', self.entry)

    def test_lost_response_recovers_marker_without_duplicate_post(self):
        self.entry['status'] = 'requesting'
        with patch.object(b, 'pages', side_effect=[[{'body': 'unique', 'id': 44, 'user': {'login': 'owner'}}], [self.review]]), patch.object(b, 'api') as api:
            b.reconcile_review({}, self.entry, self.pr)
        self.assertEqual(self.entry['request']['commentId'], 44)
        self.assertEqual(self.entry['status'], 'reviewed'); api.assert_not_called()

    def test_persist_request_intent_before_failed_post(self):
        state = {'prs': [self.entry]}
        with tempfile.TemporaryDirectory() as directory, patch.object(b, 'STATE', Path(directory)/'state.json'), patch.object(b.time, 'time', return_value=1000), patch.object(b, 'diff_hash', return_value='patch'), patch.object(b, 'api', side_effect=RuntimeError('network')):
            with self.assertRaises(RuntimeError): b.request_review(state, self.entry, self.pr)
            self.assertIn('requesting', b.STATE.read_text())
        self.assertEqual(state['nextEligible'], 4660)

    def test_pagination_collects_all_comments(self):
        with patch.object(b, 'api', side_effect=[[{'id': n} for n in range(100)], [{'id': 101}]]):
            self.assertEqual(len(b.pages('comments')), 101)

    def test_merge_never_falls_back_to_main_or_changed_head(self):
        self.pr['base']['ref'] = 'main'
        with patch.object(b.subprocess, 'run') as run:
            b.merge_ready({'prs': [self.entry]}, self.entry, self.pr); run.assert_not_called()
        self.pr['base']['ref'] = b.PROTOTYPE
        self.entry['reviewed'] = {'head': 'other'}
        with self.assertRaises(RuntimeError): b.merge_ready({}, self.entry, self.pr)

if __name__ == '__main__': unittest.main()
