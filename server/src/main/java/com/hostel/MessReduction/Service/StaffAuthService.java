package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.BadRequestException;
import com.hostel.MessReduction.DTO.ReqDTO.StaffUsersReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StaffLoginResDTO;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import com.hostel.MessReduction.security.StaffJwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StaffAuthService {

    private final StaffUsersRepo staffUsersRepo;
    private final AuthenticationManager authenticationManager;
    private final StaffJwtUtil staffJwtUtil;
    private final PasswordEncoder passwordEncoder;

    public StaffLoginResDTO login(StaffUsersReqDTO loginReqDTO) {

        // 1. Fetch user from DB and verify username exists
        StaffUsers staff = staffUsersRepo.findByUserName(loginReqDTO.getUserName())
                .orElseThrow(() -> new BadRequestException("Invalid username or password."));

        // 2. Verify password matches
        if (!passwordEncoder.matches(loginReqDTO.getPassword(), staff.getPassword())) {
            throw new BadRequestException("Invalid username or password.");
        }

        // 3. Verify the selected role matches the role stored in the database
        if (loginReqDTO.getRole() == null || !staff.getRole().name().equals(loginReqDTO.getRole().name())) {
            throw new BadRequestException("Selected role does not match this account.");
        }

        // 4. Authenticate credentials via Spring Security
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginReqDTO.getUserName(),
                            loginReqDTO.getPassword()
                    )
            );

            if (!authentication.isAuthenticated()) {
                throw new BadRequestException("Invalid username or password.");
            }
        } catch (AuthenticationException e) {
            throw new BadRequestException("Invalid username or password.");
        }

        // 5. Generate JWT token
        String token = staffJwtUtil.generateToken(staff.getUserName(), staff.getRole());

        // 6. Return response
        return new StaffLoginResDTO(
                token,
                staff.getUserName(),
                staff.getRole()
        );
    }
}