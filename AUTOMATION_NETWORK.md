# Automation Network

Central integration plan for GitHub repositories, Cloudflare Workers, 1xAI, and notification identities.

## Nodes
- workflows-starter-template
- zehnsarmaye
- MindCapital-Ali100
- ALI100-Broker
- cmd
- Cloudflare Workers (configured through GitHub Actions secrets)
- 1xAI API (configured through GitHub Actions secrets)

## Secrets expected in GitHub Actions
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID
- NETWORK_GITHUB_TOKEN
- 1XAI_API_KEY

Never commit secret values to source control.

## Verification
The network workflow should report connectivity without printing secret values.
Qwen Coder and email accounts remain external clients/identities and require their own connector or provider configuration; they are not represented as secrets here.
