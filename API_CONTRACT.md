# VitaLoom Demo — API Contract v1

**Status:** Initial demo contract  
**Timezone for daily boundaries:** `Asia/Ho_Chi_Minh`  
**Timestamp format:** ISO 8601 with an explicit offset; producers should send UTC timestamps ending in `Z`.

This contract is intentionally small so the Spring Boot backend, Expo app, and Go producer can be implemented in parallel. It is a demo contract, not a production API specification.

## 1. Conventions

- API paths are prefixed with `/api`; Nginx forwards these paths to Spring Boot.
- JSON request and response bodies use `Content-Type: application/json`.
- Use HTTP status codes conventionally: `200` for successful reads/updates, `202` for an accepted event batch, `400` for invalid input, and `500` for unexpected server errors.
- A missing metric is represented by `null`, not by zero.
- Daily statistics are scoped to the current calendar day in `Asia/Ho_Chi_Minh`.
- The backend is the source of truth for persistence and aggregation. The producer must never write directly to MongoDB.

## 2. Health Check

### `GET /api/health`

Successful response — `200 OK`:

```json
{
  "status": "UP"
}
```

## 3. Daily Statistics

### `GET /api/statistics/daily`

Returns the current day's dashboard values.

Successful response — `200 OK`:

```json
{
  "date": "2026-10-24",
  "timezone": "Asia/Ho_Chi_Minh",
  "heartRateBpm": 92,
  "steps": 1840,
  "sleepHours": 7.5,
  "waterMl": 1200
}
```

Field definitions:

| Field | Type | Meaning |
|---|---|---|
| `date` | string | Current local date, `YYYY-MM-DD` |
| `timezone` | string | Timezone used to calculate the day |
| `heartRateBpm` | number or `null` | Most recent heart-rate measurement for the day |
| `steps` | integer or `null` | Sum of accepted step increments for the day |
| `sleepHours` | number or `null` | Manually entered sleep duration |
| `waterMl` | integer or `null` | Manually entered water intake |

If a metric has no data for the day, return `null`. Do not invent a value or interpret missing data as zero.

## 4. Batch Health-Event Ingestion

### `POST /api/health-events/batch`

Accepts simulated heart-rate measurements and step increments from the Go producer.

Request:

```json
{
  "runId": "demo-run-001",
  "events": [
    {
      "eventId": "demo-run-001-0001",
      "type": "HEART_RATE",
      "occurredAt": "2026-10-24T02:00:00Z",
      "value": 92
    },
    {
      "eventId": "demo-run-001-0002",
      "type": "STEPS_DELTA",
      "occurredAt": "2026-10-24T02:00:10Z",
      "value": 12
    }
  ]
}
```

Rules:

- `runId`: string identifying one producer run.
- `eventId`: unique identifier for an event; used to avoid counting the same event more than once.
- `type`: only `HEART_RATE` and `STEPS_DELTA` are supported in this demo.
- `occurredAt`: time the measurement occurred, in ISO 8601 format with an explicit offset.
- `value`: numeric measurement. Heart rate is beats per minute; `STEPS_DELTA` is a non-negative integer increment, not a cumulative total.
- Daily steps are calculated by summing accepted `STEPS_DELTA` events that fall within the local day.
- The backend should validate supported types and sensible value ranges. Invalid payloads should return `400 Bad Request`.
- Re-sending an event with an already accepted `eventId` must not double-count it.

Successful response — `202 Accepted`:

```json
{
  "runId": "demo-run-001",
  "received": 2,
  "accepted": 2,
  "duplicates": 0
}
```

The counts refer to the submitted batch. A batch containing only previously accepted event IDs may return `accepted: 0` and a positive `duplicates` count.

## 5. Manual Daily Entries

### `PATCH /api/manual-entries/daily`

Creates or updates one or both manual values for the current local day. Omitted fields remain unchanged.

Request — update both values:

```json
{
  "sleepHours": 7.5,
  "waterMl": 1200
}
```

Request — update water only:

```json
{
  "waterMl": 1500
}
```

Rules:

- `sleepHours`: optional number greater than or equal to 0; demo validation should reject implausible values above 24.
- `waterMl`: optional non-negative integer; reject implausibly large daily values (for example, above 20,000 mL).
- At least one supported field must be present.
- Omitted fields are not cleared. Explicit `null` is not used to clear a field in this demo.
- Values apply to the current date in `Asia/Ho_Chi_Minh`.

Successful response — `200 OK`:

```json
{
  "date": "2026-10-24",
  "timezone": "Asia/Ho_Chi_Minh",
  "sleepHours": 7.5,
  "waterMl": 1500
}
```

## 6. Error Shape

Use a consistent minimal error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request payload is invalid."
  }
}
```

The exact message may vary, but clients should not depend on message text for program logic.

## 7. Demo Acceptance Checks

- [ ] Health check returns `200 OK` through Nginx.
- [ ] Daily statistics return all four fields, using `null` for metrics with no data.
- [ ] Producer batches can be accepted through Nginx.
- [ ] Duplicate `eventId` values are not counted twice.
- [ ] Step increments aggregate into a daily total using the configured timezone.
- [ ] Updating only water preserves the saved sleep value, and vice versa.
- [ ] The Expo dashboard displays the response without inventing missing values.

## 8. Explicitly Deferred

Authentication, user-specific data isolation, historical date queries, pagination, asynchronous processing, advanced analytics, and production-grade rate limiting are outside this local demo contract. Revisit these before using the API for a real multi-user deployment.
