package com.vitaloom.demo.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;
import com.vitaloom.demo.model.WaterIntake;

@Repository
public class WaterIntakeRepository {
    private final MongoTemplate mongoTemplate;
    public WaterIntakeRepository(MongoTemplate mongoTemplate) { this.mongoTemplate = mongoTemplate; }

    public boolean insertIfAbsent(WaterIntake intake) {
        try { mongoTemplate.insert(intake); return true; }
        catch (DuplicateKeyException exception) { return false; }
    }

    public Optional<WaterIntake> findById(String intakeId) {
        return Optional.ofNullable(mongoTemplate.findById(intakeId, WaterIntake.class));
    }

    public List<WaterIntake> findByOccurredAtBetween(Instant start, Instant end) {
        Query query = new Query(Criteria.where("occurredAt").gte(start).lt(end))
                .with(Sort.by(Sort.Order.asc("occurredAt"), Sort.Order.asc("_id")));
        return mongoTemplate.find(query, WaterIntake.class);
    }
}
