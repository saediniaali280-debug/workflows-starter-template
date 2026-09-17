# Autonomous Integration Mesh

## Topology

Five GitHub nodes report to this Hub:

- `saediniaali280-debug/workflows-starter-template` (Hub)
- `saediniaali280-debug/zehnsarmaye`
- `saediniaali280-debug/MindCapital-Ali100`
- `saediniaali280-debug/ALI100-Broker`
- `saediniaali280-debug/cmd`

The Hub polls GitHub Actions, accepts `repository_dispatch` heartbeats, stores health/recovery/AI-cache state in Cloudflare D1, and performs at most one automatic failed-job retry per workflow run.

## Required Hub Actions secrets

Configure these in `workflows-starter-template -> Settings -> Secrets and variables -> Actions`:

- `NETWORK_GITHUB_TOKEN`: fine-grained token with Actions read/write and metadata/content access for the five repositories.
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with D1 Read/Write and the permissions required for the target account.
- `CLOUDFLARE_ACCOUNT_ID`: `476d4a10d96fd019171b897724cb7ef0`
- `NETWORK_D1_DATABASE_ID`: `441a7066-5bb5-41b5-b6f2-2f147fee12eb` for `zehnsarmaye_db_2026`
- `ONE_XAI_API_KEY`: optional; only used for cached CI failure analysis. A revoked key must not be reused.

Each mesh node needs the same `NETWORK_GITHUB_TOKEN` secret so it can send a `mesh_heartbeat` repository dispatch to the Hub and, when manually authorized, dispatch its existing deployment workflow.

## Email policy

The node guard accepts commit author emails only from:

- `saediniaali@yahoo.com`
- `saediniaali280@gmail.com`

Pull-request events skip the author guard because GitHub may execute them on a synthetic merge ref; push events remain guarded.

## Cloudflare policy

Cloudflare is the runtime/data control plane. The Hub writes directly to D1 through the Cloudflare API. No mailbox credentials or API keys are written to repository files or workflow logs.

## 1xAI policy

1xAI is not used for deployment, heartbeat, routine CI, or orchestration. It is called only when the Hub detects a failed/timed-out workflow and only when a matching normalized log fingerprint has no existing D1 cache entry.
