package com.hostel.MessReduction.MappingDTO;

import com.hostel.MessReduction.DTO.ReqDTO.StudentLoginReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentLoginResDTO;
import com.hostel.MessReduction.Entity.StudentDetails;

public class StudentLoginMapper {
    public static StudentLoginResDTO mapToStudentDetails(StudentDetails studentDetails){
        StudentLoginResDTO studentLoginResDTO = new StudentLoginResDTO();

        studentLoginResDTO.setStudentId(studentDetails.getStudentId());
        studentLoginResDTO.setName(studentDetails.getName());
        studentLoginResDTO.setRegisterNo(studentDetails.getRegisterNo());
        studentLoginResDTO.setRollNo(studentDetails.getRollNo());
        studentLoginResDTO.setDob(studentDetails.getDob());
        studentLoginResDTO.setPhoneNo(studentDetails.getPhoneNo());
        studentLoginResDTO.setEmailId(studentDetails.getEmailId());
        studentLoginResDTO.setDepartment(studentDetails.getDepartment());
        studentLoginResDTO.setGender(studentDetails.getGender());

        return studentLoginResDTO;
    }
}
