package com.hostel.MessReduction.CustomException;

public class DateNotValidException extends RuntimeException{
    public DateNotValidException(String msg){
        super(msg);
    }
}
