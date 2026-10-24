package com.vitaloom.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.vitaloom.demo.dto.SleepDailyRequest;
import com.vitaloom.demo.dto.SleepDailyResponse;
import com.vitaloom.demo.service.DailySleepService;

@RestController
@RequestMapping("/api/sleep")
public class SleepController {
    private final DailySleepService service;
    public SleepController(DailySleepService service) { this.service = service; }

    @PutMapping("/daily")
    public ResponseEntity<SleepDailyResponse> update(@RequestBody SleepDailyRequest request) {
        return ResponseEntity.ok(service.updateDaily(request));
    }
}
