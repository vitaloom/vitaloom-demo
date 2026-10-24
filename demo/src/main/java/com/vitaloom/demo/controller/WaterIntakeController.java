package com.vitaloom.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.vitaloom.demo.dto.WaterIntakeRequest;
import com.vitaloom.demo.dto.WaterIntakeResponse;
import com.vitaloom.demo.service.WaterIntakeService;

@RestController
@RequestMapping("/api/water-intakes")
public class WaterIntakeController {
    private final WaterIntakeService service;
    public WaterIntakeController(WaterIntakeService service) { this.service = service; }

    @PostMapping
    public ResponseEntity<WaterIntakeResponse> create(@RequestBody WaterIntakeRequest request) {
        WaterIntakeResponse response = service.record(request);
        return "DUPLICATE".equals(response.status())
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
