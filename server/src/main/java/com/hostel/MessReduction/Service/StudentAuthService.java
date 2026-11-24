package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.InvalidCredentialsException;
import com.hostel.MessReduction.DTO.ReqDTO.CompleteProfileReqDTO;
import com.hostel.MessReduction.DTO.ReqDTO.StudentLoginReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.AuthResponseDTO;
import com.hostel.MessReduction.Entity.Gender;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Entity.readonly.HostelStudent;
import com.hostel.MessReduction.Entity.readonly.HostelUser;
import com.hostel.MessReduction.Repo.HostelStudentRepository;
import com.hostel.MessReduction.Repo.HostelUserRepository;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import com.hostel.MessReduction.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StudentAuthService {

    private static final Logger logger = LoggerFactory.getLogger(StudentAuthService.class);

    private final StudentDetailsRepo studentDetailsRepo;
    private final HostelUserRepository hostelUserRepository;
    private final HostelStudentRepository hostelStudentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponseDTO login(StudentLoginReqDTO loginRequest) {
        if (loginRequest == null || loginRequest.getIdentifier() == null || loginRequest.getIdentifier().trim().isEmpty()
                || loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
            throw new InvalidCredentialsException("Invalid credentials. Please provide Register Number / Roll Number and Password.");
        }

        String identifier = loginRequest.getIdentifier().trim();
        String rawPassword = loginRequest.getPassword();

        // 1. Look up student from HostelUserRepository (by rollNumber Long or id String)
        HostelUser hostelUser = findHostelUser(identifier)
                .orElseThrow(() -> {
                    logger.warn("Student login failed: user not found in hostel users table with identifier '{}'", identifier);
                    return new InvalidCredentialsException("Invalid credentials. Please verify your Register Number / Roll Number and Password.");
                });

        // 2. Verify BCrypt password against hostelUser.password
        if (hostelUser.getPassword() == null || !passwordEncoder.matches(rawPassword, hostelUser.getPassword())) {
            logger.warn("Student login failed: password mismatch for identifier '{}'", identifier);
            throw new InvalidCredentialsException("Invalid credentials. Please verify your Register Number / Roll Number and Password.");
        }

        // 3. Resolve registerNo and rollNo
        String regNo = hostelUser.getRollNumber() != null ? String.valueOf(hostelUser.getRollNumber()) : hostelUser.getId();
        String rollNo = hostelUser.getId() != null ? hostelUser.getId() : regNo;

        // 4. Check if student exists in mr_student_details
        Optional<StudentDetails> existingStudentOpt = studentDetailsRepo.findByRegisterNo(regNo)
                .or(() -> studentDetailsRepo.findByRollNo(rollNo))
                .or(() -> studentDetailsRepo.findByRollNo(regNo))
                .or(() -> studentDetailsRepo.findByRegisterNo(rollNo));

        StudentDetails student;
        boolean onboardingRequired;

        if (existingStudentOpt.isPresent()) {
            student = existingStudentOpt.get();
            if (student.getDob() != null && student.getPhoneNo() != null && !student.getPhoneNo().trim().isEmpty()) {
                onboardingRequired = false;
            } else {
                onboardingRequired = true;
            }
        } else {
            // Upsert / populate initial record from HostelUser and HostelStudent
            onboardingRequired = true;
            student = new StudentDetails();
            student.setName(hostelUser.getName() != null ? hostelUser.getName() : "Student");
            student.setRegisterNo(regNo);
            student.setRollNo(rollNo);
            student.setEmailId(hostelUser.getEmail() != null ? hostelUser.getEmail() : regNo + "@hostel.local");

            // Look up corresponding student details from HostelStudent
            Optional<HostelStudent> hostelStudentOpt = hostelStudentRepository.findByUserId(hostelUser.getId())
                    .or(() -> hostelStudentRepository.findById(hostelUser.getId()));

            if (hostelStudentOpt.isPresent()) {
                HostelStudent hs = hostelStudentOpt.get();
                student.setDepartment(hs.getDept() != null ? hs.getDept() : "GENERAL");
                student.setCurrentYear(hs.getYear());
                if (hs.getGender() != null) {
                    try {
                        student.setGender(Gender.valueOf(hs.getGender().toUpperCase()));
                    } catch (Exception e) {
                        logger.debug("Could not map gender '{}' directly to enum", hs.getGender());
                    }
                }
            } else {
                student.setDepartment("GENERAL");
            }

            student = studentDetailsRepo.save(student);
        }

        // Generate JWT token using student's register number as the subject
        String token = jwtUtil.generateToken(student.getRegisterNo(), student.getStudentId());

        AuthResponseDTO response = new AuthResponseDTO();
        response.setToken(token);
        response.setStudentId(student.getStudentId());
        response.setName(student.getName());
        response.setRegisterNo(student.getRegisterNo());
        response.setRollNo(student.getRollNo());
        response.setOnboardingRequired(onboardingRequired);

        return response;
    }

    private Optional<HostelUser> findHostelUser(String identifier) {
        // Try parsing identifier as Long (register_number)
        try {
            Long rollNumber = Long.parseLong(identifier);
            Optional<HostelUser> userByRoll = hostelUserRepository.findByRollNumber(rollNumber);
            if (userByRoll.isPresent()) {
                return userByRoll;
            }
        } catch (NumberFormatException ignored) {
            // Not a numeric Long
        }

        // Try lookup by user ID (e.g. roll number string like 21CS001)
        Optional<HostelUser> userById = hostelUserRepository.findById(identifier);
        if (userById.isPresent()) {
            return userById;
        }

        // Try lookup by email if identifier contains '@'
        if (identifier.contains("@")) {
            return hostelUserRepository.findByEmail(identifier);
        }

        return Optional.empty();
    }

    @Transactional
    public void completeProfile(Long studentId, String username, CompleteProfileReqDTO req) {
        StudentDetails student = null;
        if (studentId != null) {
            student = studentDetailsRepo.findById(studentId).orElse(null);
        }
        if (student == null && username != null) {
            student = studentDetailsRepo.findByRegisterNo(username)
                    .or(() -> studentDetailsRepo.findByRollNo(username))
                    .orElse(null);
        }

        if (student == null) {
            throw new InvalidCredentialsException("Student record not found. Please log in again.");
        }

        student.setDob(req.getDob());
        student.setPhoneNo(req.getPhoneNo().trim());
        studentDetailsRepo.save(student);
        logger.info("Student profile completed for registerNo: {}, studentId: {}", student.getRegisterNo(), student.getStudentId());
    }
}
