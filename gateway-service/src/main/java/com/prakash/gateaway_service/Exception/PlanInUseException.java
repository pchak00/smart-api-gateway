package com.prakash.gateaway_service.Exception;

public class PlanInUseException extends RuntimeException {
    public PlanInUseException(String message) {
        super(message);
    }
}
