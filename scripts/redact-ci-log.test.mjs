import test from "node:test";
import assert from "node:assert/strict";
import { redactCiLog } from "./redact-ci-log.mjs";

test("redacts common authorization headers and cookies", () => {
  const input = [
    "Authorization: Bearer bearer-secret-canary",
    "Authorization: Basic basic-secret-canary",
    "Cookie: session=session-secret-canary",
    "Set-Cookie: auth=auth-secret-canary; HttpOnly",
  ].join("\n");
  const output = redactCiLog(input);
  for (const canary of ["bearer-secret-canary", "basic-secret-canary", "session-secret-canary", "auth-secret-canary"]) {
    assert.equal(output.includes(canary), false, "leaked canary: " + canary);
  }
  assert.match(output, /REDACTED_AUTH/);
  assert.match(output, /REDACTED_COOKIE/);
});

test("redacts query credentials, named secret fields, common tokens and email", () => {
  // Construct realistic-looking canaries from fragments so repository secret scanning
  // does not mistake the test fixture for an actual credential.
  const githubToken = ["ghp", "abcdefghijklmnopqrstuvwxyz1234567890"].join("_");
  const githubPat = ["github", "pat", "abcdefghijklmnopqrstuvwxyz1234567890"].join("_");
  const apiKey = ["sk", "abcdefghijklmnopqrstuvwxyz1234567890"].join("-");
  const awsKey = ["AKIA", "1234567890ABCDEF"].join("");
  const awsSessionKey = ["ASIA", "1234567890ABCDEF"].join("");
  const slackToken = ["xoxb", "1234567890", "abcdefghijklmnop"].join("-");
  const jwt = ["eyJabcdefghijk", "abcdefghijk", "abcdefghij"].join(".");
  const input = [
    "https://example.invalid/callback?token=query-secret-canary&next=ok",
    '{"api_key":"json-secret-canary","client_secret": yaml-secret-canary}',
    githubToken, githubPat, apiKey, awsKey, awsSessionKey, slackToken, jwt,
    "owner@example.invalid",
    "https://user:password@example.invalid/path",
  ].join("\n");
  const output = redactCiLog(input);
  for (const canary of [
    "query-secret-canary", "json-secret-canary", "yaml-secret-canary",
    githubToken, githubPat, apiKey, awsKey, awsSessionKey, slackToken, jwt,
    "owner@example.invalid", "user:password@",
  ]) {
    assert.equal(output.includes(canary), false, "leaked canary: " + canary);
  }
  assert.match(output, /REDACTED_EMAIL/);
  assert.match(output, /REDACTED_JWT/);
  assert.match(output, /REDACTED_SLACK_TOKEN/);
});

test("redaction is safe on empty, non-string and repeated inputs", () => {
  assert.equal(redactCiLog(""), "");
  assert.equal(redactCiLog(null), "");
  const once = redactCiLog("Authorization: Bearer repeat-secret-canary");
  assert.equal(redactCiLog(once), once);
});
