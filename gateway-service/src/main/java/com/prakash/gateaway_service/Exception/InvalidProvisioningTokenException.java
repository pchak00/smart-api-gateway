package com.prakash.gateaway_service.Exception;

public class InvalidProvisioningTokenException extends RuntimeException {
    public InvalidProvisioningTokenException(String message) {
        super(message);
    }
}
