package com.vitaloom.demo.dto;

import java.time.OffsetDateTime;

public record StepEventRequest(
        String eventId,
        OffsetDateTime occurredAt,
        Integer stepsDelta) {
}
