package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.DTO.ReqDTO.StaffUsersReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StaffLoginResDTO;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import com.hostel.MessReduction.security.StaffJwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StaffAuthService {

    private final StaffUsersRepo staffUsersRepo;
    private final AuthenticationManager authenticationManager;
    private final StaffJwtUtil staffJwtUtil;

    public StaffLoginResDTO login(StaffUsersReqDTO loginReqDTO) {

        // 1. Authenticate credentials via Spring Security
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginReqDTO.getUserName(),
                        loginReqDTO.getPassword()
                )
        );

        // 2. Ensure authentication succeeded
        if (!authentication.isAuthenticated()) {
            throw new RuntimeException("Invalid username or password");
        }

        // 3. Fetch user from DB
        StaffUsers staff = staffUsersRepo.findByUserName(loginReqDTO.getUserName())
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        // 4. Generate JWT token
        String token = staffJwtUtil.generateToken(staff.getUserName(), staff.getRole());

        // 5. Return response
        return new StaffLoginResDTO(
                token,
                staff.getUserName(),
                staff.getRole()
        );
    }
}