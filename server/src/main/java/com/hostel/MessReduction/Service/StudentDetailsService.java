package com.hostel.MessReduction.Service;

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
        if(studentDetailsRepo.existsByEmailId(dto.getEmailId())){
            throw new IllegalArgumentException("Email already exists");
        }

        Department department = departmentService.findEntityByCode(dto.getDepartment());
        if (!department.getIsActive()) {
            throw new IllegalArgumentException("Selected department is inactive and cannot be selected for new registrations.");
        }

        try {
            StudentDetails student = StudentDetailsMapper.mapToStudentDetails(dto, department);
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
