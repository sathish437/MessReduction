package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.InvalidCredentialsException;
import com.hostel.MessReduction.DTO.ReqDTO.CompleteProfileReqDTO;
import com.hostel.MessReduction.DTO.ReqDTO.HostelVerifyReqDTO;
import com.hostel.MessReduction.DTO.ReqDTO.StudentLoginReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.AuthResponseDTO;
import com.hostel.MessReduction.DTO.ResDTO.HostelVerifyResDTO;
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
    private final StudentVerificationService studentVerificationService;
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

        // 1. Look up student from HostelUserRepository (when sharing hosteldb)
        Optional<HostelUser> hostelUserOpt = findHostelUser(identifier);
        if (hostelUserOpt.isPresent()) {
            HostelUser hostelUser = hostelUserOpt.get();

            // Verify account is enabled and is a student account
            if (Boolean.FALSE.equals(hostelUser.getIsEnabled())) {
                logger.warn("Student login failed: account disabled for identifier '{}'", identifier);
                throw new InvalidCredentialsException("Your hostel account is currently disabled. Please contact the hostel office.");
            }
            if (hostelUser.getRole() != null && !"STUDENT".equalsIgnoreCase(hostelUser.getRole().trim())) {
                logger.warn("Student login failed: non-student role '{}' for identifier '{}'", hostelUser.getRole(), identifier);
                throw new InvalidCredentialsException("Only student accounts can sign in here.");
            }

            // Verify BCrypt password against hostelUser.password
            if (hostelUser.getPassword() == null || !passwordEncoder.matches(rawPassword, hostelUser.getPassword())) {
                logger.warn("Student login failed: password mismatch for identifier '{}'", identifier);
                throw new InvalidCredentialsException("Invalid credentials. Please verify your Register Number / Roll Number and Password.");
            }

            return issueAuthResponseForHostelUser(hostelUser);
        }

        // 2. Fallback: verify credentials via HostelApp API (/api/auth/verify-details) when using separate DBs
        HostelVerifyResDTO verifyRes;
        try {
            verifyRes = studentVerificationService.verifyHostelCredentials(
                    new HostelVerifyReqDTO(identifier, rawPassword)
            );
        } catch (Exception e) {
            logger.error("Hostel API verification failed for identifier '{}': {}", identifier, e.getMessage());
            throw new InvalidCredentialsException("Unable to verify hostel credentials right now. Please try again.");
        }

        if (verifyRes == null || !verifyRes.isVerified()) {
            logger.warn("Student login failed: Hostel API rejected credentials for identifier '{}'", identifier);
            throw new InvalidCredentialsException("Invalid credentials. Please verify your Register Number / Roll Number and Password.");
        }

        return issueAuthResponseForVerifiedStudent(identifier, verifyRes);
    }

    /**
     * Authenticates a student via verified HostelApp SSO without checking password.
     */
    @Transactional
    public AuthResponseDTO loginBySsoIdentifier(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) {
            throw new InvalidCredentialsException("Invalid SSO identifier.");
        }

        String trimmed = identifier.trim();
        Optional<HostelUser> hostelUserOpt = findHostelUser(trimmed);
        if (hostelUserOpt.isPresent()) {
            HostelUser hostelUser = hostelUserOpt.get();
            if (Boolean.FALSE.equals(hostelUser.getIsEnabled())) {
                logger.warn("Student SSO failed: account disabled for identifier '{}'", trimmed);
                throw new InvalidCredentialsException("Your hostel account is currently disabled. Please contact the hostel office.");
            }
            if (hostelUser.getRole() != null && !"STUDENT".equalsIgnoreCase(hostelUser.getRole().trim())) {
                logger.warn("Student SSO failed: non-student role '{}' for identifier '{}'", hostelUser.getRole(), trimmed);
                throw new InvalidCredentialsException("Only student accounts can sign in here.");
            }
            return issueAuthResponseForHostelUser(hostelUser);
        }

        // Separate DB mode: HostelSsoService already verified the HMAC-SHA256 signature from GCESHostel
        return issueAuthResponseForVerifiedStudent(trimmed, null);
    }

    private AuthResponseDTO issueAuthResponseForVerifiedStudent(String identifier, HostelVerifyResDTO verifyRes) {
        String regNo = (verifyRes != null && verifyRes.getRegisterNo() != null && !verifyRes.getRegisterNo().isBlank())
                ? verifyRes.getRegisterNo().trim()
                : identifier;
        String rollNo = (verifyRes != null && verifyRes.getRollNo() != null && !verifyRes.getRollNo().isBlank())
                ? verifyRes.getRollNo().trim()
                : regNo;

        Optional<StudentDetails> existingStudentOpt = studentDetailsRepo.findByRegisterNo(regNo)
                .or(() -> studentDetailsRepo.findByRollNo(rollNo))
                .or(() -> studentDetailsRepo.findByRollNo(regNo))
                .or(() -> studentDetailsRepo.findByRegisterNo(rollNo))
                .or(() -> studentDetailsRepo.findByRegisterNo(identifier))
                .or(() -> studentDetailsRepo.findByRollNo(identifier));

        StudentDetails student;
        boolean onboardingRequired;

        if (existingStudentOpt.isPresent()) {
            student = existingStudentOpt.get();
            onboardingRequired = student.getDob() == null
                    || student.getPhoneNo() == null
                    || student.getPhoneNo().trim().isEmpty();
        } else {
            onboardingRequired = true;
            student = new StudentDetails();
            student.setName((verifyRes != null && verifyRes.getName() != null && !verifyRes.getName().isBlank())
                    ? verifyRes.getName().trim()
                    : "Student");
            student.setRegisterNo(regNo);
            student.setRollNo(rollNo);
            student.setEmailId(regNo + "@hostel.local");
            student.setDepartment((verifyRes != null && verifyRes.getDepartment() != null && !verifyRes.getDepartment().isBlank())
                    ? verifyRes.getDepartment().trim()
                    : "GENERAL");
            if (verifyRes != null && verifyRes.getGender() != null) {
                try {
                    student.setGender(Gender.valueOf(verifyRes.getGender().trim().toUpperCase()));
                } catch (Exception ignored) {
                }
            }
            student = studentDetailsRepo.save(student);
        }

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

    private AuthResponseDTO issueAuthResponseForHostelUser(HostelUser hostelUser) {
        // Resolve registerNo and rollNo
        String regNo = hostelUser.getRollNumber() != null ? String.valueOf(hostelUser.getRollNumber()) : hostelUser.getId();
        String rollNo = hostelUser.getId() != null ? hostelUser.getId() : regNo;

        // Check if student exists in mr_student_details
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
            student.setEmailId((hostelUser.getEmail() != null && !hostelUser.getEmail().trim().isEmpty())
                    ? hostelUser.getEmail().trim()
                    : regNo + "@hostel.local");

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

        // Try lookup by user ID (e.g. roll number string like 21CS001, case-insensitive)
        Optional<HostelUser> userById = hostelUserRepository.findById(identifier)
                .or(() -> hostelUserRepository.findByIdIgnoreCase(identifier));
        if (userById.isPresent()) {
            return userById;
        }

        // Try lookup by email if identifier contains '@'
        if (identifier.contains("@")) {
            return hostelUserRepository.findByEmail(identifier)
                    .or(() -> hostelUserRepository.findByEmailIgnoreCase(identifier));
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
