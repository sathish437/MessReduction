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
    public UserDetails loadUserByUsername(String emailId) throws UsernameNotFoundException {
        logger.debug("Loading student user details for emailId: {}", emailId);
        StudentDetails student = studentDetailsRepo.findByEmailId(emailId);
        if (student == null) {
            logger.error("Student not found with email: {}", emailId);
            throw new UsernameNotFoundException("Student not found with email: " + emailId);
        }
        logger.debug("Student found: studentId={}, name={}, emailId={}", 
            student.getStudentId(), student.getName(), student.getEmailId());
        CustomUserDetails userDetails = new CustomUserDetails(student);
        logger.debug("CustomUserDetails created with authorities: {}", userDetails.getAuthorities());
        return userDetails;
    }
}
