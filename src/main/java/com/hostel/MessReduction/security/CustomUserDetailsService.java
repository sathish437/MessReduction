package com.hostel.MessReduction.security;

import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final StudentDetailsRepo studentDetailsRepo;

    @Override
    public UserDetails loadUserByUsername(String emailId) throws UsernameNotFoundException {
        StudentDetails student = studentDetailsRepo.findByEmailId(emailId);
        if (student == null) {
            throw new UsernameNotFoundException("Student not found with email: " + emailId);
        }
        return new CustomUserDetails(student);
    }
}
