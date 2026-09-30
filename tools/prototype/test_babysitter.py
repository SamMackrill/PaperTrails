import importlib.util, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
spec = importlib.util.spec_from_file_location('babysitter', Path(__file__).with_name('babysitter.py'))
b = importlib.util.module_from_spec(spec); spec.loader.exec_module(b)

class ReviewQueueTests(unittest.TestCase):
    def setUp(self):
        self.entry = {'number': 53, 'branch': 'ui-pass2/a', 'base': b.PROTOTYPE, 'worktree': '/unused-test-worktree', 'status': 'reviewing', 'request': {'head': 'abc', 'base': 'def', 'at': 1000, 'marker': 'unique', 'diff': 'patch'}}
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
        self.assertIsNone(b.review_body_finding(self.review))
        extra = b.review_body_finding({**self.review, 'body': '<summary>🧹 Nitpick comments (2)</summary>important content'})
        self.assertEqual(extra['id'], -123)
        self.assertTrue(extra['reviewBody'])

    def test_actual_head_review_and_stale_head(self):
        with patch.object(b, 'pages', side_effect=[[], [self.review]]):
            b.reconcile_review({}, self.entry, self.pr)
        self.assertEqual(self.entry['reviewed']['reviewId'], 123)
        self.entry['status'] = 'reviewing'; self.pr['head']['sha'] = 'changed'
        with patch.object(b, 'pages', side_effect=[[], [self.review]]):
            b.reconcile_review({}, self.entry, self.pr)
        self.assertEqual(self.entry['status'], 'queued')

    def test_nitpick_only_review_is_a_completed_review_with_findings(self):
        review = {**self.review, 'body': '<summary>Nitpick comments (1)</summary>Extract duplicated constants'}
        self.entry['status'] = 'review-unavailable'
        with patch.object(b, 'pages', side_effect=[[], [review]]):
            b.reconcile_review({}, self.entry, self.pr)
        self.assertEqual(self.entry['status'], 'reviewed')
        self.assertEqual(self.entry['reviewed']['reviewId'], 123)
        self.assertIsNotNone(b.review_body_finding(review))

    def test_delayed_completion_is_reconciled_after_timeout(self):
        self.entry['status'] = 'review-unavailable'
        state = {'prs': [self.entry], 'nextEligible': 99999, 'implementationReady': False}
        with tempfile.TemporaryDirectory() as directory, patch.object(b, 'ROOT', Path(directory)), patch.object(b, 'save'), patch.object(b, 'api', return_value={**self.pr, 'state': 'open'}), patch.object(b, 'pages', side_effect=[[], [self.review]]), patch.object(b.time, 'time', return_value=5000):
            b.tick(state)
        self.assertEqual(self.entry['status'], 'reviewed')

    def test_pushed_fix_preserves_restacking_provenance(self):
        self.entry['status'] = 'reviewed'
        self.entry['reviewed'] = {**self.entry['request'], 'reviewId': 123}
        self.entry['ledger'] = [{'disposition': 'fixed', 'commit': 'fixed'}]
        state = {'prs': [self.entry], 'nextEligible': 99999, 'implementationReady': False}
        pr = {**self.pr, 'head': {'sha': 'fixed', 'ref': 'ui-pass2/a'}, 'state': 'open'}
        with tempfile.TemporaryDirectory() as directory, patch.object(b, 'ROOT', Path(directory)), patch.object(b, 'save'), patch.object(b, 'api', return_value=pr), patch.object(b, 'git', return_value='fixed'), patch.object(b, 'reconcile_fix') as reconcile, patch.object(b.time, 'time', return_value=5000):
            b.tick(state)
        reconcile.assert_called_once_with(state, self.entry)
        self.assertEqual(self.entry['reviewed']['head'], 'abc')

    def test_update_pr_queues_entry_after_discarding_stale_review_state(self):
        state = {'prs': [self.entry], 'nextEligible': 99999, 'implementationReady': False}
        control = {'type': 'update-pr', 'number': self.entry['number'], 'fields': {}}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            control_dir = root / 'control'; control_dir.mkdir()
            (control_dir / 'update.json').write_text(__import__('json').dumps(control), encoding='utf-8')
            with patch.object(b, 'ROOT', root), patch.object(b, 'save'), patch.object(b, 'api', return_value={**self.pr, 'state': 'open'}), patch.object(b.time, 'time', return_value=5000):
                b.tick(state)
        self.assertEqual(self.entry['status'], 'queued')
        self.assertNotIn('request', self.entry)
        self.assertNotIn('reviewed', self.entry)

    def test_rate_limit_does_not_record_review(self):
        message = {'user': {'login': b.BOT}, 'created_at': '1970-01-01T00:20:00Z', 'updated_at': '1970-01-01T00:20:00Z', 'body': 'Rate limit exceeded. Please wait 80 minutes.'}
        state = {'nextEligible': 4660}
        with patch.object(b, 'pages', side_effect=[[message], []]), patch.object(b.time, 'time', return_value=1400):
            b.reconcile_review(state, self.entry, self.pr)
        self.assertEqual(state['nextEligible'], 6200)
        self.assertEqual(self.entry['status'], 'queued')
        self.assertNotIn('reviewed', self.entry)

    def test_completed_review_wins_over_stale_rate_limit_text(self):
        message = {'user': {'login': b.BOT}, 'created_at': '1970-01-01T00:20:00Z', 'updated_at': '1970-01-01T00:20:00Z', 'body': 'Rate limit exceeded. Please wait 80 minutes.'}
        state = {'nextEligible': 4660}
        with patch.object(b, 'pages', side_effect=[[message], [self.review]]), patch.object(b.time, 'time', return_value=1400):
            b.reconcile_review(state, self.entry, self.pr)
        self.assertEqual(self.entry['status'], 'reviewed')
        self.assertEqual(self.entry['reviewed']['reviewId'], 123)
        self.assertEqual(state['nextEligible'], 4660)

    def test_edited_walkthrough_rate_limit_text_does_not_clear_request(self):
        message = {'user': {'login': b.BOT}, 'created_at': '1970-01-01T00:10:00Z', 'updated_at': '1970-01-01T00:20:00Z', 'body': 'Rate limit exceeded. Please wait 80 minutes.'}
        with patch.object(b, 'pages', side_effect=[[message], []]), patch.object(b.time, 'time', return_value=1400):
            b.reconcile_review({}, self.entry, self.pr)
        self.assertEqual(self.entry['status'], 'reviewing')

    def test_lost_response_recovers_marker_without_duplicate_post(self):
        self.entry['status'] = 'requesting'
        with patch.object(b, 'pages', side_effect=[[{'body': 'unique', 'id': 44, 'user': {'login': 'owner'}}], [self.review]]), patch.object(b, 'api') as api:
            b.reconcile_review({}, self.entry, self.pr)
        self.assertEqual(self.entry['request']['commentId'], 44)
        self.assertEqual(self.entry['status'], 'reviewed'); api.assert_not_called()

    def test_persist_request_intent_before_failed_post(self):
        state = {'prs': [self.entry]}
        with tempfile.TemporaryDirectory() as directory, patch.object(b, 'STATE', Path(directory)/'state.json'), patch.object(b.time, 'time', return_value=1000), patch.object(b, 'diff_hash', return_value='patch'), patch.object(b, 'git', return_value='def'), patch.object(b.subprocess, 'run'), patch.object(b, 'api', side_effect=RuntimeError('network')):
            with self.assertRaises(RuntimeError): b.request_review(state, self.entry, self.pr)
            self.assertIn('requesting', b.STATE.read_text())
        self.assertEqual(state['nextEligible'], 4660)

    def test_zero_findings_require_completed_command_and_matching_run_scope(self):
        result = {'id': 20, 'user': {'login': b.BOT}, 'updated_at': '1970-01-01T00:20:00Z',
          'body': '<!-- recent_review_start --> No actionable comments were generated in the recent review. **Run ID**: `run-id` Reviewing files between def and abc'}
        finished = {'id': 21, 'user': {'login': b.BOT}, 'updated_at': '1970-01-01T00:20:01Z',
          'body': 'CodeRabbit review command invocation: v2:unique Full review finished.'}
        self.assertIsNone(b.zero_finding_run([result], self.entry['request']))
        self.assertIsNone(b.zero_finding_run([result, {**finished, 'body': 'Full review triggered.'}], self.entry['request']))
        self.assertIsNone(b.zero_finding_run([{**result, 'body': result['body'].replace('abc', 'stale')}, finished], self.entry['request']))
        with patch.object(b, 'pages', side_effect=[[result, finished], []]):
            b.reconcile_review({}, self.entry, self.pr)
        self.assertEqual(self.entry['reviewed']['kind'], 'completed-zero-finding-run')
        self.assertEqual(self.entry['reviewed']['completionCommentId'], 21)

    def test_pagination_collects_all_comments(self):
        with patch.object(b, 'api', side_effect=[[{'id': n} for n in range(100)], [{'id': 101}]]):
            self.assertEqual(len(b.pages('comments')), 101)

    def test_local_git_commands_have_a_bounded_runtime(self):
        with patch.object(b.subprocess, 'check_output', side_effect=['head\n', b'patch']) as check_output:
            self.assertEqual(b.git(self.entry, 'rev-parse', 'HEAD'), 'head')
            b.diff_hash(self.entry, 'base', 'head')
        self.assertEqual(check_output.call_args_list[0].kwargs['timeout'], 120)
        self.assertEqual(check_output.call_args_list[1].kwargs['timeout'], 120)

    def test_unpushed_fix_cannot_restack_descendants(self):
        self.entry['reviewed'] = {**self.entry['request'], 'reviewId': 123}
        state = {'prs': [self.entry]}
        remote = {**self.pr, 'head': {'sha': 'remote-head', 'ref': 'ui-pass2/a'}}
        with patch.object(b, 'git', side_effect=['local-head', '']), patch.object(b, 'api', return_value=remote), patch.object(b, 'run_native') as native:
            with self.assertRaisesRegex(RuntimeError, 'not pushed'):
                b.reconcile_fix(state, self.entry)
        native.assert_not_called()

    def test_merge_never_falls_back_to_main_or_changed_head(self):
        self.pr['base']['ref'] = 'main'
        with patch.object(b.subprocess, 'run') as run:
            b.merge_ready({'prs': [self.entry]}, self.entry, self.pr); run.assert_not_called()
        self.pr['base']['ref'] = b.PROTOTYPE
        self.entry['reviewed'] = {'head': 'other'}
        with self.assertRaises(RuntimeError): b.merge_ready({}, self.entry, self.pr)

if __name__ == '__main__': unittest.main()
