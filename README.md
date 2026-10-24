# VitaLoom Demo

A runnable, local end-to-end demo of VitaLoom's core health-tracking workflow. It combines an Expo mobile dashboard, a Go producer for simulated heart-rate/step events, a Spring Boot API, MongoDB persistence, and Nginx as the API entry point.

> **Demo scope, not production architecture.** The backend is local, authentication and user-specific data isolation are not implemented, and this is not a public production deployment.

## Current status

- **Backend:** Spring Boot + MongoDB + Nginx stack is implemented and has been confirmed running locally by the project owner.
- **Go Producer:** merged to `main` in [PR #2](https://github.com/vitaloom/vitaloom-demo/pull/2). It generates simulated heart-rate and step events and sends them through Nginx.
- **Expo Mobile:** merged to `main` in [PR #3](https://github.com/vitaloom/vitaloom-demo/pull/3). The app displays all four metrics, supports manual sleep/water input, and polls daily statistics while foregrounded.
- **End-to-end:** the project owner has confirmed that the demo runs on their iPhone after starting the Expo session, signing in with their current Expo account, and scanning the QR code.
- **Sharing limitation:** the owner reports that other people cannot currently open the demo independently unless using the owner's Expo account. The current sharing/access path has not been generalised or verified for other accounts. The backend is also local, so a second device needs network access to the PC hosting it.

This is a manual E2E confirmation, not a claim that every optional automated check (Expo Doctor, TypeScript, Postman Collection Runner, or testing on another account/device) has passed. See [PLAN.md](./PLAN.md) for the current verification record and remaining limitations.

## Architecture

```text
Expo Go on iPhone
       |  HTTP API
       v
     Nginx
       |
       v
 Spring Boot API ------> MongoDB
       ^
       |  HTTP batches
 Go Health Metrics Producer

Expo app also calls the API to read daily statistics and write sleep/water entries.
```

- **Mobile:** Expo + React Native + TypeScript, under `mobile/`.
- **Gateway:** Nginx routes API requests to Spring Boot.
- **Backend:** Spring Boot owns ingestion, manual entries, persistence, and daily statistics.
- **Database:** MongoDB stores raw health events and manual entries.
- **Producer:** a separate Go CLI generates simulated heart-rate and step events; it never connects to MongoDB directly.
- **Deployment:** Docker Compose runs the backend infrastructure. Expo and the Go Producer run on the host during this demo.

## Quick start

### 1. Start the backend

Prerequisites: Docker with Compose, Go 1.23+, Node.js/npm, and Expo Go on the target iPhone.

In Terminal 1, from the repository root:

```bash
cd demo
docker compose up -d --build
docker compose ps
```

Confirm the API is healthy from the PC:

```text
http://localhost/api/health
```

The response should be HTTP 200. If you changed the Nginx host port, use that port in the URLs below.

### 2. Start the Go Producer

In Terminal 2, from the repository root:

```bash
cd producer
go run . --api-base-url http://localhost --batch-size 5 --interval 2s
```

The producer runs continuously until Ctrl+C. To run a short session instead, add `--duration 90s`. It sends simulated heart-rate and step-increment batches through Nginx.

### 3. Start Expo and open the iPhone app

For the iPhone to reach a backend running on the PC, configure the PC's reachable LAN IPv4 address rather than `localhost`.

In Terminal 3, from the repository root:

```powershell
cd mobile
Copy-Item .env.example .env
```

Edit `mobile/.env` and set:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://YOUR-PC-LAN-IP
```

For example, use `http://192.168.1.20` only if that is the PC's actual LAN address and Nginx is exposed on port 80. Then run:

```bash
npm install
npx expo start
```

Sign in with the Expo account used for the current verified demo path, then scan the QR code with Expo Go on the iPhone. Keep the PC and iPhone on a network that permits LAN traffic, and allow the relevant port through Windows Firewall if needed. You can first test connectivity by opening `http://YOUR-PC-LAN-IP/api/health` in Safari on the iPhone.

The current owner-confirmed flow works on the owner's iPhone/account. Access from a different Expo account or device is a known sharing limitation, not a verified supported workflow yet. Metro tunnel mode, by itself, does not make the PC's backend publicly reachable.

## What the demo supports

- Displays heart rate (bpm), steps, sleep (hours), and water intake (mL).
- Labels heart rate and steps as simulated values from the Go Producer; it does not connect to Apple Health/HealthKit or a real wearable.
- Accepts manual water-intake entries and daily sleep-duration updates from the mobile app.
- Stores raw health events and manual entries in MongoDB.
- Reads the combined current-day dashboard from `GET /api/statistics/daily`.
- Refreshes the dashboard approximately every two seconds while the app is foregrounded.

See [API_CONTRACT.md](./API_CONTRACT.md) for the API schema and idempotency contract, [producer/README.md](./producer/README.md) for Producer options, and [mobile/README.md](./mobile/README.md) for mobile setup.

## Verification notes

- The project owner has manually confirmed that the end-to-end demo opens and runs on their iPhone through Expo Go using the QR-code flow.
- PR #2 reports successful Go tests, vet, race checks, and build in the agent environment; that environment used Go 1.23.2 rather than the earlier plan's target of 1.24.3.
- The successful iPhone demo does not imply that `npx expo-doctor`, `npx tsc --noEmit`, or the full Postman Collection Runner has been run. Those results are not recorded here.
- Other-account access and a repeatable sharing/deployment setup remain unverified.

## Scope boundaries

Out of scope for this local demo: authentication, user-specific data isolation, real Apple Health/HealthKit integration, advanced historical charts or insights, Redis/Kafka/Kubernetes, a separate real-time processing service, public hosting, public DNS, and HTTPS.

See [PLAN.md](./PLAN.md) for current status, how to rehearse the demo, and remaining checks.
