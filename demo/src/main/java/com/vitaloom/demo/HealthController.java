package com.vitaloom.demo;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final MongoTemplate mongoTemplate;

    public HealthController(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping
    public ResponseEntity<HealthResponse> checkHealth() {
        try {
            mongoTemplate.executeCommand(new Document("ping", 1));
            return ResponseEntity.ok(new HealthResponse("UP", "UP"));
        } catch (RuntimeException exception) {
            // Avoid exposing connection details or credentials through a public health endpoint.
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new HealthResponse("DOWN", "DOWN"));
        }
    }

    public record HealthResponse(String status, String database) {
    }
}
