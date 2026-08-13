package com.hostel.MessReduction.CustomException;

/**
 * Thrown when a bulk approve operation detects that fewer rows were updated
 * than expected, indicating a concurrent modification by another request.
 *
 * Maps to HTTP 409 Conflict via GlobalExceptionHandler.
 */
public class ConcurrentModificationException extends RuntimeException {
    public ConcurrentModificationException(String message) {
        super(message);
    }
}
