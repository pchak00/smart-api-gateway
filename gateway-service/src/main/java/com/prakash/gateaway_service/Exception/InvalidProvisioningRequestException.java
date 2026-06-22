package com.prakash.gateaway_service.Exception;

public class InvalidProvisioningRequestException extends RuntimeException {
    public InvalidProvisioningRequestException(String message) {
        super(message);
    }
}
