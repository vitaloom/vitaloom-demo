package com.vitaloom.demo.service;

public class IntakeIdConflictException extends RuntimeException {
    public IntakeIdConflictException(String intakeId) {
        super("The intake ID is already associated with a different payload: " + intakeId);
    }
}
