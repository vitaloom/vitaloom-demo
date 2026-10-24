package com.vitaloom.demo.service;

public class EventIdConflictException extends RuntimeException {

    public EventIdConflictException(String eventId) {
        super("The event ID is already associated with a different payload: " + eventId);
    }
}
