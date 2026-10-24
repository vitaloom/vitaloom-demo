package com.vitaloom.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.vitaloom.demo.dto.DailyStatisticsResponse;
import com.vitaloom.demo.service.DailyStatisticsService;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {
    private final DailyStatisticsService service;
    public StatisticsController(DailyStatisticsService service) { this.service = service; }

    @GetMapping("/daily")
    public ResponseEntity<DailyStatisticsResponse> getDaily() {
        return ResponseEntity.ok(service.getDailyStatistics());
    }
}
