package com.prakash.gateaway_service.Exception;

public class InvalidAdminRecoveryTokenException extends RuntimeException {
    public InvalidAdminRecoveryTokenException(String message) {
        super(message);
    }
}
