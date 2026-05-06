package com.hostel.MessReduction.CustomException;

public class InvalidActionException extends RuntimeException{
    public InvalidActionException(String msg){
        super(msg);
    }
}
