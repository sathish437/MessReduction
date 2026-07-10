package com.hostel.MessReduction.security;

import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

@Component("studentUserDetailsService")
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(CustomUserDetailsService.class);
    private final StudentDetailsRepo studentDetailsRepo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        logger.debug("Loading student user details for identifier: {}", username);
        StudentDetails student = studentDetailsRepo.findByRegisterNo(username)
                .or(() -> studentDetailsRepo.findByRollNo(username))
                .orElseThrow(() -> {
                    logger.error("Student not found with identifier: {}", username);
                    return new UsernameNotFoundException("Student not found with identifier: " + username);
                });
        logger.debug("Student found: studentId={}, name={}, registerNo={}, rollNo={}", 
            student.getStudentId(), student.getName(), student.getRegisterNo(), student.getRollNo());
        CustomUserDetails userDetails = new CustomUserDetails(student);
        logger.debug("CustomUserDetails created with authorities: {}", userDetails.getAuthorities());
        return userDetails;
    }
}
