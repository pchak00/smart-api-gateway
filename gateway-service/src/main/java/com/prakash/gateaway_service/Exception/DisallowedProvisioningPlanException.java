package com.prakash.gateaway_service.Exception;

public class DisallowedProvisioningPlanException extends RuntimeException {
    public DisallowedProvisioningPlanException(String message) {
        super(message);
    }
}
