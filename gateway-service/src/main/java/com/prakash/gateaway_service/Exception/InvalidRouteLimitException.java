package com.prakash.gateaway_service.Exception;

public class InvalidRouteLimitException extends RuntimeException {
    public InvalidRouteLimitException(String message) {
        super(message);
    }
}
