# VitaLoom Demo

A time-boxed, end-to-end demo of VitaLoom's core health-tracking workflow. The goal is to prove that mobile input, simulated health events, backend ingestion, persistence, and daily statistics work together in a reproducible local deployment.

> **Demo scope, not production architecture.** Keep the implementation small and observable. Prefer a working vertical slice over extra infrastructure.

## Demo Goals

- Display four health metrics: **heart rate**, **steps**, **sleep**, and **water intake**.
- Generate heart-rate and step events with a simple, behavior-based Go producer.
- Let users enter sleep and water values manually from the mobile app.
- Persist data in MongoDB and expose a small API for the dashboard and producer.
- Run backend infrastructure through Docker Compose, with Nginx as the HTTP entry point.

## Architecture

```text
Expo React Native app (development build / Expo Go)
             |
             | HTTP API
             v
          Nginx
             |
             v
       Spring Boot API
        |           |
        v           v
    MongoDB     Daily statistics

Go Health Metrics Producer
             |
             | HTTP batch ingestion
             v
          Nginx
```

- **Mobile:** Expo + React Native + TypeScript. During development, start Expo on the host; configure the API base URL to an address reachable from the emulator or phone.
- **Gateway:** Nginx routes API requests to Spring Boot.
- **Backend:** One Spring Boot application owns ingestion, manual entries, persistence, and daily statistics.
- **Database:** MongoDB stores raw health events and manual entries. Aggregates may be calculated on request for this demo.
- **Producer:** A separate Go process/container generates heart-rate and step events and submits them through the API. It must not write directly to MongoDB.
- **Deployment:** Docker Compose runs the backend infrastructure. Expo may run outside Compose during development.

## Core Demo Workflow

1. Start the Docker Compose stack.
2. Start the Expo app and open it on an emulator or phone.
3. View today's heart rate, steps, sleep, and water intake.
4. Enter sleep and water values manually.
5. Start the Go producer and send simulated heart-rate and step events through Nginx.
6. Refresh the dashboard and verify that persisted data is reflected in the UI.

## Quick Start

The implementation is planned; commands and environment variables will be added once the service skeletons exist.

1. Install Docker with Docker Compose, Go, Node.js, and the Expo prerequisites for your target device.
2. Copy the example environment file when provided and set local configuration.
3. Start backend services with `docker compose up --build`.
4. Start the mobile app with `npx expo start` from the mobile app directory.
5. Start the producer using the instructions in its directory.

## Scope Boundaries

**In scope**
- One dashboard showing the four metrics.
- Manual sleep and water input.
- Simulated heart-rate and step events.
- Minimal daily statistics and end-to-end verification.
- Local containerized backend deployment through Nginx.

**Out of scope for this time-boxed demo**
- Authentication and SSO.
- Advanced charts, monthly analytics, and personalized insights.
- Redis, Kafka, Kubernetes, microservices, or a separate Go processing service.
- Real Apple Health / HealthKit integration.
- Production hosting, public DNS, and HTTPS.

## Definition of Done

- [ ] Backend infrastructure starts with Docker Compose.
- [ ] Nginx routes requests to the Spring Boot API.
- [ ] MongoDB persists demo data across container restarts.
- [ ] The app displays all four metrics and accepts sleep/water input.
- [ ] The Go producer sends heart-rate and step events through the API.
- [ ] The dashboard reflects persisted data after refresh.
- [ ] The demo can be repeated from documented startup steps.

See [PLAN.md](./PLAN.md) for the time-boxed implementation plan.
