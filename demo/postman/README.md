# Postman Regression Verification — Backend API v1

This collection can be used to regression-test health checks, producer event ingestion, water-intake idempotency, daily sleep replacement, and the unified daily dashboard. It describes expected assertions; the presence of the collection does not mean a full Collection Runner execution has been recorded as passing.

## Files

- `VitaLoom-Health-Ingestion.postman_collection.json`: sequential requests and Postman assertions.
- Import this collection into Postman. The collection variable `baseUrl` defaults to `http://localhost`.

## Run it

1. Start the demo stack from the `demo/` directory:

   ```powershell
   docker compose up --build -d
   docker compose ps
   ```

2. Confirm `http://localhost/api/health` returns HTTP 200 and both `status` and `database` equal `UP`.
3. Import the collection JSON into Postman.
4. Run the whole collection in **Collection Runner**, in its defined order. Do not run individual retry/conflict requests first because they depend on the initial insert requests.
5. If Nginx uses a non-default port, edit the collection variable `baseUrl`, for example `http://localhost:8088`.
6. The collection is expected to pass when run against a clean, healthy stack. The first run generates a unique `testRunId` and unique event IDs to avoid collisions with previous runs. Save the Runner result as evidence when formal verification is needed.

## Coverage and expected results

| Scenario | Expected result |
|---|---|
| Health + MongoDB ping | `200`, both statuses `UP` |
| Valid step batch (2 events) | `202`, accepted 2, duplicates 0 |
| Retry same step batch | `202`, accepted 0, duplicates 2 |
| Reuse event ID with changed payload | `409 EVENT_ID_CONFLICT` |
| Negative step increment | `400 VALIDATION_ERROR` |
| Batch containing valid + invalid event | `400`; no records written from that batch |
| Reuse event ID from rejected batch | `202`, accepted 1 — demonstrates validation-before-write |
| Same identical event repeated inside one batch | `202`, received 2, accepted 1, duplicates 1 |
| More than 500 events | `400 VALIDATION_ERROR` |
| Empty batch | `400 VALIDATION_ERROR` |
| Valid heart-rate batch (2 events) | `202`, accepted 2 |
| Retry same heart-rate batch | `202`, accepted 0, duplicates 2 |
| Reuse heart-rate event ID with changed value | `409 EVENT_ID_CONFLICT` |
| Heart rate above configured range | `400 VALIDATION_ERROR` |
| Malformed JSON | `400 INVALID_REQUEST` |
| First water intake | `201`, status `CREATED` |
| Retry identical water intake | `200`, status `DUPLICATE` |
| Reuse `intakeId` with changed payload | `409 INTAKE_ID_CONFLICT` |
| Water intake above 5,000 mL | `400 VALIDATION_ERROR` |
| Create/update daily sleep | `200`, latest value replaces prior value |
| Sleep duration above 24 hours | `400 VALIDATION_ERROR` |
| Daily dashboard | `200`, returns all four metrics; this run adds at least 600 mL water |
| Final health check | `200`, both statuses `UP` |

## Verify persistence in Mongo Express

The dashboard endpoint verifies computed daily values. Use Mongo Express if you also want to inspect the stored documents:

1. Open `http://localhost:8081` (or your configured `ME_PORT`) and sign in using the `ME_BASIC_USER` / `ME_BASIC_PASS` values from your local `.env`.
2. Open the application database configured by `APP_DB` (the example defaults to `vitaloom_db`).
3. Inspect collections `health_events`, `water_intakes`, and `daily_sleep`.
4. Find the latest test run by the `runId` prefix `postman-`. Confirm:
   - each successful `eventId` appears once as the document `_id`;
   - step documents use `type: STEPS_DELTA` and retain `value` plus `occurredAt`;
   - heart-rate documents use `type: HEART_RATE`;
   - each stored document has a backend-generated `receivedAt`;
   - the two intentionally rejected invalid/conflicting requests did not create records for their event IDs.

If your Mongo Express URL is configured differently, use the port from your local `.env`.

## Regression checklist

- [ ] Full Postman Collection Runner execution passes.
- [ ] Mongo Express shows accepted raw events and no duplicate documents for retries.
- [ ] Invalid batches do not write partial records.
- [ ] The Maven test suite succeeds (`./mvnw test` or `.`\`mvnw.cmd test` on Windows).
- [ ] Compose services remain healthy after the collection run.

Record the actual commands and results when you run these checks. The project's manual iPhone E2E confirmation is separate evidence and does not automatically establish that the full Postman collection or Maven suite passed.
