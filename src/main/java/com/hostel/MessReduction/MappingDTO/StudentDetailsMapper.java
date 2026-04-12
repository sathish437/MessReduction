package com.hostel.MessReduction.MappingDTO;

import com.hostel.MessReduction.DTO.ReqDTO.StudentDetailsReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentDetailsResDTO;
import com.hostel.MessReduction.Entity.StudentDetails;

public class StudentDetailsMapper {
    public static StudentDetails mapToStudentDetails(StudentDetailsReqDTO studentDetailsReqDTO){
        StudentDetails studentDetails=new StudentDetails();

        studentDetails.setName(studentDetailsReqDTO.getName());
        studentDetails.setRegisterNo(studentDetailsReqDTO.getRegisterNo());
        studentDetails.setRollNo(studentDetailsReqDTO.getRollNo());
        studentDetails.setDepartment(studentDetailsReqDTO.getDepartment());
        studentDetails.setDob(studentDetailsReqDTO.getDob());
        studentDetails.setEmailId(studentDetailsReqDTO.getEmailId());
        studentDetails.setDepartment(studentDetailsReqDTO.getDepartment());
        studentDetails.setPhoneNo(studentDetailsReqDTO.getPhoneNo());

        return studentDetails;
    }

    public static StudentDetailsResDTO mapToStudentDetailsResDTO(StudentDetails studentDetails){
        StudentDetailsResDTO studentDetailsResDTO = new StudentDetailsResDTO();

        studentDetailsResDTO.setStudentId(studentDetails.getStudentId());
        studentDetailsResDTO.setEmailId(studentDetails.getEmailId());

        return studentDetailsResDTO;
    }
}
