package com.hostel.MessReduction.CustomException;

public class StudentNotFoundException extends RuntimeException{
    public StudentNotFoundException(String msg){
        super(msg);
    }
}
