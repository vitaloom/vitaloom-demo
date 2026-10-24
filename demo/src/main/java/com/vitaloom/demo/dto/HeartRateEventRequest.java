package com.vitaloom.demo.dto;

import java.time.OffsetDateTime;

public record HeartRateEventRequest(
        String eventId,
        OffsetDateTime occurredAt,
        Integer heartRateBpm) {
}
