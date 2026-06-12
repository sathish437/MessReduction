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
        String emailId = loginRequest.getEmailId().trim();
        LocalDate dob = loginRequest.getDob();

        // Find student by emailId and dob
        StudentDetails student = studentDetailsRepo.findByEmailIdAndDob(emailId, dob)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or date of birth"));

        // Generate JWT token
        String token = jwtUtil.generateToken(student.getEmailId(), student.getStudentId());

        // Build response
        AuthResponseDTO response = new AuthResponseDTO();
        response.setToken(token);
        response.setStudentId(student.getStudentId());
        response.setName(student.getName());

        return response;
    }
}
