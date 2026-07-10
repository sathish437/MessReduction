package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.InvalidCredentialsException;
import com.hostel.MessReduction.CustomException.StudentNotFoundException;
import com.hostel.MessReduction.DTO.ReqDTO.StudentLoginReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.AuthResponseDTO;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import com.hostel.MessReduction.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class StudentAuthService {

    private final StudentDetailsRepo studentDetailsRepo;
    private final JwtUtil jwtUtil;

    public AuthResponseDTO login(StudentLoginReqDTO loginRequest) {
        String identifier = loginRequest.getIdentifier().trim();
        LocalDate dob = loginRequest.getDob();

        // Find student by registerNo or rollNo
        StudentDetails student = studentDetailsRepo.findByRegisterNo(identifier)
                .or(() -> studentDetailsRepo.findByRollNo(identifier))
                .orElseThrow(() -> new InvalidCredentialsException("Invalid Register Number/Roll Number or Date of Birth"));

        // Verify DOB
        if (student.getDob() == null || !student.getDob().equals(dob)) {
            throw new InvalidCredentialsException("Invalid Register Number/Roll Number or Date of Birth");
        }

        // Generate JWT token (always using registerNo as the principal subject)
        String token = jwtUtil.generateToken(student.getRegisterNo(), student.getStudentId());

        // Build response
        AuthResponseDTO response = new AuthResponseDTO();
        response.setToken(token);
        response.setStudentId(student.getStudentId());
        response.setName(student.getName());
        response.setRegisterNo(student.getRegisterNo());
        response.setRollNo(student.getRollNo());

        return response;
    }
}
