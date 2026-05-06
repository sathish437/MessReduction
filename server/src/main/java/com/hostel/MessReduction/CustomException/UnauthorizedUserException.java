package com.hostel.MessReduction.CustomException;

public class UnauthorizedUserException extends RuntimeException{
    public UnauthorizedUserException(String msg){
        super(msg);
    }
}
