package com.vitaloom.demo.dto;

public record ApiErrorResponse(ErrorDetail error) {

    public record ErrorDetail(String code, String message) {
    }
}
