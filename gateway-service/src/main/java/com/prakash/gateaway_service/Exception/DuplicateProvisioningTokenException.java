package com.prakash.gateaway_service.Exception;

public class DuplicateProvisioningTokenException extends RuntimeException {
    public DuplicateProvisioningTokenException(String message) {
        super(message);
    }
}
