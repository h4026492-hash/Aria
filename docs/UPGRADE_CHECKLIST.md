# Aria Upgrade & SadTalker Integration - Task Checklist

This checklist is formatted for GitHub Copilot Agent mode and for creating issues or a project board. Each top-level item is a work item and can be expanded into smaller tasks. Use the `assignee:` and `estimate:` fields as hints for automation.

- [ ] **1. Server: Add simple token auth**
  - assignee: @<your-team-member>
  - estimate: 1d
  - priority: high
  - description: Add token-based auth to `server/server.py` (env var `SADTALKER_API_KEY`), validate incoming requests for `/talk` and `/speak`, return 401 on invalid token, and add tests.
  - subtasks:
    - [ ] Add middleware to check `Authorization: Bearer <key>` or `x-api-key` header
    - [ ] Add test coverage: valid/invalid/no key
    - [ ] Document env var and usage in `docs/SADTALKER.md`

- [ ] **2. Server: Harden caching layer (filesystem -> options)**
  - assignee: @<your-team-member>
  - estimate: 2d
  - priority: high
  - description: Improve caching implemented in `server/server.py` — add TTL, max cache size, safe eviction, and optional S3 backend.
  - subtasks:
    - [ ] Add TTL (configurable via `SADTALKER_CACHE_TTL` in seconds)
    - [ ] Add max cache size and LRU/eviction policy
    - [ ] Implement optional S3/remote store (env ENABLE_S3_CACHE + S3 creds)
    - [ ] Expose cache hit/miss metrics (prometheus style)
    - [ ] Add tests covering cache hits and eviction

- [ ] **3. Client: Send API key and support cache responses**
  - assignee: @<your-team-member>
  - estimate: 0.5d
  - priority: high
  - description: Update `src/services/sadTalkerService.ts` to include `SADTALKER_API_KEY` via app settings and detect cached video responses to skip re-downloads when possible.
  - subtasks:
    - [ ] Add header injection in requests
    - [ ] Add retry/backoff for transient failures
    - [ ] Detect `Cache-Control` or `X-Cache-Hit` headers and show cached indicator in UI

- [ ] **4. Server: Rate limiting & abuse protection**
  - assignee: @<your-team-member>
  - estimate: 1d
  - priority: high
  - description: Prevent abusive usage by adding per-IP or per-key rate limiting (requests per minute) and return 429 when limit exceeded.
  - subtasks:
    - [ ] Add in-memory or Redis backed rate limiter
    - [ ] Tests for limit enforcement
    - [ ] Doc note about safe quotas

- [ ] **5. Server: TLS, Auth proxy & production deployment**
  - assignee: @<your-team-member>
  - estimate: 1d
  - priority: medium
  - description: Provide sample `nginx` config, TLS (Let's Encrypt) instructions, and run server behind a reverse proxy. Add a Dockerfile and example docker-compose for local deployments.
  - subtasks:
    - [ ] Add `Dockerfile` for server (lightweight python base)
    - [ ] Add `docker-compose.yml` with optional volume mounts and SADTALKER_ROOT env
    - [ ] Add sample `nginx` config and docs for TLS

- [ ] **6. Server: Logging, metrics, and observability**
  - assignee: @<your-team-member>
  - estimate: 1d
  - priority: medium
  - description: Add structured logs, simple Prometheus metrics (render_time_seconds, cache_hit_total, cache_miss_total), and a `/metrics` endpoint.
  - subtasks:
    - [ ] Integrate Prometheus client for Python
    - [ ] Expose metrics at `/metrics`
    - [ ] Add log levels and request IDs for tracing

- [ ] **7. CI & Tests: Add automated tests and GH Actions**
  - assignee: @<your-team-member>
  - estimate: 2d
  - priority: high
  - description: Add unit and integration tests for server (auth, caching, speak/talk endpoints), and add a GitHub Actions workflow that runs tests on PRs.
  - subtasks:
    - [ ] Write pytest tests for server endpoints (mock SadTalker inference)
    - [ ] Add linting step (flake8/ruff for python, eslint for JS/TS)
    - [ ] Add GH Actions workflow to run tests and lint on PR

- [ ] **8. Security: Secrets and scanning**
  - assignee: @<your-team-member>
  - estimate: 0.5d
  - priority: high
  - description: Ensure no secrets are committed, add sample `.env.example`, and add docs for using GitHub secret scanner & push protection.
  - subtasks:
    - [ ] Add `.env.example` file and docs
    - [ ] Document how to regenerate if a secret was leaked
    - [ ] Suggest repository push protection rules (already observed in the repo)

- [ ] **9. App: Automatic TTS → Upload flow improvement**
  - assignee: @<your-team-member>
  - estimate: 1d
  - priority: medium
  - description: Add a client workflow to automatically generate TTS on the client (or server), upload to `/talk`, and show video once ready; optionally pre-warm videos for likely replies.
  - subtasks:
    - [ ] Add a background queue to call `/speak` in advance for predicted replies
    - [ ] Add UI indicator for pre-warmed video availability
    - [ ] Add local caching of returned MP4 blobs for quick replay

- [ ] **10. UX: Show cache & provider info in UI**
  - assignee: @<your-team-member>
  - estimate: 0.5d
  - priority: low
  - description: Update `DIDVideoAvatar` and call screens to show `provider` badge (D-ID, SadTalker) and whether the video came from cache.
  - subtasks:
    - [ ] Add `cached` state and show `Cached` badge
    - [ ] Add tooltips explaining provider & cache

- [ ] **11. Optional: S3/Blob storage and expiration lifecycle**
  - assignee: @<your-team-member>
  - estimate: 1d
  - priority: medium
  - description: Add optional S3 or blob storage for MP4s with lifecycle policies and server-side signed URLs for serving large files.
  - subtasks:
    - [ ] Add S3 upload path and signed URL generation
    - [ ] Add cleanup policy for expired objects

- [ ] **12. Optional: GPU provisioning & automation**
  - assignee: @<your-team-member>
  - estimate: 2d
  - priority: low
  - description: Provide sample Terraform or cloud CLI commands to provision a GPU VM (NVIDIA T4), install dependencies via script, and start the SadTalker service.
  - subtasks:
    - [ ] Add `scripts/provision_gpu.sh` template (user fills in cloud provider details)
    - [ ] Add `README` checklist for running SadTalker on GPU

- [ ] **13. Documentation & onboarding**
  - assignee: @<your-team-member>
  - estimate: 1d
  - priority: high
  - description: Update `docs/SADTALKER.md` with complete examples for running the server, auth, caching, and test scripts. Add quick-start and troubleshooting sections.
  - subtasks:
    - [ ] Add troubleshooting steps for common errors (models missing, permission errors)
    - [ ] Add examples for curl, web UI and Node test script

- [ ] **14. Release & PR checklist**
  - assignee: @<your-team-member>
  - estimate: 0.5d
  - priority: low
  - description: Create a PR template, release notes snippet, and assign the PR to reviewers.
  - subtasks:
    - [ ] Create `.github/pull_request_template.md`
    - [ ] Add release notes draft

---

How to use this with Copilot agent mode:
1. Create issues from each checked item you want to assign automatically.
2. Let the Copilot agent pick one issue at a time (small, atomic commits preferred).
3. Use branch naming pattern `sadtalker/<task-short-name>` and open PRs for review.

If you want, I can split these into GitHub issues and open a draft milestone — tell me which items to prioritize and I will create the issues and assign them.
