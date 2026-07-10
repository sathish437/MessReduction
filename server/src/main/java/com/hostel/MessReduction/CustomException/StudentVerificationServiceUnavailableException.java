package com.hostel.MessReduction.CustomException;

public class StudentVerificationServiceUnavailableException extends RuntimeException {
    public StudentVerificationServiceUnavailableException(String msg) {
        super(msg);
    }

    public StudentVerificationServiceUnavailableException(String msg, Throwable cause) {
        super(msg, cause);
    }
}
