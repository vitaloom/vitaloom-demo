package com.vitaloom.demo.service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import org.springframework.stereotype.Service;
import com.vitaloom.demo.dto.SleepDailyRequest;
import com.vitaloom.demo.dto.SleepDailyResponse;
import com.vitaloom.demo.model.DailySleepRecord;
import com.vitaloom.demo.repository.DailySleepRepository;

@Service
public class DailySleepService {
    static final ZoneId DAILY_TIMEZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private final DailySleepRepository repository;
    private final Clock clock;
    public DailySleepService(DailySleepRepository repository, Clock clock) {
        this.repository = repository; this.clock = clock;
    }

    public SleepDailyResponse updateDaily(SleepDailyRequest request) {
        if (request == null || request.sleepHours() == null || !Double.isFinite(request.sleepHours())
                || request.sleepHours() < 0 || request.sleepHours() > 24)
            throw new IllegalArgumentException("sleepHours must be a finite number between 0 and 24.");
        LocalDate date = LocalDate.now(clock.withZone(DAILY_TIMEZONE));
        DailySleepRecord saved = repository.saveForDate(date, request.sleepHours(), Instant.now(clock));
        return new SleepDailyResponse(saved.date(), DAILY_TIMEZONE.getId(), saved.sleepHours());
    }
}
