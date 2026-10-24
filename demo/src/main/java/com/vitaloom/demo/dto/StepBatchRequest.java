package com.vitaloom.demo.dto;

import java.util.List;

public record StepBatchRequest(
        String runId,
        List<StepEventRequest> events) {
}
