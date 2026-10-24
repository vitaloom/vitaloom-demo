package com.vitaloom.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vitaloom.demo.dto.BatchIngestionResponse;
import com.vitaloom.demo.dto.StepBatchRequest;
import com.vitaloom.demo.service.HealthEventService;

@RestController
@RequestMapping("/api/steps")
public class StepsController {

    private final HealthEventService healthEventService;

    public StepsController(HealthEventService healthEventService) {
        this.healthEventService = healthEventService;
    }

    @PostMapping("/batch")
    public ResponseEntity<BatchIngestionResponse> ingestBatch(
            @RequestBody StepBatchRequest request) {
        return ResponseEntity.accepted().body(healthEventService.ingestSteps(request));
    }
}
