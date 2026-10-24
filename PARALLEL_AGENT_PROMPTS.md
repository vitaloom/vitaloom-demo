# Ready-to-Copy Prompts — Parallel Demo Work

Use these prompts in two separate coding-agent sessions. Create each branch from the same latest `main` commit and use separate working directories/worktrees. Neither agent may merge into `main`.

## Account A — Go Health Metrics Producer

```text
You own only the producer/ directory in https://github.com/vitaloom/vitaloom-demo.

Branch: feature/go-health-producer
Start from the latest main commit. Work in an isolated checkout/worktree; do not share a working tree with the mobile agent.

Before coding, read API_CONTRACT.md and the relevant PLAN.md section. The backend is already implemented and merged. Do not edit demo/, mobile/, API_CONTRACT.md, PLAN.md, README.md at repository root, or files outside producer/. Do not change the backend contract, push directly to main, or merge branches.

Build a small Go CLI simulator under producer/ for simulated heart-rate and step events. Use the installed Go 1.24.3 for this deadline-constrained demo, prefer the standard library, and avoid adding third-party dependencies unless essential. Dockerizing the Producer is not required.

Requirements:
- Configurable API base URL (default http://localhost), batch size, send interval, and run duration via flags or environment variables.
- Generate one runId per process run and a stable unique eventId per event. Prefix IDs by metric (e.g. hr- and steps-) because event IDs are globally unique in the backend collection.
- Send heart-rate observations to POST /api/heart-rate/batch and step increments to POST /api/steps/batch, using the exact payloads in API_CONTRACT.md.
- Use UTC RFC3339 timestamps ending in Z. stepsDelta must be increments, never a cumulative step count.
- Keep the simulation simple and visible in 60–90 seconds. Use plausible values; do not claim data is from a real wearable.
- Set request timeouts. Retry transient failures a bounded number of times with the exact same batch body and event IDs; never regenerate event IDs or change payload while retrying.
- Handle Ctrl+C gracefully; log HTTP outcomes, accepted/duplicate counts, retry failures, and a short final summary.
- Never connect to MongoDB directly; all event ingestion must go through the API/Nginx.
- Include unit tests for event generation, payload/id stability, configuration validation, and/or retry logic where practical.
- Add producer/README.md with setup, configuration, command examples, expected output, and troubleshooting.

Verification:
- Run and report go test ./... and go build ./....
- Run against the backend through http://localhost for 60–90 seconds if the local backend is available, and confirm GET /api/statistics/daily has populated heartRateBpm and steps.
- State clearly which checks were actually run and include their results. Do not claim a live integration test if the local backend was not available.
- Commit coherent verified changes to this branch only. Do not merge it. At handoff, summarize changed files, commands/results, usage, and known limitations.
```

## Account B — Expo iPhone Dashboard

```text
You own only the mobile/ directory in https://github.com/vitaloom/vitaloom-demo.

Branch: feature/expo-dashboard
Start from the latest main commit. Work in an isolated checkout/worktree; do not share a working tree with the Go Producer agent.

Before coding, read API_CONTRACT.md and the relevant PLAN.md section. The backend is already implemented and merged. Do not edit demo/, producer/, API_CONTRACT.md, PLAN.md, README.md at repository root, or files outside mobile/. Do not change the backend contract, push directly to main, or merge branches.

Create a new Expo + React Native + TypeScript app under mobile/. Target the physical-iPhone Expo Go path. During the current Expo SDK transition, the official create-expo-app documentation says the unqualified latest scaffold creates SDK 54 for physical-device Expo Go, while newer SDKs require compatible builds. Start with:
  npx create-expo-app@latest mobile
Then inspect package.json, run npx expo-doctor, and verify that the project's SDK is compatible with the Expo Go installed on the actual iPhone. Use Node.js LTS. Do not force a newer SDK if that prevents launching on the phone.

UI requirements:
- Build one polished, mobile-first VitaLoom dashboard in Vietnamese: restrained health/wellness style, light background, dark readable text, teal primary accent, comfortable spacing.
- Show four cards in a 2x2 layout: heart rate (bpm), steps, sleep (hours), water (mL). Clearly label heart rate and steps as simulated; do not imply Apple Health/HealthKit or a real wearable is connected.
- Provide a simple modal/form to add one water intake and a form to create/update daily sleep duration.
- Handle loading, null/no-data, network errors, retry, and write validation. Preserve the last successful dashboard data if a later refresh fails.
- Do not implement historical charts, insights, authentication, HealthKit, a WebSocket, or extra navigation unless absolutely required.

API requirements:
- Read the base URL from EXPO_PUBLIC_API_BASE_URL. For the physical iPhone it must be the PC's LAN address, e.g. http://192.168.1.20 if Nginx exposes port 80. Never hardcode that example or use localhost on the iPhone.
- Read the dashboard using GET /api/statistics/daily and auto-poll about every 2 seconds while the app is active.
- Prevent overlapping requests. Clean up timers and stale state on unmount/background; avoid continuing rapid polling while the app is inactive.
- Refresh immediately after successful water/sleep writes.
- Water: POST /api/water-intakes with a client-generated intakeId stable for the same action/retry; match API_CONTRACT.md semantics.
- Sleep: PUT /api/sleep/daily. Treat the server as source of truth.
- Do not hardcode demo metrics as live results. Use the exact DTO fields/paths in API_CONTRACT.md.

Test iPhone connectivity early:
1. Start the backend Compose stack on the PC; confirm http://localhost/api/health returns 200.
2. Find the PC LAN IPv4 with ipconfig.
3. On iPhone Safari, open http://<PC-LAN-IP>/api/health. Both devices need a network that permits LAN traffic; allow Windows Firewall access to the relevant port.
4. Set EXPO_PUBLIC_API_BASE_URL to the reachable PC URL and start Expo.
5. If Safari reaches the backend but app fetch fails, check the actual URL, iOS Local Network permission for Expo Go, and error logs before changing backend/Nginx. Expo Metro tunnel does not automatically expose the backend API to the phone.
6. If Expo Go reports SDK incompatibility, align the scaffold to the SDK supported by the installed Expo Go instead of continuing with a broken combination.

Verification:
- Run and report npx expo-doctor and TypeScript check (e.g. npx tsc --noEmit if supported).
- Open the app on the actual iPhone using Expo Go when device access is available.
- Verify dashboard polling visibly updates without manual refresh, writes water/sleep through the API, and refreshes after a write.
- State which checks were actually run; don't claim a physical-device test without doing one.
- Commit coherent verified changes to this branch only. Do not merge it. At handoff, list changed files, commands/results, iPhone setup steps, and known limitations.
```

## Integrator checklist

After both agents hand off:
1. Review each branch diff and the evidence they provide.
2. Run Producer tests/build and Expo doctor/typecheck.
3. Merge one branch at a time only after the checks pass.
4. Run the backend, Producer, and Expo together; verify the dashboard changes on the iPhone without manual refresh.
5. Rehearse the full demo before considering the task done.
