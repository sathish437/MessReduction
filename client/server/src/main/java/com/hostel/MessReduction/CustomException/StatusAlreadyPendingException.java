package com.hostel.MessReduction.CustomException;

public class StatusAlreadyPendingException extends RuntimeException{
    public StatusAlreadyPendingException(String msg){
        super(msg);
    }
}
