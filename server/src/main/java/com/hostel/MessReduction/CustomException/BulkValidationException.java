package com.hostel.MessReduction.CustomException;

/**
 * Thrown when a bulk operation request fails input validation,
 * e.g. exceeds the configured maximum bulk size or contains only invalid IDs.
 *
 * Maps to HTTP 400 Bad Request via GlobalExceptionHandler.
 */
public class BulkValidationException extends RuntimeException {
    public BulkValidationException(String message) {
        super(message);
    }
}
