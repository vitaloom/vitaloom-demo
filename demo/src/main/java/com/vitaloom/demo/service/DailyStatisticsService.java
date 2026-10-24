package com.vitaloom.demo.service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.springframework.stereotype.Service;
import com.vitaloom.demo.dto.DailyStatisticsResponse;
import com.vitaloom.demo.model.DailySleepRecord;
import com.vitaloom.demo.model.WaterIntake;
import com.vitaloom.demo.repository.DailySleepRepository;
import com.vitaloom.demo.repository.WaterIntakeRepository;

@Service
public class DailyStatisticsService {
    static final ZoneId DAILY_TIMEZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private final HealthEventService healthEventService;
    private final WaterIntakeRepository waterRepository;
    private final DailySleepRepository sleepRepository;
    private final Clock clock;

    public DailyStatisticsService(HealthEventService healthEventService, WaterIntakeRepository waterRepository,
            DailySleepRepository sleepRepository, Clock clock) {
        this.healthEventService = healthEventService; this.waterRepository = waterRepository;
        this.sleepRepository = sleepRepository; this.clock = clock;
    }

    public DailyStatisticsResponse getDailyStatistics() {
        LocalDate date = LocalDate.now(clock.withZone(DAILY_TIMEZONE));
        Instant start = date.atStartOfDay(DAILY_TIMEZONE).toInstant();
        Instant end = date.plusDays(1).atStartOfDay(DAILY_TIMEZONE).toInstant();
        List<WaterIntake> intakes = waterRepository.findByOccurredAtBetween(start, end);
        Long waterMl = intakes.isEmpty() ? null : intakes.stream().mapToLong(i -> i.amountMl().longValue()).sum();
        DailySleepRecord sleep = sleepRepository.findByDate(date).orElse(null);
        return new DailyStatisticsResponse(date.toString(), DAILY_TIMEZONE.getId(),
                healthEventService.getLatestHeartRate(date), healthEventService.getDailyStepsTotal(date),
                sleep == null ? null : sleep.sleepHours(), waterMl);
    }
}
