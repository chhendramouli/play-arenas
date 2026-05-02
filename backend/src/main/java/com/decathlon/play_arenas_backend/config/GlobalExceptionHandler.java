package com.decathlon.play_arenas_backend.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException e) {
        String errors = e.getBindingResult().getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(Map.of(
            "error", errors,
            "status", 400,
            "timestamp", LocalDateTime.now().toString()
        ));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(Map.of(
            "error", e.getReason() != null ? e.getReason() : e.getMessage(),
            "status", e.getStatusCode().value(),
            "timestamp", LocalDateTime.now().toString()
        ));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
            "error", "Access denied",
            "status", 403,
            "timestamp", LocalDateTime.now().toString()
        ));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException e) {
        e.printStackTrace();
        return ResponseEntity.badRequest().body(Map.of(
            "error", e.getMessage() != null ? e.getMessage() : "Bad request",
            "status", 400,
            "timestamp", LocalDateTime.now().toString()
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "error", "An unexpected error occurred",
            "status", 500,
            "timestamp", LocalDateTime.now().toString()
        ));
    }
}
