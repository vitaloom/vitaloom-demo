# VitaLoom Demo — Current Status and Acceptance Record

## 1. Goal

This repository is a time-boxed, local end-to-end demo of four health metrics:

- **Heart rate and steps:** simulated by the Go Producer.
- **Sleep and water:** entered manually in the Expo mobile app.
- **Backend:** Spring Boot API behind Nginx, with MongoDB persistence and a daily statistics endpoint.

The implementation has been merged to `main`. Treat this file as the current status/runbook, not as an instruction to recreate the already-merged workstreams.

## 2. Current implementation status

| Area | Current status | Evidence / notes |
|---|---|---|
| Spring Boot + MongoDB + Nginx | Implemented; owner confirmed the local backend runs | API details remain in [API_CONTRACT.md](./API_CONTRACT.md) |
| Go Producer | Merged to `main` | [PR #2](https://github.com/vitaloom/vitaloom-demo/pull/2); PR reports Go test/vet/race/build checks |
| Expo Mobile | Merged to `main` | [PR #3](https://github.com/vitaloom/vitaloom-demo/pull/3); current `mobile/package.json` uses Expo `~57.0.31` and React Native `0.86.3` |
| Manual end-to-end on owner's iPhone | **Confirmed by project owner** | Owner starts Expo, signs in with the Expo account used for this demo, scans the QR code, and runs the app on their iPhone |
| Access from another person's Expo account/device | **Not yet established** | Owner reports others cannot independently open the current demo unless using the owner's Expo account |
| Expo Doctor / TypeScript checks | No result recorded in this status document | Do not infer these passed just because the app launched |
| Full Postman Collection Runner | No result recorded | Collection documents expected assertions; run it separately if this evidence is needed |

**Verification language:** distinguish the owner's manual E2E confirmation from automated checks and from cross-account sharing. Do not label the entire demo “untested”; likewise, do not claim all automated checks passed without recorded results.

## 3. Architecture and API surface

- Expo Mobile: `mobile/`
- Go Producer: `producer/`
- Backend Compose stack: `demo/`
- API contract: [API_CONTRACT.md](./API_CONTRACT.md)
- Postman collection: [demo/postman/VitaLoom-Health-Ingestion.postman_collection.json](./demo/postman/VitaLoom-Health-Ingestion.postman_collection.json)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/statistics/daily` | All four current-day metric values |
| POST | `/api/water-intakes` | Store a water-intake action |
| PUT | `/api/sleep/daily` | Create/replace today's sleep duration |
| POST | `/api/steps/batch` | Ingest raw step increments |
| POST | `/api/heart-rate/batch` | Ingest heart-rate observations |

Daily statistics use `Asia/Ho_Chi_Minh`. Missing metrics are represented by `null`, not zero. Authentication and per-user data isolation are not implemented.

## 4. Rehearse the current demo

### Terminal 1 — backend

From the repository root:

```bash
cd demo
docker compose up -d --build
docker compose ps
```

Confirm `http://localhost/api/health` returns HTTP 200.

### Terminal 2 — Producer

```bash
cd producer
go run . --api-base-url http://localhost --batch-size 5 --interval 2s
```

Use `--duration 90s` for a bounded run. Press Ctrl+C to stop an unlimited run.

### Terminal 3 — Expo

Set `mobile/.env` to the backend URL reachable by the iPhone:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://YOUR-PC-LAN-IP
```

Do not use `localhost` for a phone connecting to the PC backend. Then:

```bash
cd mobile
npm install
npx expo start
```

Use the currently confirmed Expo-account/QR-code flow on the owner's iPhone. For another device, ensure it can reach the PC's LAN API and note that cross-account Expo access has not yet been verified. See [README.md](./README.md) and [mobile/README.md](./mobile/README.md) for setup details.

## 5. Current verification record

### Confirmed

- The owner reports that the local backend runs.
- The owner confirms that the Expo app launches on their iPhone after signing in with their current Expo account and scanning the QR code.
- The owner reports the overall E2E demo is running. Record this as a **manual owner-confirmed E2E**, not as an automated test result.
- Producer PR #2 reports these commands passed in its agent environment: `go test ./...`, `go vet ./...`, `go test -race ./...`, `go build ./...`, Windows amd64 cross-build, and `go run . --help`. The reported Go version was 1.23.2, not the former planned 1.24.3.

### Not recorded as completed

- `npx expo-doctor`
- `npx tsc --noEmit`
- A full run of the Postman Collection Runner
- Access and full workflow validation using a second Expo account/device
- A public/shared deployment of the backend

This list describes the evidence currently recorded in the repository; it is not a claim that the owner has not run any of these commands locally.

## 6. Known limitations and next checks

- The current Expo sharing path works for the owner, but independent access by other accounts has not been established. Investigate Expo project/session sharing separately from API networking rather than assuming the backend is the cause.
- The backend is hosted locally. Another phone needs network reachability to the host PC, and a Metro tunnel does not by itself expose the API.
- The API has no authentication or user-level data separation. Do not expose this demo as a multi-user service with real health data.
- The checked-in mobile app does not currently record a committed npm lockfile; after confirming the intended install, commit the package-manager lockfile to improve reproducibility.
- Run Expo Doctor/typecheck and the Postman collection if formal evidence for those checks is required.

The goal is a repeatable demo, not production readiness. Do not add new infrastructure or broaden scope just to improve this acceptance record.
