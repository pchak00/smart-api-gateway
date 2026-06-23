package com.prakash.gateaway_service.Exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({InvalidCredentialsException.class, InvalidProvisioningTokenException.class})
    public ResponseEntity<ExceptionResponse> handleInvalidCredentials(
            RuntimeException e, HttpServletRequest request
    ) {
        ExceptionResponse response = new ExceptionResponse(HttpStatus.UNAUTHORIZED.value(),
                e.getMessage(), System.currentTimeMillis(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler({ClientNotFoundException.class,
                      PlanNotFoundException.class,
                      AdminNotFoundException.class,
                      ProvisioningTokenNotFoundException.class})
    public ResponseEntity<ExceptionResponse> handleNotFound(
            RuntimeException e, HttpServletRequest request
    ) {
        ExceptionResponse response = new ExceptionResponse(HttpStatus.NOT_FOUND.value(),
                e.getMessage(), System.currentTimeMillis(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler({DuplicatePlanException.class, DuplicateClientException.class, PlanInUseException.class, RouteLimitExistException.class, DuplicateAdminException.class, LastSuperAdminException.class, DuplicateProvisioningTokenException.class})
    public ResponseEntity<ExceptionResponse> handleConflict(
            RuntimeException e, HttpServletRequest request
    ) {
        ExceptionResponse response = new ExceptionResponse(HttpStatus.CONFLICT.value(),
                e.getMessage(), System.currentTimeMillis(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler({InvalidPlanException.class,
                      InvalidClientException.class,
                      InvalidProvisioningRequestException.class,
                      InvalidGatewaySettingsException.class})
    public ResponseEntity<ExceptionResponse> handleBadRequest(
            RuntimeException e, HttpServletRequest request
    ) {
        ExceptionResponse response = new ExceptionResponse(HttpStatus.BAD_REQUEST.value(),
                e.getMessage(), System.currentTimeMillis(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler({InactiveProvisioningTokenException.class, DisallowedProvisioningPlanException.class})
    public ResponseEntity<ExceptionResponse> handleForbidden(
            RuntimeException e, HttpServletRequest request
    ) {
        ExceptionResponse response = new ExceptionResponse(HttpStatus.FORBIDDEN.value(),
                e.getMessage(), System.currentTimeMillis(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }
}
