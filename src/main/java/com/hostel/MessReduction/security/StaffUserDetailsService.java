package com.hostel.MessReduction.security;

import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@Primary
@RequiredArgsConstructor
public class StaffUserDetailsService implements UserDetailsService {

    private final StaffUsersRepo staffUsersRepo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        StaffUsers staff = staffUsersRepo.findByUserName(username)
                .orElseThrow(() -> new UsernameNotFoundException("Staff not found with username: " + username));
        return new StaffUserDetails(staff);
    }
}
