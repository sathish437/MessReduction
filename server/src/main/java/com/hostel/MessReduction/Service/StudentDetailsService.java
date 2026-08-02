package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.DuplicateStudentException;
import com.hostel.MessReduction.DTO.ReqDTO.StudentDetailsReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentDetailsResDTO;
import com.hostel.MessReduction.Entity.Department;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.MappingDTO.StudentDetailsMapper;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import org.springframework.stereotype.Service;

@Service
public class StudentDetailsService {
    private final StudentDetailsRepo studentDetailsRepo;
    private final DepartmentService departmentService;

    public StudentDetailsService(StudentDetailsRepo studentDetailsRepo, DepartmentService departmentService){
        this.studentDetailsRepo = studentDetailsRepo;
        this.departmentService = departmentService;
    }

    public StudentDetailsResDTO addStudent(StudentDetailsReqDTO dto){
        if (dto.getRollNo() != null && Boolean.TRUE.equals(studentDetailsRepo.existsByRollNo(dto.getRollNo()))) {
            throw new DuplicateStudentException("This Roll Number is already registered!");
        }

        if (dto.getRegisterNo() != null && Boolean.TRUE.equals(studentDetailsRepo.existsByRegisterNo(dto.getRegisterNo()))) {
            throw new DuplicateStudentException("This Register Number is already registered!");
        }

        if (dto.getEmailId() != null && Boolean.TRUE.equals(studentDetailsRepo.existsByEmailId(dto.getEmailId()))) {
            throw new DuplicateStudentException("Email already exists");
        }

        if (dto.getPhoneNo() != null && Boolean.TRUE.equals(studentDetailsRepo.existsByPhoneNo(dto.getPhoneNo()))) {
            throw new DuplicateStudentException("This Phone Number is already registered!");
        }

        if (dto.getDepartment() != null) {
            Department department = departmentService.findEntityByCode(dto.getDepartment());
            if (!department.getIsActive()) {
                throw new IllegalArgumentException("Selected department is inactive and cannot be selected for new registrations.");
            }
        }

        try {
            StudentDetails student = StudentDetailsMapper.mapToStudentDetails(dto);
            studentDetailsRepo.saveAndFlush(student);
            return StudentDetailsMapper.mapToStudentDetailsResDTO(student);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            String errorMsg = e.getMostSpecificCause().getMessage();
            if (errorMsg != null && errorMsg.contains("phone_no")) {
                throw new DuplicateStudentException("This Phone Number is already registered!");
            } else if (errorMsg != null && errorMsg.contains("register_no")) {
                throw new DuplicateStudentException("This Register Number is already registered!");
            } else if (errorMsg != null && errorMsg.contains("roll_no")) {
                throw new DuplicateStudentException("This Roll Number is already registered!");
            } else {
                throw new DuplicateStudentException("Registration failed: Details already exist.");
            }
        }
    }
}
