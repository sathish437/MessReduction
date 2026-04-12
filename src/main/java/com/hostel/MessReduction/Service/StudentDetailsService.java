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
        StudentDetails student= StudentDetailsMapper.mapToStudentDetails(dto);
        studentDetailsRepo.save(student);
        return StudentDetailsMapper.mapToStudentDetailsResDTO(student);
    }
}
