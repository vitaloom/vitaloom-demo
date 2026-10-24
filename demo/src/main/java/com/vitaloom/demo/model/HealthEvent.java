package com.vitaloom.demo.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("health_events")
public record HealthEvent(
        @Id String eventId,
        String runId,
        HealthMetricType type,
        Instant occurredAt,
        Instant receivedAt,
        Integer value) {
}
