package com.vitaloom.demo.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("daily_sleep")
public record DailySleepRecord(@Id String date, Double sleepHours, Instant updatedAt) {}
