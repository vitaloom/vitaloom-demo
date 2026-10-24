# VitaLoom Demo — Parallel Implementation Plan

## 1. Goal

Complete a small, repeatable, end-to-end demo with two coding agents working in parallel:

- **Go Producer:** generates simulated heart-rate and step events and sends them to Spring Boot.
- **Expo Mobile:** displays the four metrics, accepts water/sleep input, and refreshes the dashboard automatically on a real iPhone.
- **Existing backend:** stays the stable integration boundary.

The success criterion is a working live demo, not production architecture. Do not broaden scope to authentication, real wearable APIs, historical charts, insights, message brokers, or performance benchmarking.

## 2. Current Baseline

The backend has already been merged into `main`. Start both workstreams from the same latest `main` commit. Do not recreate or refactor the backend.

Implemented API surface:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check, including MongoDB connectivity |
| GET | `/api/statistics/daily` | One response containing all four daily metrics |
| POST | `/api/water-intakes` | Store one water-intake action |
| PUT | `/api/sleep/daily` | Create/replace the current local-day sleep value |
| POST | `/api/steps/batch` | Ingest raw step increments |
| POST | `/api/heart-rate/batch` | Ingest raw heart-rate observations |

See [API_CONTRACT.md](./API_CONTRACT.md) for request/response examples, validation, duplicate semantics, and date handling. The contract is shared by both workstreams and must not be changed independently.

## 3. Repository Layout

Keep this demo in one repository for quick integration:

```text
vitaloom-demo/
├── demo/          # Existing Spring Boot + MongoDB + Nginx; do not refactor
├── producer/      # New Go CLI simulator; Account A owns this directory
├── mobile/        # New Expo app; Account B owns this directory
├── API_CONTRACT.md
├── PLAN.md
└── PARALLEL_AGENT_PROMPTS.md
```

## 4. Parallel Work Rules

1. Create two branches from the same current `main`:
   - `feature/go-health-producer`
   - `feature/expo-dashboard`
2. Account A owns only `producer/` and its tests. Account B owns only `mobile/` and its tests.
3. Neither account edits `demo/`, `API_CONTRACT.md`, this plan, or the other account's directory.
4. Use separate worktrees/checkouts or agent sessions with isolated working directories. Do not have two agents modify the same working tree.
5. Commit coherent, verified changes to the assigned branch only. Do not merge to `main` or modify the other branch.
6. If an API contract gap blocks implementation, report the exact gap and proposed change; wait for the integrator to resolve it rather than silently inventing a payload.
7. After implementation, report commands actually run and their results. Never report a test as passing unless it was run.

Both tasks can begin immediately because Producer and Mobile use the existing backend contract and do not need to edit the same files.

## 5. Workstream A — Go Producer

### Toolchain and implementation

- Use the installed Go **1.24.3** for this time-boxed demo; prioritize standard-library packages and avoid dependency setup.
- Keep the simulator as a CLI process under `producer/`, runnable from the host. Dockerizing it is not required.
- Configure the API base URL (default `http://localhost`), batch size, send interval, and duration through flags or environment variables.
- Generate both heart-rate observations and step-increment events. Use plausible simple variation; no elaborate behavior engine is needed.
- Generate a `runId` for each run and a stable unique `eventId` per event. Prefix IDs by metric (for example, `hr-` and `steps-`) because backend event IDs are globally unique in the shared collection.
- Use UTC RFC3339 timestamps ending in `Z`. Steps must be `stepsDelta` increments, not cumulative totals.
- Send to the two existing batch endpoints through Nginx. Do not connect to MongoDB directly.
- Set HTTP timeouts. Retry transient failures a bounded number of times, reusing the same event IDs and exact payload for every retry. Do not silently drop the failed batch.
- Log run ID, events sent, accepted/duplicate counts, failures, and final summary. Support graceful termination (Ctrl+C).
- Do not add Kafka, Redis, a queue, or an external database.

### Producer acceptance criteria

- `go test ./...` passes.
- `go build ./...` succeeds.
- A documented command runs the simulator against `http://localhost` for 60–90 seconds.
- Both ingestion endpoints return expected success responses.
- After a run, `GET /api/statistics/daily` shows heart rate and steps populated or updated.
- Retrying the same batch does not double-count steps or create another observation.
- README documents configuration, example output, and troubleshooting.

> Go 1.24.3 is retained to avoid spending the demo window on a toolchain change. It is an old patch release; revisit the toolchain after the demo rather than treating it as a long-term security/support baseline.

## 6. Workstream B — Expo Mobile

### Toolchain and scaffold

- Create a new Expo + React Native + TypeScript app under `mobile/`.
- Prefer the default Expo Router template unless the minimal single-screen app clearly needs less setup.
- **Target Expo SDK 54 for the physical-iPhone Expo Go path.** During the current Expo SDK transition, the official `create-expo-app` documentation says the unqualified latest template creates SDK 54 for physical-device Expo Go; SDK 57 requires an explicit template. Do not force a newer SDK if the installed iPhone Expo Go cannot load it.
- Use the default command for the Expo Go-compatible scaffold, then inspect the generated `package.json` and run `npx expo-doctor`. Use Node.js LTS and the package lock generated by the chosen package manager.
- Avoid unnecessary UI libraries, chart packages, native modules, and state-management frameworks.

