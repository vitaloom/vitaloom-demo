# VitaLoom Demo — Implementation Plan

## 1. Objective

Build a runnable end-to-end demo in approximately **3 focused hours**, starting from empty application repositories. The target is a credible vertical slice, not a production-ready MVP.

**Primary path:** Expo mobile app → Nginx → Spring Boot API → MongoDB  
**Data simulation path:** Go producer → Nginx → Spring Boot API → MongoDB → dashboard

## 2. Time Box and Priorities

| Time | Work package | Exit criteria |
|---|---|---|
| 00:00–00:15 | Align API contract and create minimal project skeletons | One agreed event shape, endpoint list, and service layout |
| 00:15–01:05 | Backend, MongoDB, Nginx, Docker Compose | Compose starts; health endpoint works through Nginx; data can be stored |
| 01:05–01:40 | Go producer | Producer sends heart-rate and step events to the ingestion endpoint |
| 01:40–02:25 | Expo dashboard and manual input | One screen displays four metrics and submits sleep/water entries |
| 02:25–03:00 | End-to-end verification and demo rehearsal | Simulated and manual data are visible after reloading the dashboard |

**Time-box rule:** If a work package overruns, cut optional polish rather than extending the scope. Prioritize a functioning API, one screen, producer ingestion, and a repeatable demo.

## 3. Functional Scope

### Required metrics

| Metric | Source | Demo behavior |
|---|---|---|
| Heart rate (bpm) | Go producer | Emits plausible values; activity may raise heart rate, followed by recovery |
| Steps (count) | Go producer | Cumulative or incremental values follow a simple activity scenario |
| Sleep (hours) | Mobile form | User enters a value for the current day |
| Water intake (mL) | Mobile form | User enters a value for the current day |

Keep simulation intentionally simple: one reproducible activity scenario is sufficient. Do not spend the time building a sophisticated simulation engine.

### Minimal user experience

- A single dashboard for today's four metrics.
- A form to save sleep duration and water intake.
- A refresh/reload path to retrieve persisted values.
- Clear loading and error states where feasible.

Authentication, complex navigation, advanced charts, monthly analytics, and insights are excluded from this demo.

## 4. Minimal API Contract

Agree on these endpoints before implementing clients:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Verify that the API is reachable |
| GET | `/api/statistics/daily` | Retrieve today's four metrics |
| POST | `/api/health-events/batch` | Accept simulated heart-rate and step events |
| PUT | `/api/manual-entries/daily` | Save today's sleep and water values |

Example batch payload (illustrative; finalize before coding):

```json
{
  "runId": "demo-run-001",
  "events": [
    {
      "eventId": "event-001",
      "type": "HEART_RATE",
      "occurredAt": "2026-10-24T09:00:00Z",
      "value": 92,
      "unit": "bpm"
    },
    {
      "eventId": "event-002",
      "type": "STEPS",
      "occurredAt": "2026-10-24T09:00:00Z",
      "value": 12,
      "unit": "steps"
    }
  ]
}
```

The exact schema can be simplified, but the producer and backend must use the same contract. Use timestamps consistently, validate metric types and ranges, and do not treat missing data as zero.

## 5. Deployment Plan

Docker Compose should run only the required backend infrastructure:

- **Nginx:** expose one host port and proxy API routes to Spring Boot.
- **Spring Boot:** one backend application for ingestion, manual entries, persistence, and daily statistics.
- **MongoDB:** internal service with a named volume for demo data.

The Expo development server runs on the host with `npx expo start`; it does not need to run in Docker for this demo. The mobile app must use an API base URL reachable from its runtime:
- Android emulator: typically use the emulator's host-loopback address, such as `10.0.2.2`, with the mapped Nginx port.
- Physical phone: use the development computer's LAN IP and ensure both devices can reach each other.
- Do not use `localhost` from a phone/emulator to refer to the host computer.

The Go producer may run on the host or in Compose. In either case, configure it to reach Nginx. When running inside Compose, use the Nginx service name and container port; when running on the host, use the mapped host port.

Do not expose MongoDB publicly. Redis, Kafka, Kubernetes, HTTPS, and public DNS are not required for the local demo.

## 6. Verification Checklist

### Infrastructure
- [ ] `docker compose up --build` starts the required services.
- [ ] Nginx can reach Spring Boot and forwards the health endpoint.
- [ ] MongoDB is reachable by Spring Boot and retains data in its volume.

### API and producer
- [ ] Valid event batches are accepted.
- [ ] Invalid event payloads return a clear client error.
- [ ] The producer can submit multiple batches through Nginx.
- [ ] Re-running the producer does not accidentally overwrite unrelated manual entries.

### Mobile
- [ ] Dashboard loads today's data from the API.
- [ ] Sleep and water can be saved and retrieved.
- [ ] Heart rate and steps appear after producer events are ingested.
- [ ] API connection works on the actual demo device/emulator.

### End-to-end
- [ ] Start infrastructure.
- [ ] Open the Expo app.
- [ ] Save sleep and water values.
- [ ] Run the producer.
- [ ] Refresh the dashboard and show all four metrics.

## 7. Demo Script (2–3 Minutes)

1. Show the Compose services running.
2. Open the VitaLoom app and show the four metric cards.
3. Enter sleep and water values and save.
4. Run the Go producer and show that event batches are accepted.
5. Refresh the dashboard and demonstrate updated heart-rate and step data alongside the manual values.
6. Briefly show Nginx as the single HTTP entry point for producer and mobile API traffic.

## 8. Risks and Fallbacks

| Risk | Response |
|---|---|
| Project scaffolding or dependency setup takes too long | Use the simplest supported starter template; defer styling |
| Mobile cannot reach the host API | Verify host IP, port mapping, firewall, and device network first |
| Nginx routing causes delays | Test Spring Boot directly temporarily, then restore and verify the Nginx route |
| Daily aggregation consumes too much time | Persist raw events and calculate simple daily totals/averages on request |
| Full vertical slice cannot be completed | Preserve backend + producer ingestion and a basic dashboard; document what remains |

## 9. Explicit Non-Goals

- Production-grade security or authentication.
- Load/stress benchmarking or performance claims.
- Real wearable integration.
- Complex ETL pipelines or background processing.
- Premature service splitting.

**Success means one reproducible end-to-end workflow works.** It does not mean every production concern has been solved.
