package com.vitaloom.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.vitaloom.demo.dto.ApiErrorResponse;
import com.vitaloom.demo.service.EventIdConflictException;
import com.vitaloom.demo.service.IntakeIdConflictException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidRequest(IllegalArgumentException exception) {
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", exception.getMessage());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadableRequest() {
        return error(
                HttpStatus.BAD_REQUEST,
                "INVALID_REQUEST",
                "The request body is missing or malformed.");
    }

    @ExceptionHandler(EventIdConflictException.class)
    public ResponseEntity<ApiErrorResponse> handleEventIdConflict(EventIdConflictException exception) {
        return error(HttpStatus.CONFLICT, "EVENT_ID_CONFLICT", exception.getMessage());
    }

    @ExceptionHandler(IntakeIdConflictException.class)
    public ResponseEntity<ApiErrorResponse> handleIntakeIdConflict(IntakeIdConflictException exception) {
        return error(HttpStatus.CONFLICT, "INTAKE_ID_CONFLICT", exception.getMessage());
    }

    private ResponseEntity<ApiErrorResponse> error(
            HttpStatus status,
            String code,
            String message) {
        return ResponseEntity.status(status)
                .body(new ApiErrorResponse(new ApiErrorResponse.ErrorDetail(code, message)));
    }
}
