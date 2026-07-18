package com.hostel.MessReduction.CustomException;

import com.hostel.MessReduction.CustomException.BadRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.stream.Collectors;
import org.springframework.http.converter.HttpMessageNotReadableException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private ResponseEntity<HashMap<String, Object>> buildErrorResponse(String message, HttpStatus status) {
        HashMap<String, Object> map = new HashMap<>();
        map.put("message", message);
        map.put("statusCode", status.value());
        return new ResponseEntity<>(map, status);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<HashMap<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return buildErrorResponse("Validation failed: " + message, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(StudentNotFoundException.class)
    public ResponseEntity<HashMap<String, Object>> handleStudentNotFound(StudentNotFoundException exp) {
        return buildErrorResponse(exp.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(StatusAlreadyPendingException.class)
    public ResponseEntity<HashMap<String, Object>> handleStatusAlreadyPending(StatusAlreadyPendingException exp) {
        return buildErrorResponse(exp.getMessage(), HttpStatus.CONFLICT);
    }
    
    @ExceptionHandler(DateNotValidException.class)
    public ResponseEntity<HashMap<String, Object>> handleDateNotValid(DateNotValidException exp) {
        return buildErrorResponse(exp.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(TotalLeaveDateCountException.class)
    public ResponseEntity<HashMap<String, Object>> handleTotalLeaveDateCount(TotalLeaveDateCountException exp) {
        return buildErrorResponse(exp.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UnauthorizedUserException.class)
    public ResponseEntity<HashMap<String, Object>> handleUnauthorizedUser(UnauthorizedUserException exp) {
        return buildErrorResponse(exp.getMessage(), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<HashMap<String, Object>> handleBadRequest(BadRequestException exp) {
        return buildErrorResponse(exp.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ReductionFormNotFoundException.class)
    public ResponseEntity<HashMap<String, Object>> handleReductionFormNotFound(ReductionFormNotFoundException exp) {
        return buildErrorResponse(exp.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(InvalidStatusException.class)
    public ResponseEntity<HashMap<String, Object>> handleInvalidStatus(InvalidStatusException exp) {
        return buildErrorResponse(exp.getMessage(), HttpStatus.CONFLICT);
    }

    @ExceptionHandler(InvalidActionException.class)
    public ResponseEntity<HashMap<String, Object>> handleInvalidAction(InvalidActionException exp) {
        return buildErrorResponse(exp.getMessage(), HttpStatus.CONFLICT);
    }

    @ExceptionHandler(StudentVerificationFailedException.class)
    public ResponseEntity<HashMap<String, Object>> handleStudentVerificationFailed(StudentVerificationFailedException exp) {
        HashMap<String, Object> map = new HashMap<>();
        map.put("message", exp.getMessage());
        return new ResponseEntity<>(map, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(StudentVerificationServiceUnavailableException.class)
    public ResponseEntity<HashMap<String, Object>> handleStudentVerificationServiceUnavailable(StudentVerificationServiceUnavailableException exp) {
        HashMap<String, Object> map = new HashMap<>();
        map.put("message", exp.getMessage());
        return new ResponseEntity<>(map, HttpStatus.SERVICE_UNAVAILABLE);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<HashMap<String, Object>> handleIllegalArgument(IllegalArgumentException exp) {
        logger.error("IllegalArgumentException: ", exp);
        return buildErrorResponse(exp.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<HashMap<String, Object>> handleHttpMessageNotReadable(HttpMessageNotReadableException exp) {
        logger.error("HttpMessageNotReadableException: ", exp);
        return buildErrorResponse("Invalid JSON payload or missing required fields", HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<HashMap<String, Object>> handleGeneralException(Exception exp) {
        logger.error("Unhandled Exception: ", exp);
        return buildErrorResponse(exp.getMessage() != null ? exp.getMessage() : "Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR);
    }

}
