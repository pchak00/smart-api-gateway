package com.prakash.gateaway_service.Exception;

public class InvalidAdminPasswordException extends RuntimeException {
    public InvalidAdminPasswordException(String message) {
        super(message);
    }
}
