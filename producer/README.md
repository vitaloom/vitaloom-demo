# VitaLoom Go Health Metrics Producer

A small Go CLI that generates **simulated** heart-rate observations and step-increment events and submits them to the existing VitaLoom Spring Boot API through Nginx. It never connects to MongoDB directly and does not read Apple Health or a real wearable.

## Requirements

- Go 1.23+ (the merged implementation uses the standard library only; the original plan's Go 1.24.3 target was not used in the reported agent checks).
- The VitaLoom backend Compose stack running and healthy.
- Nginx reachable at the configured API base URL (default `http://localhost`, normally port 80).

## Run continuously

From the repository root:

```bash
cd producer
go run .
```

By default, the producer runs **indefinitely**. It creates a run ID, generates five heart-rate events and five step increments per batch cycle, posts each metric batch, waits five seconds, then repeats. Press `Ctrl+C` to stop. The current pair of metric batches and any bounded retries are allowed to finish before shutdown.

For a more active dashboard demo:

```bash
go run . --api-base-url http://localhost --batch-size 5 --interval 2s
```

Run for a limited time for integration checks:

```bash
go run . --api-base-url http://localhost --batch-size 5 --interval 2s --duration 90s
```

`--duration 0s` (the default) means no time limit. A positive duration stops at the next cycle boundary so that an in-flight batch is not deliberately abandoned.

## Configuration

Command-line flags override the matching environment-variable defaults.

| Flag | Environment variable | Default | Meaning |
|---|---|---|---|
| `--api-base-url` | `VITALOOM_API_BASE_URL` | `http://localhost` | Nginx/API base URL, without an endpoint path |
| `--batch-size` | `VITALOOM_BATCH_SIZE` | `5` | Events per metric per batch, from 1 to 500 |
| `--interval` | `VITALOOM_INTERVAL` | `5s` | Delay between cycles; accepts Go durations such as `2s` or `500ms` |
| `--duration` | `VITALOOM_DURATION` | `0s` | Total run duration; zero means unlimited |
| `--timeout` | `VITALOOM_TIMEOUT` | `5s` | Timeout for each HTTP request attempt |
| `--max-retries` | `VITALOOM_MAX_RETRIES` | `3` | Retries after the first request, from 0 to 10 |
| `--retry-delay` | `VITALOOM_RETRY_DELAY` | `500ms` | Delay between retry attempts |

Batch size applies separately to the heart-rate request and the steps request. For example, batch size 5 means 5 heart-rate events plus 5 step events per cycle (10 events total), sent to two endpoints:

- `POST /api/heart-rate/batch`
- `POST /api/steps/batch`

The backend accepts at most 500 events per batch. Keep the configured batch size within that limit.

## Data and delivery behavior

- A unique `runId` is created each time the producer starts.
- Every event has a stable ID prefixed with `hr-` or `steps-`, making IDs globally distinct across the backend's shared event collection.
- Timestamps are UTC RFC3339 values ending in `Z`.
- `stepsDelta` is an increment, not a cumulative step count. The backend calculates the daily total from accepted unique increments.
- Values cycle through resting, walking, and more-active periods. Heart rate stays bounded and step increments never become negative.
- The same exact JSON body and event IDs are reused on retries. Network errors, HTTP 408/429, and HTTP 5xx are retried up to the configured limit. Most other 4xx responses are not retried.
- If a batch still fails after retries, the producer logs the failure, prints a final summary, and exits non-zero instead of silently dropping it and continuing with new data.
- Successful responses are checked for matching `runId` and consistent `received`, `accepted`, and `duplicates` counts.

## Example output

Exact timestamps and counts vary, but log lines look like this:

```text
[vitaloom-producer] producer started run_id=run-20261024T020000Z-a1b2c3d4e5f6 api_base_url=http://localhost batch_size=5 interval=2s duration=0s (0s means unlimited) timeout=5s max_retries=3
[vitaloom-producer] batch metric=heart-rate endpoint=/api/heart-rate/batch status=202 run_id=run-20261024T020000Z-a1b2c3d4e5f6 received=5 accepted=5 duplicates=0 attempts=1 elapsed=8ms
[vitaloom-producer] batch metric=steps endpoint=/api/steps/batch status=202 run_id=run-20261024T020000Z-a1b2c3d4e5f6 received=5 accepted=5 duplicates=0 attempts=1 elapsed=6ms
...
[vitaloom-producer] producer summary status=completed run_id=run-20261024T020000Z-a1b2c3d4e5f6 duration=1m30s cycles=45 successful_batches=90 generated_events=450 accepted_events=450 duplicate_events=0 retries=0 failed_batches=0
```

## Verify the data

With the backend running:

```bash
curl -i http://localhost/api/health
curl -s http://localhost/api/statistics/daily
```

Run the producer for 60–90 seconds and check that `heartRateBpm` and `steps` are populated or updated in daily statistics. A `steps` value of `0` is valid when zero-step increments are accepted; `null` means there are no accepted step events for the current local day.

The project owner has confirmed that the overall demo runs end-to-end on their iPhone. That confirms the owner's manual demo flow; it is not a substitute for the independent command-level test results documented in the pull request.

## Troubleshooting

- **Connection refused / timeout:** start backend Compose and confirm `http://localhost/api/health` returns HTTP 200. Check the Nginx port mapping in `demo/docker-compose.yaml` if `NGINX_PORT` was changed.
- **HTTP 400:** inspect the response body; ensure batch size is at most 500 and fields match `API_CONTRACT.md`.
- **HTTP 409:** an event ID was reused with a different payload. Normal retries reuse the same ID and values.
- **HTTP 5xx or network error:** bounded retries run automatically. If the batch still fails, the producer stops with a clear error; fix backend/network availability and start a new run.
- **Dashboard does not move:** check producer logs for HTTP status and accepted/duplicate counts, then query `/api/statistics/daily`. The backend evaluates event timestamps against the current `Asia/Ho_Chi_Minh` day.

## Test and build

```bash
go test ./...
go build ./...
```

PR #2 reports that Go tests, vet, race checks, and build passed in its agent environment (Go 1.23.2). No third-party Go dependencies are required.
