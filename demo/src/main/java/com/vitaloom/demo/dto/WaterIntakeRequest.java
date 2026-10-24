package com.vitaloom.demo.dto;

import java.time.OffsetDateTime;

public record WaterIntakeRequest(String intakeId, OffsetDateTime occurredAt, Integer amountMl) {}
