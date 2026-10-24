# VitaLoom Demo — Implementation Plan

## 1. Objective

Build a runnable, end-to-end demo in approximately **3 focused hours**. The goal is a credible vertical slice, not a production-ready system.

**Mobile path:** Expo app → Nginx → Spring Boot API → MongoDB  
**Simulation path:** Go Producer → Nginx → Spring Boot API → MongoDB → daily dashboard

## 2. Decisions Already Agreed

- The dashboard uses one read endpoint to return all four metrics.
- Write endpoints are separated by business operation and metric semantics.
- Water intake is recorded as separate events and summed for the day.
- Sleep is one daily record, created or replaced through an upsert.
- The producer emits raw heart-rate observations and raw step increments; it does not calculate authoritative daily totals.
- The producer creates stable `eventId` values. Mobile creates a stable `intakeId` for each water-intake action. IDs are reused when retrying the same action/event.
- Spring Boot validates, persists, and aggregates. MongoDB unique indexes enforce record uniqueness; Nginx only proxies requests.
- The current daily boundary is 00:00 in `Asia/Ho_Chi_Minh`. Keep original event timestamps and derive the statistics day on the backend.
- Missing metrics are represented as `null`, not zero.
- Authentication, personalized day boundaries, overnight sleep-session attribution, and HTTP-level idempotency keys are deferred.

See [API_CONTRACT.md](./API_CONTRACT.md) for endpoint and payload details.

## 3. Time Box and Priorities

| Time | Work package | Exit criteria |
|---|---|---|
| 00:00–00:15 | Scaffold repositories and verify API contract | Minimal backend, mobile, and producer skeletons; API paths agreed |
| 00:15–01:00 | Backend infrastructure | Spring Boot, MongoDB, Nginx, and Compose start; health endpoint works through Nginx |
| 01:00–01:35 | Raw ingestion and daily query | Water, sleep, steps, and heart-rate write paths persist data; dashboard endpoint returns four values |
| 01:35–02:05 | Go Producer | Sends heart-rate and step events through Nginx with stable event IDs |
| 02:05–02:40 | Expo dashboard and manual input | One screen displays four metrics and can add water/update sleep |
| 02:40–03:00 | End-to-end verification | Manual and simulated values persist and appear after dashboard refresh |

**Time-box rule:** If setup overruns, cut styling and optional polish. Preserve the full critical path: API health, event persistence, producer ingestion, manual input, dashboard, and one repeatable end-to-end demo. Three hours is a target, not a guarantee.

## 4. Functional Scope

| Metric | Input source | Write behavior | Dashboard behavior |
|---|---|---|---|
| Heart rate (bpm) | Go Producer | Append raw, timestamped observations; deduplicate by `eventId` | Show latest observation for the day |
| Steps | Go Producer | Append raw step increments; deduplicate by `eventId` | Sum accepted increments for the day |
| Sleep (hours) | Expo form | Upsert a single daily duration record | Show stored duration or `null` |
| Water (mL) | Expo form | Append one record per intake; deduplicate by `intakeId` | Sum accepted intake records for the day |

Simulation should use one simple, reproducible activity scenario. Sophisticated behavior modeling, advanced charts, monthly analytics, insights, and authentication are out of scope.

