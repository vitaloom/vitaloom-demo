package com.vitaloom.demo.repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Repository;
import com.vitaloom.demo.model.DailySleepRecord;

@Repository
public class DailySleepRepository {
    private final MongoTemplate mongoTemplate;
    public DailySleepRepository(MongoTemplate mongoTemplate) { this.mongoTemplate = mongoTemplate; }

    public DailySleepRecord saveForDate(LocalDate date, Double hours, Instant updatedAt) {
        return mongoTemplate.save(new DailySleepRecord(date.toString(), hours, updatedAt));
    }

    public Optional<DailySleepRecord> findByDate(LocalDate date) {
        return Optional.ofNullable(mongoTemplate.findById(date.toString(), DailySleepRecord.class));
    }
}
