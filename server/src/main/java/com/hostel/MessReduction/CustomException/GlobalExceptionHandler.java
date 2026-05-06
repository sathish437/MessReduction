package com.hostel.MessReduction.CustomException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;

@ControllerAdvice
public class GlobalExceptionHandler {

    private ResponseEntity<HashMap<String, Object>> buildErrorResponse(String message, HttpStatus status) {
        HashMap<String, Object> map = new HashMap<>();
        map.put("message", message);
        map.put("statusCode", status.value());
        return new ResponseEntity<>(map, status);
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

}
