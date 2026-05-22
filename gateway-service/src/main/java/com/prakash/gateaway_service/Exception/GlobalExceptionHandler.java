package com.prakash.gateaway_service.Exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ExceptionResponse> handleInvalidCredentials(
            InvalidCredentialsException e, HttpServletRequest request
    ) {
        ExceptionResponse response = new ExceptionResponse(HttpStatus.UNAUTHORIZED.value(),
                e.getMessage(), System.currentTimeMillis(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler({ClientNotFoundException.class,
                      PlanNotFoundException.class,
                       RouteLimitExistException.class,})
    public ResponseEntity<ExceptionResponse> handleNotFound(
            RuntimeException e, HttpServletRequest request
    ) {
        ExceptionResponse response = new ExceptionResponse(HttpStatus.NOT_FOUND.value(),
                e.getMessage(), System.currentTimeMillis(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler({DuplicatePlanException.class, PlanInUseException.class, RouteLimitExistException.class})
    public ResponseEntity<ExceptionResponse> handleConflict(
            RuntimeException e, HttpServletRequest request
    ) {
        ExceptionResponse response = new ExceptionResponse(HttpStatus.CONFLICT.value(),
                e.getMessage(), System.currentTimeMillis(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }
}