### UI scope

Create one polished, responsive health dashboard in Vietnamese:

- VitaLoom header and current day label.
- A 2-by-2 grid of cards for heart rate (bpm), steps, sleep (hours), and water (mL).
- Visually distinguish metric cards with restrained colors, readable typography, comfortable spacing, and clear units.
- Label heart rate and steps as **simulated** data; do not imply that Apple Health or a real wearable is connected.
- Buttons open a simple modal/bottom sheet or small form to add one water intake or set the daily sleep duration.
- Include loading, no-data (`null`), network-error, and retry states. Preserve the last successful dashboard values when a subsequent polling request fails.
- No historical charts, health insights, login, goals, or multi-screen navigation beyond what is needed to open the forms.

### API and automatic refresh

- Read the API base URL from `EXPO_PUBLIC_API_BASE_URL`. Example: `http://192.168.1.20` when Nginx exposes port 80. Do not hardcode a machine-specific IP and do not use `localhost` on the iPhone.
- Fetch `GET /api/statistics/daily` immediately and auto-poll approximately every **2 seconds** while the app is active.
- Prevent overlapping dashboard requests; stop/clean up timers and abort or ignore stale responses when the screen unmounts or the app goes to the background.
- After a successful water or sleep write, refresh the dashboard immediately.
- Water writes use `POST /api/water-intakes` with a new stable `intakeId` for each user action. A retry of the same action must reuse the same ID and payload.
- Sleep writes use `PUT /api/sleep/daily`. Use the server response and refresh the dashboard; do not treat local state as authoritative.
- Use the exact JSON contract from [API_CONTRACT.md](./API_CONTRACT.md).

### iPhone connectivity gate

Do this early, before spending time on visual polish:

1. Start backend Compose on the PC and confirm `http://localhost/api/health` returns HTTP 200.
2. Find the PC's LAN IPv4 using `ipconfig`.
3. On Safari on the iPhone, open `http://<PC-LAN-IP>/api/health`. Both devices must be on a network that allows LAN connections; allow Windows Firewall access to the relevant port.
4. Set `EXPO_PUBLIC_API_BASE_URL` to the PC's reachable LAN URL and scan the Expo QR code.
5. If Safari can reach the API but the app cannot, check iOS Local Network permission for Expo Go, the actual request URL, and device logs before changing the backend. Expo Metro tunnel may help download the development bundle, but it does not automatically expose the backend API to the phone.
6. If the installed Expo Go rejects the project SDK, align the scaffold with the SDK supported by the installed app before continuing.

### Mobile acceptance criteria

- `npx expo-doctor` passes, or any remaining warning is explained and shown to be non-blocking.
- TypeScript check passes (use the project script or `npx tsc --noEmit` when configured).
- The app opens on the actual iPhone using Expo Go.
- Dashboard values come from the backend; no hardcoded sample data is presented as live data.
- Polling updates the screen without manually pressing refresh and does not spawn overlapping requests.
- Water can be added multiple times; sleep can be edited; results persist after reload.
- README explains setup, environment configuration, iPhone LAN connectivity, and startup commands.

## 7. Integration and Demo Sequence

Integrate only after each workstream reports its own checks and opens a reviewable diff.

1. Review Account A's diff, run Go tests/build, and verify both batch endpoints with the live backend.
2. Review Account B's diff, run Expo doctor/typecheck, and open the app on the real iPhone.
3. Merge the branches one at a time after checks pass. Do not merge both blindly or let either agent merge its own branch into `main`.
4. Start the backend from `demo/` using the existing Compose instructions.
5. Start Expo from `mobile/` and open it on the iPhone.
6. Start Producer from `producer/` and let it run for 60–90 seconds.
7. On the iPhone, observe heart rate and steps updating without manual refresh.
8. Add two water intakes, update sleep, and confirm the displayed totals/values.
9. Reload the app, check persistence, run the existing Postman collection if needed, and rehearse the demo once.

## 8. Definition of Done

- [ ] Backend stack is healthy and reachable through Nginx.
- [ ] Producer tests/build pass and both simulated metric streams persist.
- [ ] Expo doctor/typecheck pass and the app runs on a physical iPhone.
- [ ] Dashboard shows all four values and uses `null` correctly when a metric has no data.
- [ ] Dashboard polling refreshes approximately every 2 seconds while active, without overlapping requests.
- [ ] Water retry does not double-count; sleep update replaces the daily value.
- [ ] The full flow is repeatable from documented commands.
- [ ] Both agents provide test evidence and a short list of changed files/known limitations.

## 9. Explicit Non-Goals

- Real HealthKit/Apple Health integration.
- Authentication or user-specific data isolation.
- Historical analytics, charts, personalized insights, notifications, or background processing.
- Kafka, Redis, Kubernetes, microservices, or direct database access from Producer/mobile.
- Public internet deployment, public DNS, HTTPS setup, or performance claims.

**Success means the four dashboard metrics can be demonstrated on an iPhone, with sleep and water entered manually and heart rate/steps updated automatically from the Go Producer through Spring Boot.**

See [PARALLEL_AGENT_PROMPTS.md](./PARALLEL_AGENT_PROMPTS.md) for the ready-to-copy task prompts.
