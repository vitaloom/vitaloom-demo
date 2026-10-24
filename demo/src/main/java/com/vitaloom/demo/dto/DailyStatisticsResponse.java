package com.vitaloom.demo.dto;

public record DailyStatisticsResponse(
        String date, String timezone, Integer heartRateBpm, Long steps, Double sleepHours, Long waterMl) {}
