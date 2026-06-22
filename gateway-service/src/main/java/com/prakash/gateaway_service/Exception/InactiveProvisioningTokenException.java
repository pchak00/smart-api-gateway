package com.prakash.gateaway_service.Exception;

public class InactiveProvisioningTokenException extends RuntimeException {
    public InactiveProvisioningTokenException(String message) {
        super(message);
    }
}
