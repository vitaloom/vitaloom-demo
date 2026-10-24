package com.vitaloom.demo.service;

import java.time.Clock;
import java.time.Instant;
import java.util.Objects;
import org.springframework.stereotype.Service;
import com.vitaloom.demo.dto.WaterIntakeRequest;
import com.vitaloom.demo.dto.WaterIntakeResponse;
import com.vitaloom.demo.model.WaterIntake;
import com.vitaloom.demo.repository.WaterIntakeRepository;

@Service
public class WaterIntakeService {
    private final WaterIntakeRepository repository;
    private final Clock clock;
    public WaterIntakeService(WaterIntakeRepository repository, Clock clock) {
        this.repository = repository; this.clock = clock;
    }

    public WaterIntakeResponse record(WaterIntakeRequest request) {
        validate(request);
        Instant occurredAt = request.occurredAt().toInstant();
        WaterIntake candidate = new WaterIntake(request.intakeId(), occurredAt, Instant.now(clock), request.amountMl());
        if (repository.insertIfAbsent(candidate))
            return new WaterIntakeResponse(request.intakeId(), request.amountMl(), "CREATED");

        WaterIntake existing = repository.findById(request.intakeId())
                .orElseThrow(() -> new IllegalStateException("Duplicate intake ID was reported but original record could not be read."));
        if (!Objects.equals(existing.occurredAt(), occurredAt) || !Objects.equals(existing.amountMl(), request.amountMl()))
            throw new IntakeIdConflictException(request.intakeId());
        return new WaterIntakeResponse(request.intakeId(), request.amountMl(), "DUPLICATE");
    }

    private static void validate(WaterIntakeRequest request) {
        if (request == null) throw new IllegalArgumentException("Request body is required.");
        String id = request.intakeId();
        if (id == null || id.isBlank() || id.length() > 128 || !id.equals(id.trim()))
            throw new IllegalArgumentException("intakeId is required, max 128 characters, without surrounding whitespace.");
        if (request.occurredAt() == null) throw new IllegalArgumentException("occurredAt is required.");
        if (request.amountMl() == null || request.amountMl() < 1 || request.amountMl() > 5000)
            throw new IllegalArgumentException("amountMl must be between 1 and 5000.");
    }
}
