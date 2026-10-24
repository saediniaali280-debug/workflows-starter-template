from pathlib import Path
import unittest

WORKFLOW = Path(".github/workflows/automation-network.yml").read_text(encoding="utf-8")


class AutomationRetryPolicyTests(unittest.TestCase):
    def test_retry_is_restricted_to_named_non_production_ci_workflows(self):
        self.assertIn('retry_allowed=0', WORKFLOW)
        self.assertIn('"saediniaali280-debug/zehnsarmaye|Build"', WORKFLOW)
        self.assertIn('"saediniaali280-debug/zehnsarmaye|ALI100 CI"', WORKFLOW)
        self.assertIn('"saediniaali280-debug/MindCapital-Ali100|Revenue Core"', WORKFLOW)
        self.assertIn('"saediniaali280-debug/MindCapital-Ali100|ALI100 Tests"', WORKFLOW)
        self.assertIn('"saediniaali280-debug/ALI100-Broker|ALI100 Broker CI"', WORKFLOW)
        self.assertNotIn('"saediniaali280-debug/zehnsarmaye|Deploy Cloudflare Production"', WORKFLOW)
        self.assertNotIn('"saediniaali280-debug/zehnsarmaye|Deploy Bridge (SHA-pinned)"', WORKFLOW)

    def test_retry_requires_a_real_runner_and_executed_steps(self):
        self.assertIn('"$runner_id" -gt 0', WORKFLOW)
        self.assertIn('"$step_count" -gt 0', WORKFLOW)

    def test_retry_budget_is_reserved_before_api_call_and_never_exceeds_one(self):
        reserve = WORKFLOW.index('attempts=MAX(attempts,1)')
        api_call = WORKFLOW.index('rerun-failed-jobs')
        self.assertLess(reserve, api_call)
        self.assertIn('"$attempts" -lt 1', WORKFLOW)
        self.assertIn('cancel-in-progress: false', WORKFLOW)

    def test_automation_network_does_not_retry_itself_or_unknown_workflows(self):
        self.assertNotIn('"saedinia280-debug/workflows-starter-template|Automation Network"', WORKFLOW)
        self.assertIn('retry_allowed=0', WORKFLOW)

    def test_github_token_permissions_remain_read_only(self):
        self.assertIn("permissions:\n  contents: read\n", WORKFLOW)
        self.assertNotIn("issues: write", WORKFLOW)


if __name__ == "__main__":
    unittest.main()