## 5. API Surface

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/statistics/daily` | Return all four dashboard metrics in one response |
| POST | `/api/water-intakes` | Record a single drinking action |
| PUT | `/api/sleep/daily` | Create or replace today's sleep record |
| POST | `/api/steps/batch` | Ingest raw step-increment events |
| POST | `/api/heart-rate/batch` | Ingest raw heart-rate observations |

Use the exact request/response examples in [API_CONTRACT.md](./API_CONTRACT.md). Do not invent a second payload shape in the producer or mobile implementation.

## 6. Minimal Backend Structure

Keep one Spring Boot application and separate code by responsibility, not by deploying separate services:

- **API controllers:** one controller per write/read boundary where it improves clarity.
- **Business logic:** metric-specific validation and persistence behavior; a dashboard/statistics service combines read results.
- **Persistence:** separate raw/event records from the sleep daily record. Use stable IDs and unique indexes for deduplication.
- **Aggregation:** calculate daily water totals, step totals, and latest heart rate from persisted records. For this demo, calculations may run on request; no background ETL pipeline is required.
- **Time handling:** store original timestamps consistently and derive day boundaries in `Asia/Ho_Chi_Minh`.

Keep the implementation small. Separate classes are useful where they clarify responsibilities, but this sprint does not require separate microservices or an elaborate domain framework.

## 7. Local Deployment

Docker Compose should run the backend infrastructure:

- **Nginx:** expose one host port and reverse-proxy API routes to Spring Boot.
- **Spring Boot:** a single backend application.
- **MongoDB:** internal service with a named volume for persisted demo data.

Run the Expo development server on the host with `npx expo start`. The phone/emulator must call an API address reachable from that device:
- Android emulator: commonly `10.0.2.2` plus the mapped Nginx port.
- Physical phone: the development computer's LAN IP and an accessible port.
- Do not use a phone's `localhost` to refer to the development computer.

The producer can run on the host or in Compose. Use the host-mapped Nginx port when on the host, or the Nginx service name/container port inside Compose. Do not expose MongoDB publicly. Redis, Kafka, Kubernetes, public DNS, and HTTPS are not needed for this local demo.

## 8. Verification Checklist

### Infrastructure
- [ ] `docker compose up --build` starts required services.
- [ ] Nginx forwards `GET /api/health` to Spring Boot.
- [ ] Spring Boot can read/write MongoDB; the named volume retains data.

### Write paths and aggregation
- [ ] Two water-intake records are stored separately and summed.
- [ ] Updating sleep twice leaves one daily sleep record with the newest value.
- [ ] Duplicate water `intakeId` does not increase water total twice.
- [ ] Duplicate step/heart-rate `eventId` does not create a second raw event.
- [ ] Step total is the sum of unique increments, not a producer-supplied cumulative total.
- [ ] Heart-rate dashboard value is the latest observation by `occurredAt`.
- [ ] Events near local midnight are assigned to the correct `Asia/Ho_Chi_Minh` date.
- [ ] Missing metrics return `null`.

### Mobile and end-to-end
- [ ] Expo loads the daily dashboard from the API.
- [ ] Water can be added more than once in a day.
- [ ] Sleep can be created and edited.
- [ ] Producer sends events through Nginx and dashboard refresh shows updated values.
- [ ] The app can reach the API from the actual emulator/phone.

## 9. Demo Script

1. Start the Compose stack and show the health endpoint through Nginx.
2. Open the Expo app and show today's four metrics.
3. Add two water intakes and update the sleep duration.
4. Run the Go Producer to send heart-rate and step batches.
5. Refresh the dashboard and show the summed water/steps, saved sleep duration, and latest heart-rate observation.
6. Briefly explain per-metric write endpoints, raw events, and backend-owned aggregation.

## 10. Risks and Fallbacks

| Risk | Response |
|---|---|
| Project setup consumes the time box | Use the simplest supported starter; reduce styling |
| Mobile cannot reach the API | Verify host IP, port mapping, firewall, and device network |
| Nginx configuration delays progress | Temporarily test Spring Boot directly, then restore and verify the Nginx route |
| MongoDB event deduplication takes too long | Prioritize unique-index-backed `eventId` handling for steps and heart rate; document any unfinished water retry path |
| Aggregation is too time-consuming | Query persisted raw records and compute simple daily values on request |
| Full vertical slice is not ready | Preserve a working backend + producer path, then document remaining mobile work |

## 11. Explicit Non-Goals

- Production-grade security, authentication, or user isolation.
- Load/stress benchmarking or performance claims.
- Real wearable integration.
- Personalized daily cutoff times or overnight sleep-session modeling.
- Kafka, Redis, Kubernetes, complex ETL, or premature service splitting.
- Production hosting or public networking.

**Success means one repeatable local end-to-end workflow works, with metric-specific write semantics and one unified dashboard response.**
