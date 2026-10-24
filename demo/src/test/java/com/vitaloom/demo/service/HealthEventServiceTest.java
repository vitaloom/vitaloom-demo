package com.vitaloom.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.vitaloom.demo.dto.BatchIngestionResponse;
import com.vitaloom.demo.dto.HeartRateBatchRequest;
import com.vitaloom.demo.dto.HeartRateEventRequest;
import com.vitaloom.demo.dto.StepBatchRequest;
import com.vitaloom.demo.dto.StepEventRequest;
import com.vitaloom.demo.model.HealthEvent;
import com.vitaloom.demo.model.HealthMetricType;
import com.vitaloom.demo.repository.HealthEventRepository;

class HealthEventServiceTest {

    private HealthEventRepository repository;
    private HealthEventService service;

    @BeforeEach
    void setUp() {
        repository = mock(HealthEventRepository.class);
        service = new HealthEventService(repository);
    }

    @Test
    void acceptsStepBatchAndReportsCounts() {
        when(repository.insertIfAbsent(any(HealthEvent.class))).thenReturn(true);

        BatchIngestionResponse response = service.ingestSteps(new StepBatchRequest(
                "run-1",
                List.of(
                        new StepEventRequest("step-1", OffsetDateTime.parse("2026-10-24T09:00:00+07:00"), 12),
                        new StepEventRequest("step-2", OffsetDateTime.parse("2026-10-24T09:00:10+07:00"), 8))));

        assertEquals("run-1", response.runId());
        assertEquals(2, response.received());
        assertEquals(2, response.accepted());
        assertEquals(0, response.duplicates());
    }

    @Test
    void countsRepeatedStoredEventAsDuplicateWithoutReinsertingIt() {
        Instant occurredAt = Instant.parse("2026-10-24T02:00:00Z");
        HealthEvent stored = new HealthEvent(
                "step-1", "run-1", HealthMetricType.STEPS_DELTA,
                occurredAt, Instant.parse("2026-10-24T02:00:01Z"), 12);

        when(repository.insertIfAbsent(any(HealthEvent.class))).thenReturn(false);
        when(repository.findById("step-1")).thenReturn(Optional.of(stored));

        BatchIngestionResponse response = service.ingestSteps(new StepBatchRequest(
                "run-1",
                List.of(new StepEventRequest(
                        "step-1", OffsetDateTime.parse("2026-10-24T09:00:00+07:00"), 12))));

        assertEquals(1, response.received());
        assertEquals(0, response.accepted());
        assertEquals(1, response.duplicates());
    }

    @Test
    void rejectsReusedEventIdWhenPayloadDiffers() {
        Instant occurredAt = Instant.parse("2026-10-24T02:00:00Z");
        HealthEvent stored = new HealthEvent(
                "step-1", "run-1", HealthMetricType.STEPS_DELTA,
                occurredAt, Instant.parse("2026-10-24T02:00:01Z"), 12);

        when(repository.insertIfAbsent(any(HealthEvent.class))).thenReturn(false);
        when(repository.findById("step-1")).thenReturn(Optional.of(stored));

        assertThrows(EventIdConflictException.class, () -> service.ingestSteps(new StepBatchRequest(
                "run-1",
                List.of(new StepEventRequest(
                        "step-1", OffsetDateTime.parse("2026-10-24T09:00:00+07:00"), 13)))));
    }

    @Test
    void rejectsInvalidStepEventBeforeWritingAnything() {
        assertThrows(IllegalArgumentException.class, () -> service.ingestSteps(new StepBatchRequest(
                "run-1",
                List.of(new StepEventRequest(
                        "step-1", OffsetDateTime.parse("2026-10-24T09:00:00+07:00"), -1)))));

        verifyNoInteractions(repository);
    }

    @Test
    void sumsStepIncrementsWithinVietnamLocalDay() {
        Instant start = Instant.parse("2026-10-23T17:00:00Z");
        Instant end = Instant.parse("2026-10-24T17:00:00Z");

        when(repository.findByTypeAndOccurredAtBetween(HealthMetricType.STEPS_DELTA, start, end))
                .thenReturn(List.of(
                        new HealthEvent("s1", "run-1", HealthMetricType.STEPS_DELTA,
                                start, start, 12),
                        new HealthEvent("s2", "run-1", HealthMetricType.STEPS_DELTA,
                                end.minusSeconds(1), end.minusSeconds(1), 8)));

        assertEquals(20L, service.getDailyStepsTotal(LocalDate.parse("2026-10-24")));
        verify(repository).findByTypeAndOccurredAtBetween(HealthMetricType.STEPS_DELTA, start, end);
    }

    @Test
    void selectsLatestHeartRateByOccurrenceTime() {
        Instant first = Instant.parse("2026-10-24T02:00:00Z");
        Instant latest = Instant.parse("2026-10-24T02:00:05Z");

        when(repository.findByTypeAndOccurredAtBetween(
                org.mockito.ArgumentMatchers.eq(HealthMetricType.HEART_RATE), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(
                        new HealthEvent("hr-2", "run-1", HealthMetricType.HEART_RATE, latest, latest, 101),
                        new HealthEvent("hr-1", "run-1", HealthMetricType.HEART_RATE, first, first, 92)));

        assertEquals(101, service.getLatestHeartRate(LocalDate.parse("2026-10-24")));
    }

    @Test
    void validatesHeartRateRange() {
        assertThrows(IllegalArgumentException.class, () -> service.ingestHeartRate(new HeartRateBatchRequest(
                "run-1",
                List.of(new HeartRateEventRequest(
                        "hr-1", OffsetDateTime.parse("2026-10-24T09:00:00+07:00"), 300)))));

        verifyNoInteractions(repository);
    }
}
