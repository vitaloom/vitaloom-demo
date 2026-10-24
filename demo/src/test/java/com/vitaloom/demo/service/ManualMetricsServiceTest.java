package com.vitaloom.demo.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.vitaloom.demo.dto.*;
import com.vitaloom.demo.model.*;
import com.vitaloom.demo.repository.*;

class ManualMetricsServiceTest {
    private final Clock clock = Clock.fixed(Instant.parse("2026-10-24T02:00:00Z"), ZoneOffset.UTC);
    private WaterIntakeRepository waterRepository;
    private DailySleepRepository sleepRepository;

    @BeforeEach void setUp() {
        waterRepository = mock(WaterIntakeRepository.class);
        sleepRepository = mock(DailySleepRepository.class);
    }

    @Test void waterCreateRetryAndConflictAreIdempotent() {
        WaterIntakeService service = new WaterIntakeService(waterRepository, clock);
        OffsetDateTime time = OffsetDateTime.parse("2026-10-24T09:00:00+07:00");
        WaterIntakeRequest request = new WaterIntakeRequest("water-1", time, 250);
        when(waterRepository.insertIfAbsent(any(WaterIntake.class))).thenReturn(true, false);
        when(waterRepository.findById("water-1")).thenReturn(Optional.of(
                new WaterIntake("water-1", time.toInstant(), Instant.EPOCH, 250)));

        assertEquals("CREATED", service.record(request).status());
        assertEquals("DUPLICATE", service.record(request).status());
        assertThrows(IntakeIdConflictException.class,
                () -> service.record(new WaterIntakeRequest("water-1", time, 300)));
    }

    @Test void invalidWaterAmountDoesNotWrite() {
        WaterIntakeService service = new WaterIntakeService(waterRepository, clock);
        assertThrows(IllegalArgumentException.class, () -> service.record(new WaterIntakeRequest(
                "water-1", OffsetDateTime.parse("2026-10-24T09:00:00+07:00"), 5001)));
        verifyNoInteractions(waterRepository);
    }

    @Test void sleepUpsertsCurrentVietnamDateAndValidatesRange() {
        DailySleepService service = new DailySleepService(sleepRepository, clock);
        when(sleepRepository.saveForDate(LocalDate.parse("2026-10-24"), 7.5, clock.instant()))
                .thenReturn(new DailySleepRecord("2026-10-24", 7.5, clock.instant()));
        SleepDailyResponse response = service.updateDaily(new SleepDailyRequest(7.5));
        assertEquals("2026-10-24", response.date());
        assertEquals(7.5, response.sleepHours());
        assertThrows(IllegalArgumentException.class, () -> service.updateDaily(new SleepDailyRequest(24.1)));
    }

    @Test void dashboardCombinesMetricsAndUsesNullWhenMissing() {
        HealthEventService events = mock(HealthEventService.class);
        when(events.getLatestHeartRate(LocalDate.parse("2026-10-24"))).thenReturn(98);
        when(events.getDailyStepsTotal(LocalDate.parse("2026-10-24"))).thenReturn(1840L);
        Instant start = Instant.parse("2026-10-23T17:00:00Z");
        Instant end = Instant.parse("2026-10-24T17:00:00Z");
        when(waterRepository.findByOccurredAtBetween(start, end)).thenReturn(List.of(
                new WaterIntake("w1", start.plusSeconds(10), start, 250),
                new WaterIntake("w2", start.plusSeconds(20), start, 350)));
        when(sleepRepository.findByDate(LocalDate.parse("2026-10-24"))).thenReturn(
                Optional.of(new DailySleepRecord("2026-10-24", 7.5, start)));

        DailyStatisticsService service = new DailyStatisticsService(events, waterRepository, sleepRepository, clock);
        DailyStatisticsResponse result = service.getDailyStatistics();
        assertEquals(98, result.heartRateBpm());
        assertEquals(1840L, result.steps());
        assertEquals(7.5, result.sleepHours());
        assertEquals(600L, result.waterMl());

        when(events.getLatestHeartRate(LocalDate.parse("2026-10-24"))).thenReturn(null);
        when(events.getDailyStepsTotal(LocalDate.parse("2026-10-24"))).thenReturn(null);
        when(waterRepository.findByOccurredAtBetween(start, end)).thenReturn(List.of());
        when(sleepRepository.findByDate(LocalDate.parse("2026-10-24"))).thenReturn(Optional.empty());
        DailyStatisticsResponse empty = service.getDailyStatistics();
        assertNull(empty.heartRateBpm());
        assertNull(empty.steps());
        assertNull(empty.sleepHours());
        assertNull(empty.waterMl());
    }
}
