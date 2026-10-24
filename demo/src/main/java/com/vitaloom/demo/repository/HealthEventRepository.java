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

import com.vitaloom.demo.model.HealthEvent;
import com.vitaloom.demo.model.HealthMetricType;

@Repository
public class HealthEventRepository {

    private final MongoTemplate mongoTemplate;

    public HealthEventRepository(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * @return true if inserted; false if another request already stored this ID
     */
    public boolean insertIfAbsent(HealthEvent event) {
        try {
            mongoTemplate.insert(event);
            return true;
        } catch (DuplicateKeyException exception) {
            return false;
        }
    }

    public Optional<HealthEvent> findById(String eventId) {
        return Optional.ofNullable(mongoTemplate.findById(eventId, HealthEvent.class));
    }

    public List<HealthEvent> findByTypeAndOccurredAtBetween(
            HealthMetricType type,
            Instant startInclusive,
            Instant endExclusive) {
        Query query = new Query(
                Criteria.where("type").is(type)
                        .and("occurredAt").gte(startInclusive).lt(endExclusive))
                .with(Sort.by(
                        Sort.Order.asc("occurredAt"),
                        Sort.Order.asc("_id")));

        return mongoTemplate.find(query, HealthEvent.class);
    }
}
