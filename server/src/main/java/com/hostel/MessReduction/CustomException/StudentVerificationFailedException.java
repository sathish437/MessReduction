package com.hostel.MessReduction.CustomException;

public class StudentVerificationFailedException extends RuntimeException {
    public StudentVerificationFailedException(String msg) {
        super(msg);
    }
}
