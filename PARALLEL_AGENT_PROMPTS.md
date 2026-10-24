# Historical Prompts — Parallel Demo Implementation

> **Status: completed.** These are the original prompts used to implement the Go Producer and Expo Mobile workstreams. Both workstreams have been merged to `main` (Producer: [PR #2](https://github.com/vitaloom/vitaloom-demo/pull/2), Mobile: [PR #3](https://github.com/vitaloom/vitaloom-demo/pull/3)). Do not copy and run these as new tasks against the current repository. For current setup and acceptance status, use [README.md](./README.md) and [PLAN.md](./PLAN.md).

The prompts are retained as implementation history and as a record of the original scope, acceptance criteria, and handoff expectations. Some toolchain/branch instructions below describe the earlier implementation phase and are not current setup instructions.

## Account A — Go Health Metrics Producer

```text
You own only the producer/ directory in https://github.com/vitaloom/vitaloom-demo.

Branch: feature/go-health-producer
Start from the latest main commit. Work in an isolated checkout/worktree; do not share a working tree with the mobile agent.

Before coding, read API_CONTRACT.md and the relevant PLAN.md section. The backend is already implemented and merged. Do not edit demo/, mobile/, API_CONTRACT.md, PLAN.md, README.md at repository root, or files outside producer/. Do not change the backend contract, push directly to main, or merge branches.

Build a small Go CLI simulator under producer/ for simulated heart-rate and step events. Prefer the standard library, avoid adding third-party dependencies unless essential, and do not require Dockerizing the Producer.

Requirements:
- Configure API base URL, batch size, interval, and duration.
- Generate stable event IDs and UTC RFC3339 timestamps; stepsDelta must be increments.
- Send through the existing /api/heart-rate/batch and /api/steps/batch endpoints.
- Use timeouts and bounded retries with identical IDs/payloads.
- Handle Ctrl+C, log outcomes, and provide a useful final summary.
- Never connect to MongoDB directly.
- Include focused tests and a README.

Verification and handoff:
- Run and report Go tests/build and available integration checks.
- State which checks actually ran; do not claim live integration without evidence.
- Commit coherent changes to the assigned branch and do not merge it yourself.
```

## Account B — Expo iPhone Dashboard

```text
You own only the mobile/ directory in https://github.com/vitaloom/vitaloom-demo.

Branch: feature/expo-dashboard
Start from the latest main commit. Work in an isolated checkout/worktree; do not share a working tree with the Producer agent.

Before coding, read API_CONTRACT.md and the relevant implementation plan. The backend is already implemented and merged. Do not edit demo/, producer/, API_CONTRACT.md, PLAN.md, README.md at repository root, or files outside mobile/. Do not change the backend contract, push directly to main, or merge branches.

Build a minimal Expo + React Native + TypeScript mobile dashboard:
- Show heart rate, steps, sleep, and water; label heart rate and steps as simulated.
- Let users enter water and daily sleep values.
- Read EXPO_PUBLIC_API_BASE_URL; use a reachable PC LAN address on a physical iPhone, not localhost.
- Read /api/statistics/daily and poll while the app is active, avoiding overlapping requests.
- Refresh after successful sleep/water writes.
- Handle loading, null data, failures, retry, and stale successful values.
- Do not add HealthKit, real wearable integration, historical charts, insights, authentication, or unrelated infrastructure.

Verification and handoff:
- Report Expo Doctor and TypeScript results, if run.
- Verify on the physical iPhone when possible, and distinguish code checks from device checks.
- State which checks actually ran and summarize remaining limitations.
- Commit coherent changes to the assigned branch only; do not merge it.
```

## Original integration checklist

These were the intended close-out steps during implementation. The owner has since confirmed the demo runs end-to-end on their own iPhone, so this is retained as history rather than a claim that no integration has happened.

- Review each branch diff and recorded evidence.
- Run Producer tests/build and mobile static checks.
- Run the backend, Producer, and Expo together; check the iPhone dashboard and manual inputs.
- Record any remaining automated-check and cross-account-sharing gaps.
