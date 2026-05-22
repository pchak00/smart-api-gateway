package com.prakash.gateaway_service.Exception;

public class RouteLimitExistException extends RuntimeException {
    public RouteLimitExistException(String message) {
        super(message);
    }
}
