package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.DTO.ReqDTO.StudentDetailsReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentDetailsResDTO;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.MappingDTO.StudentDetailsMapper;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import org.springframework.stereotype.Service;

@Service
public class StudentDetailsService {
    private final StudentDetailsRepo studentDetailsRepo;
    public StudentDetailsService(StudentDetailsRepo studentDetailsRepo){
        this.studentDetailsRepo=studentDetailsRepo;
    }

    public StudentDetailsResDTO addStudent(StudentDetailsReqDTO dto){
        if(studentDetailsRepo.existsByEmailId(dto.getEmailId())){
            throw new IllegalArgumentException("Email already exists");
        }
        try {
            StudentDetails student = StudentDetailsMapper.mapToStudentDetails(dto);
            studentDetailsRepo.save(student);
            return StudentDetailsMapper.mapToStudentDetailsResDTO(student);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            String errorMsg = e.getMostSpecificCause().getMessage();
            if (errorMsg != null && errorMsg.contains("phone_no")) {
                throw new IllegalArgumentException("This Phone Number is already registered!");
            } else if (errorMsg != null && errorMsg.contains("register_no")) {
                throw new IllegalArgumentException("This Register Number is already registered!");
            } else if (errorMsg != null && errorMsg.contains("roll_no")) {
                throw new IllegalArgumentException("This Roll Number is already registered!");
            } else {
                throw new IllegalArgumentException("Registration failed: Details already exist.");
            }
        }
    }
}
