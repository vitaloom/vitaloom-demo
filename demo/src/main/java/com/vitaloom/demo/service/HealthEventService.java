package com.vitaloom.demo.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.vitaloom.demo.dto.BatchIngestionResponse;
import com.vitaloom.demo.dto.HeartRateBatchRequest;
import com.vitaloom.demo.dto.HeartRateEventRequest;
import com.vitaloom.demo.dto.StepBatchRequest;
import com.vitaloom.demo.dto.StepEventRequest;
import com.vitaloom.demo.model.HealthEvent;
import com.vitaloom.demo.model.HealthMetricType;
import com.vitaloom.demo.repository.HealthEventRepository;

@Service
public class HealthEventService {

    private static final int MAX_BATCH_SIZE = 500;
    private static final int MAX_ID_LENGTH = 128;
    private static final ZoneId DAILY_TIMEZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final HealthEventRepository repository;

    public HealthEventService(HealthEventRepository repository) {
        this.repository = repository;
    }

    public BatchIngestionResponse ingestSteps(StepBatchRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body is required.");
        }

        List<IncomingEvent> events = new ArrayList<>();
        if (request.events() != null) {
            for (StepEventRequest event : request.events()) {
                events.add(event == null ? null : new IncomingEvent(
                        event.eventId(),
                        toInstant(event.occurredAt()),
                        event.stepsDelta(),
                        HealthMetricType.STEPS_DELTA));
            }
        }

        return ingest(request.runId(), events, HealthMetricType.STEPS_DELTA);
    }

    public BatchIngestionResponse ingestHeartRate(HeartRateBatchRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body is required.");
        }

        List<IncomingEvent> events = new ArrayList<>();
        if (request.events() != null) {
            for (HeartRateEventRequest event : request.events()) {
                events.add(event == null ? null : new IncomingEvent(
                        event.eventId(),
                        toInstant(event.occurredAt()),
                        event.heartRateBpm(),
                        HealthMetricType.HEART_RATE));
            }
        }

        return ingest(request.runId(), events, HealthMetricType.HEART_RATE);
    }

    private BatchIngestionResponse ingest(
            String runId,
            List<IncomingEvent> events,
            HealthMetricType expectedType) {
        validateBatch(runId, events, expectedType);

        // Collapse identical IDs repeated within the same batch, but reject conflicting payloads
        // before any writes happen.
        Map<String, IncomingEvent> uniqueEvents = new LinkedHashMap<>();
        for (IncomingEvent event : events) {
            IncomingEvent previous = uniqueEvents.putIfAbsent(event.eventId(), event);
            if (previous != null && !samePayload(runId, previous, runId, event)) {
                throw new EventIdConflictException(event.eventId());
            }
        }

        int accepted = 0;
        for (IncomingEvent event : uniqueEvents.values()) {
            HealthEvent storedCandidate = new HealthEvent(
                    event.eventId(),
                    runId,
                    event.type(),
                    event.occurredAt(),
                    Instant.now(),
                    event.value());

            if (repository.insertIfAbsent(storedCandidate)) {
                accepted++;
                continue;
            }

            HealthEvent existing = repository.findById(event.eventId())
                    .orElseThrow(() -> new IllegalStateException(
                            "Duplicate event ID was reported but the original event could not be read."));

            if (!samePayload(existing, runId, event)) {
                throw new EventIdConflictException(event.eventId());
            }
        }

        return new BatchIngestionResponse(
                runId,
                events.size(),
                accepted,
                events.size() - accepted);
    }

    private void validateBatch(
            String runId,
            List<IncomingEvent> events,
            HealthMetricType expectedType) {
        if (runId == null || runId.isBlank() || runId.length() > MAX_ID_LENGTH) {
            throw new IllegalArgumentException("runId is required and must not exceed 128 characters.");
        }
        if (events == null || events.isEmpty()) {
            throw new IllegalArgumentException("events must contain at least one event.");
        }
        if (events.size() > MAX_BATCH_SIZE) {
            throw new IllegalArgumentException("A batch must not contain more than 500 events.");
        }

        for (IncomingEvent event : events) {
            if (event == null) {
                throw new IllegalArgumentException("events must not contain null entries.");
            }
            if (event.eventId() == null || event.eventId().isBlank()
                    || event.eventId().length() > MAX_ID_LENGTH
                    || !event.eventId().equals(event.eventId().trim())) {
                throw new IllegalArgumentException(
                        "Each eventId is required, must not exceed 128 characters, and must not have surrounding whitespace.");
            }
            if (event.occurredAt() == null) {
                throw new IllegalArgumentException("occurredAt is required for every event.");
            }
            if (event.type() != expectedType) {
                throw new IllegalArgumentException("The event type does not match this endpoint.");
            }
            if (event.value() == null) {
                throw new IllegalArgumentException("Every event must contain a numeric value.");
            }

            if (expectedType == HealthMetricType.HEART_RATE
                    && (event.value() < 20 || event.value() > 250)) {
                throw new IllegalArgumentException("heartRateBpm must be between 20 and 250.");
            }
            if (expectedType == HealthMetricType.STEPS_DELTA && event.value() < 0) {
                throw new IllegalArgumentException("stepsDelta must be a non-negative integer.");
            }
        }
    }

    public Long getDailyStepsTotal(LocalDate date) {
        List<HealthEvent> events = findDailyEvents(date, HealthMetricType.STEPS_DELTA);
        if (events.isEmpty()) {
            return null;
        }
        return events.stream().mapToLong(event -> event.value().longValue()).sum();
    }

    public Integer getLatestHeartRate(LocalDate date) {
        return findDailyEvents(date, HealthMetricType.HEART_RATE).stream()
                .max(Comparator.comparing(HealthEvent::occurredAt)
                        .thenComparing(HealthEvent::eventId))
                .map(HealthEvent::value)
                .orElse(null);
    }

    private List<HealthEvent> findDailyEvents(LocalDate date, HealthMetricType type) {
        if (date == null) {
            throw new IllegalArgumentException("Statistics date is required.");
        }

        Instant startInclusive = date.atStartOfDay(DAILY_TIMEZONE).toInstant();
        Instant endExclusive = date.plusDays(1).atStartOfDay(DAILY_TIMEZONE).toInstant();

        return repository.findByTypeAndOccurredAtBetween(type, startInclusive, endExclusive);
    }

    private static Instant toInstant(OffsetDateTime timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }

    private static boolean samePayload(
            String existingRunId,
            IncomingEvent existing,
            String incomingRunId,
            IncomingEvent incoming) {
        return Objects.equals(existingRunId, incomingRunId)
                && Objects.equals(existing.eventId(), incoming.eventId())
                && existing.type() == incoming.type()
                && Objects.equals(existing.occurredAt(), incoming.occurredAt())
                && Objects.equals(existing.value(), incoming.value());
    }

    private static boolean samePayload(
            HealthEvent existing,
            String incomingRunId,
            IncomingEvent incoming) {
        return Objects.equals(existing.runId(), incomingRunId)
                && Objects.equals(existing.eventId(), incoming.eventId())
                && existing.type() == incoming.type()
                && Objects.equals(existing.occurredAt(), incoming.occurredAt())
                && Objects.equals(existing.value(), incoming.value());
    }

    private record IncomingEvent(
            String eventId,
            Instant occurredAt,
            Integer value,
            HealthMetricType type) {
    }
}
