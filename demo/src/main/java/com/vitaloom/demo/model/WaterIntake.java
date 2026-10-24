package com.vitaloom.demo.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("water_intakes")
public record WaterIntake(@Id String intakeId, Instant occurredAt, Instant receivedAt, Integer amountMl) {}
