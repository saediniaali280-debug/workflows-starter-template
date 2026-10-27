import assert from "node:assert/strict";
import fs from "node:fs";
import { redactCiLog } from "./redact-ci-log.mjs";

function check(name, fn) {
  try {
    fn();
    console.log("PASS " + name);
  } catch (error) {
    console.error("FAIL " + name + ": " + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  }
}

check("authorization headers and cookies are redacted", () => {
  const input = [
    "Authorization: Bearer bearer-secret-canary",
    "Authorization: Basic basic-secret-canary",
    "Authorization: Token token-secret-canary",
    "Cookie: session=session-secret-canary",
    "Set-Cookie: auth=auth-secret-canary; HttpOnly",
    "X-API-Key: header-key-secret-canary",
  ].join("\n");
  const output = redactCiLog(input);
  for (const canary of [
    "bearer-secret-canary", "basic-secret-canary", "token-secret-canary",
    "session-secret-canary", "auth-secret-canary", "header-key-secret-canary",
  ]) {
    assert.equal(output.includes(canary), false, "leaked canary: " + canary);
  }
  assert.match(output, /REDACTED_AUTH/);
  assert.match(output, /REDACTED_COOKIE/);
  assert.match(output, /REDACTED_HEADER_KEY/);
});

check("redacts query credentials, named secret fields, common tokens and email", () => {
  // Build token-shaped canaries from fragments so repository secret scanning does not
  // mistake the test fixture for an actual credential.
  const githubToken = ["ghp", "abcdefghijklmnopqrstuvwxyz1234567890"].join("_");
  const githubPat = ["github", "pat", "abcdefghijklmnopqrstuvwxyz1234567890"].join("_");
  const apiKey = ["sk", "abcdefghijklmnopqrstuvwxyz1234567890"].join("-");
  const awsKey = ["AKIA", "1234567890ABCDEF"].join("");
  const awsSessionKey = ["ASIA", "1234567890ABCDEF"].join("");
  const slackToken = ["xoxb", "1234567890", "abcdefghijklmnop"].join("-");
  const jwt = ["eyJabcdefghijk", "abcdefghijk", "abcdefghij"].join(".");
  const beginPrivateKey = ["-----BEGIN ", "PRIVATE KEY-----"].join("");
  const endPrivateKey = ["-----END ", "PRIVATE KEY-----"].join("");
  const privateKeyBlock = beginPrivateKey + "\nfake-private-key-canary\n" + endPrivateKey;
  const input = [
    "https://example.invalid/callback?token=query-secret-canary&next=ok",
    '{"api_key":"json-secret-canary","client_secret": yaml-secret-canary}',
    githubToken, githubPat, apiKey, awsKey, awsSessionKey, slackToken, jwt,
    privateKeyBlock,
    "owner@example.invalid",
    "https://user:password@example.invalid/path",
  ].join("\n");
  const output = redactCiLog(input);
  for (const canary of [
    "query-secret-canary", "json-secret-canary", "yaml-secret-canary",
    githubToken, githubPat, apiKey, awsKey, awsSessionKey, slackToken, jwt,
    "fake-private-key-canary", "owner@example.invalid", "user:password@",
  ]) {
    assert.equal(output.includes(canary), false, "leaked canary: " + canary);
  }
  assert.match(output, /REDACTED_EMAIL/);
  assert.match(output, /REDACTED_JWT/);
  assert.match(output, /REDACTED_SLACK_TOKEN/);
  assert.match(output, /REDACTED_PRIVATE_KEY_BLOCK/);
});

check("redaction is safe on empty, non-string and repeated inputs", () => {
  assert.equal(redactCiLog(""), "");
  assert.equal(redactCiLog(null), "");
  const once = redactCiLog("Authorization: Bearer repeat-secret-canary");
  assert.equal(redactCiLog(once), once);
});

check("automation workflow requires opt-in and redacts both input and output", () => {
  const workflow = fs.readFileSync(new URL("../.github/workflows/automation-network.yml", import.meta.url), "utf8");
  assert.match(workflow, /ONE_XAI_LOG_UPLOAD_APPROVED/);
  assert.match(workflow, /ONE_XAI_LOG_UPLOAD_APPROVED:-\}.*true/s);
  assert.ok(workflow.includes('raw_log='));
  assert.ok(workflow.includes("log=\"$(printf '%s' \"$raw_log\" | node scripts/redact-ci-log.mjs)\""));
  assert.ok(workflow.includes('raw_analysis='));
  assert.ok(workflow.includes("analysis=\"$(printf '%s' \"$raw_analysis\" | node scripts/redact-ci-log.mjs)\""));
});
