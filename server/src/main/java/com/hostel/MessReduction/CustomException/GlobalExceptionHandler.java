package com.hostel.MessReduction.CustomException;

import com.hostel.MessReduction.utils.TelegramNotificationService;
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

    private final TelegramNotificationService telegram;

    public GlobalExceptionHandler(TelegramNotificationService telegram) {
        this.telegram = telegram;
    }

    private ResponseEntity<HashMap<String, Object>> buildErrorResponse(String message, HttpStatus status) {
        HashMap<String, Object> map = new HashMap<>();
        map.put("success", false);
        map.put("message", message);
        map.put("statusCode", status.value());
        return new ResponseEntity<>(map, status);
    }

    @ExceptionHandler(DuplicateStudentException.class)
    public ResponseEntity<HashMap<String, Object>> handleDuplicateStudent(DuplicateStudentException exp) {
        logger.info("Duplicate student registration attempt: {}", exp.getMessage());
        return buildErrorResponse(exp.getMessage(), HttpStatus.CONFLICT);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<HashMap<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining(", "));
        telegram.sendExceptionAlert(ex, "Validation failed: " + message);
        return buildErrorResponse("Validation failed: " + message, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(StudentNotFoundException.class)
    public ResponseEntity<HashMap<String, Object>> handleStudentNotFound(StudentNotFoundException exp) {
        telegram.sendExceptionAlert(exp, "StudentNotFoundException");
        return buildErrorResponse(exp.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(StatusAlreadyPendingException.class)
    public ResponseEntity<HashMap<String, Object>> handleStatusAlreadyPending(StatusAlreadyPendingException exp) {
        telegram.sendExceptionAlert(exp, "StatusAlreadyPendingException");
        return buildErrorResponse(exp.getMessage(), HttpStatus.CONFLICT);
    }
    
    @ExceptionHandler(DateNotValidException.class)
    public ResponseEntity<HashMap<String, Object>> handleDateNotValid(DateNotValidException exp) {
        telegram.sendExceptionAlert(exp, "DateNotValidException");
        return buildErrorResponse(exp.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(TotalLeaveDateCountException.class)
    public ResponseEntity<HashMap<String, Object>> handleTotalLeaveDateCount(TotalLeaveDateCountException exp) {
        telegram.sendExceptionAlert(exp, "TotalLeaveDateCountException");
        return buildErrorResponse(exp.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UnauthorizedUserException.class)
    public ResponseEntity<HashMap<String, Object>> handleUnauthorizedUser(UnauthorizedUserException exp) {
        telegram.sendExceptionAlert(exp, "UnauthorizedUserException");
        return buildErrorResponse(exp.getMessage(), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<HashMap<String, Object>> handleBadRequest(BadRequestException exp) {
        telegram.sendExceptionAlert(exp, "BadRequestException");
        return buildErrorResponse(exp.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ReductionFormNotFoundException.class)
    public ResponseEntity<HashMap<String, Object>> handleReductionFormNotFound(ReductionFormNotFoundException exp) {
        telegram.sendExceptionAlert(exp, "ReductionFormNotFoundException");
        return buildErrorResponse(exp.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(InvalidStatusException.class)
    public ResponseEntity<HashMap<String, Object>> handleInvalidStatus(InvalidStatusException exp) {
        telegram.sendExceptionAlert(exp, "InvalidStatusException");
        return buildErrorResponse(exp.getMessage(), HttpStatus.CONFLICT);
    }

    @ExceptionHandler(InvalidActionException.class)
    public ResponseEntity<HashMap<String, Object>> handleInvalidAction(InvalidActionException exp) {
        telegram.sendExceptionAlert(exp, "InvalidActionException");
        return buildErrorResponse(exp.getMessage(), HttpStatus.CONFLICT);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<HashMap<String, Object>> handleInvalidCredentials(InvalidCredentialsException exp) {
        logger.warn("Invalid credentials attempt: {}", exp.getMessage());
        return buildErrorResponse(exp.getMessage(), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(StudentVerificationFailedException.class)
    public ResponseEntity<HashMap<String, Object>> handleStudentVerificationFailed(StudentVerificationFailedException exp) {
        telegram.sendExceptionAlert(exp, "StudentVerificationFailedException");
        HashMap<String, Object> map = new HashMap<>();
        map.put("success", false);
        map.put("message", exp.getMessage());
        return new ResponseEntity<>(map, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(StudentVerificationServiceUnavailableException.class)
    public ResponseEntity<HashMap<String, Object>> handleStudentVerificationServiceUnavailable(StudentVerificationServiceUnavailableException exp) {
        telegram.sendExceptionAlert(exp, "StudentVerificationServiceUnavailableException");
        HashMap<String, Object> map = new HashMap<>();
        map.put("success", false);
        map.put("message", exp.getMessage());
        return new ResponseEntity<>(map, HttpStatus.SERVICE_UNAVAILABLE);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<HashMap<String, Object>> handleIllegalArgument(IllegalArgumentException exp) {
        logger.warn("IllegalArgumentException: {}", exp.getMessage());
        return buildErrorResponse(exp.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<HashMap<String, Object>> handleNullPointer(NullPointerException exp) {
        logger.error("NullPointerException encountered: ", exp);
        telegram.sendExceptionAlert(exp, "NullPointerException");
        return buildErrorResponse("Invalid request payload or missing required data", HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<HashMap<String, Object>> handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException exp) {
        logger.warn("Data integrity violation: {}", exp.getMostSpecificCause().getMessage());
        return buildErrorResponse("Data integrity violation or duplicate record", HttpStatus.CONFLICT);
    }

    @ExceptionHandler({org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class, org.springframework.web.bind.MissingServletRequestParameterException.class})
    public ResponseEntity<HashMap<String, Object>> handleParameterExceptions(Exception exp) {
        logger.warn("Invalid request parameters: {}", exp.getMessage());
        return buildErrorResponse("Invalid or missing request parameter: " + exp.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<HashMap<String, Object>> handleHttpMessageNotReadable(HttpMessageNotReadableException exp) {
        logger.error("HttpMessageNotReadableException: ", exp);
        telegram.sendExceptionAlert(exp, "HttpMessageNotReadableException");
        return buildErrorResponse("Invalid JSON payload or missing required fields", HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<HashMap<String, Object>> handleRuntimeException(RuntimeException exp) {
        logger.error("RuntimeException: ", exp);
        telegram.sendExceptionAlert(exp, "RuntimeException");
        return buildErrorResponse(exp.getMessage() != null ? exp.getMessage() : "Bad Request", HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler({org.springframework.transaction.UnexpectedRollbackException.class, org.springframework.transaction.TransactionSystemException.class})
    public ResponseEntity<HashMap<String, Object>> handleTransactionException(Exception exp) {
        logger.error("Transaction Exception: ", exp);
        Throwable rootCause = org.springframework.core.NestedExceptionUtils.getMostSpecificCause(exp);
        String message = (rootCause != null && rootCause.getMessage() != null && !rootCause.getMessage().contains("Transaction silently rolled back"))
                ? rootCause.getMessage()
                : "Request failed validation. Please check input details.";
        telegram.sendExceptionAlert(exp, "Transaction Exception: " + message);
        return buildErrorResponse(message, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<HashMap<String, Object>> handleGeneralException(Exception exp) {
        logger.error("Unhandled Exception: ", exp);
        telegram.sendExceptionAlert(exp, "Unhandled Exception");
        return buildErrorResponse(exp.getMessage() != null ? exp.getMessage() : "Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR);
    }

}
