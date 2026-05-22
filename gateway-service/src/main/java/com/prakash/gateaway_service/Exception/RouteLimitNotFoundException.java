package com.prakash.gateaway_service.Exception;

public class RouteLimitNotFoundException extends RuntimeException {
    public RouteLimitNotFoundException(String message) {
        super(message);
    }
}
