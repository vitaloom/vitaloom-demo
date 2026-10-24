package com.vitaloom.demo.dto;

import java.util.List;

public record HeartRateBatchRequest(
        String runId,
        List<HeartRateEventRequest> events) {
}
