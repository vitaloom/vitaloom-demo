package com.vitaloom.demo.dto;

public record BatchIngestionResponse(
        String runId,
        int received,
        int accepted,
        int duplicates) {
}
