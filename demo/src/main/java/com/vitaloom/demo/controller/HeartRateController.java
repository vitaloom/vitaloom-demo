package com.vitaloom.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vitaloom.demo.dto.BatchIngestionResponse;
import com.vitaloom.demo.dto.HeartRateBatchRequest;
import com.vitaloom.demo.service.HealthEventService;

@RestController
@RequestMapping("/api/heart-rate")
public class HeartRateController {

    private final HealthEventService healthEventService;

    public HeartRateController(HealthEventService healthEventService) {
        this.healthEventService = healthEventService;
    }

    @PostMapping("/batch")
    public ResponseEntity<BatchIngestionResponse> ingestBatch(
            @RequestBody HeartRateBatchRequest request) {
        return ResponseEntity.accepted().body(healthEventService.ingestHeartRate(request));
    }
}
