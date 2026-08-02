package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.BadRequestException;
import com.hostel.MessReduction.CustomException.InvalidCredentialsException;
import com.hostel.MessReduction.DTO.ReqDTO.StaffUsersReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StaffLoginResDTO;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import com.hostel.MessReduction.security.StaffJwtUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StaffAuthService {
    private static final Logger logger = LoggerFactory.getLogger(StaffAuthService.class);

    private final StaffUsersRepo staffUsersRepo;
    private final AuthenticationManager authenticationManager;
    private final StaffJwtUtil staffJwtUtil;
    private final PasswordEncoder passwordEncoder;

    public StaffLoginResDTO login(StaffUsersReqDTO loginReqDTO) {
        if (loginReqDTO == null || loginReqDTO.getUserName() == null || loginReqDTO.getPassword() == null) {
            logger.warn("Invalid login attempt: missing required login payload or credentials");
            throw new InvalidCredentialsException("Invalid username or password.");
        }

        String username = loginReqDTO.getUserName().trim();

        // 1. Fetch user from DB and verify username exists
        StaffUsers staff = staffUsersRepo.findByUserName(username)
                .orElseThrow(() -> {
                    logger.warn("Invalid login attempt for username: {}", username);
                    return new InvalidCredentialsException("Invalid username or password.");
                });

        // 2. Verify password matches
        if (!passwordEncoder.matches(loginReqDTO.getPassword(), staff.getPassword())) {
            logger.warn("Invalid login attempt for username: {}", username);
            throw new InvalidCredentialsException("Invalid username or password.");
        }

        // 3. Verify the selected role matches the role stored in the database
        if (loginReqDTO.getRole() == null || !staff.getRole().name().equals(loginReqDTO.getRole().name())) {
            logger.warn("Invalid login attempt for username: {} - role mismatch", username);
            throw new InvalidCredentialsException("Selected role does not match this account.");
        }

        // 4. Authenticate credentials via Spring Security
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            username,
                            loginReqDTO.getPassword()
                    )
            );

            if (!authentication.isAuthenticated()) {
                logger.warn("Invalid login attempt for username: {}", username);
                throw new InvalidCredentialsException("Invalid username or password.");
            }
        } catch (AuthenticationException e) {
            logger.warn("Invalid login attempt for username: {}", username);
            throw new InvalidCredentialsException("Invalid username or password.");
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