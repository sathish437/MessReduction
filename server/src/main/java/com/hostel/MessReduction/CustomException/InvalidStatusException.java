package com.hostel.MessReduction.CustomException;

public class InvalidStatusException extends RuntimeException{
    public InvalidStatusException(String msg){
        super(msg);
    }
}
