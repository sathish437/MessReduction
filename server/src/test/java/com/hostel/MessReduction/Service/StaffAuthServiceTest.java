package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.InvalidCredentialsException;
import com.hostel.MessReduction.DTO.ReqDTO.StaffUsersReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StaffLoginResDTO;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import com.hostel.MessReduction.security.StaffJwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StaffAuthServiceTest {

    @Mock
    private StaffUsersRepo staffUsersRepo;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private StaffJwtUtil staffJwtUtil;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private StaffAuthService staffAuthService;

    private StaffUsersReqDTO reqDto;
    private StaffUsers staffUser;

    @BeforeEach
    void setUp() {
        reqDto = new StaffUsersReqDTO();
        reqDto.setUserName("warden");
        reqDto.setPassword("password123");
        reqDto.setRole(Role.Warden);

        staffUser = new StaffUsers();
        staffUser.setUserName("warden");
        staffUser.setPassword("encodedPassword123");
        staffUser.setRole(Role.Warden);
    }

    @Test
    void testLogin_Success() {
        // Arrange
        when(staffUsersRepo.findByUserName("warden")).thenReturn(Optional.of(staffUser));
        when(passwordEncoder.matches("password123", "encodedPassword123")).thenReturn(true);

        Authentication authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);

        when(staffJwtUtil.generateToken("warden", Role.Warden)).thenReturn("mock-jwt-token");

        // Act
        StaffLoginResDTO result = staffAuthService.login(reqDto);

        // Assert
        assertNotNull(result);
        assertEquals("mock-jwt-token", result.getToken());
        assertEquals("warden", result.getUsername());
        assertEquals(Role.Warden, result.getRole());

        verify(staffUsersRepo, times(1)).findByUserName("warden");
        verify(passwordEncoder, times(1)).matches("password123", "encodedPassword123");
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(staffJwtUtil, times(1)).generateToken("warden", Role.Warden);
    }

    @Test
    void testLogin_InvalidUsername() {
        // Arrange
        when(staffUsersRepo.findByUserName("warden")).thenReturn(Optional.empty());

        // Act & Assert
        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> staffAuthService.login(reqDto)
        );

        assertEquals("Invalid username or password.", exception.getMessage());
        verify(staffUsersRepo, times(1)).findByUserName("warden");
        verifyNoInteractions(passwordEncoder, authenticationManager, staffJwtUtil);
    }

    @Test
    void testLogin_InvalidPassword() {
        // Arrange
        when(staffUsersRepo.findByUserName("warden")).thenReturn(Optional.of(staffUser));
        when(passwordEncoder.matches("password123", "encodedPassword123")).thenReturn(false);

        // Act & Assert
        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> staffAuthService.login(reqDto)
        );

        assertEquals("Invalid username or password.", exception.getMessage());
        verify(staffUsersRepo, times(1)).findByUserName("warden");
        verify(passwordEncoder, times(1)).matches("password123", "encodedPassword123");
        verifyNoInteractions(authenticationManager, staffJwtUtil);
    }

    @Test
    void testLogin_RoleMismatch() {
        // Arrange
        reqDto.setRole(Role.Office); // Select Office but user has Warden role in DB

        when(staffUsersRepo.findByUserName("warden")).thenReturn(Optional.of(staffUser));
        when(passwordEncoder.matches("password123", "encodedPassword123")).thenReturn(true);

        // Act & Assert
        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> staffAuthService.login(reqDto)
        );

        assertEquals("Selected role does not match this account.", exception.getMessage());
        verify(staffUsersRepo, times(1)).findByUserName("warden");
        verify(passwordEncoder, times(1)).matches("password123", "encodedPassword123");
        verifyNoInteractions(authenticationManager, staffJwtUtil);
    }

    @Test
    void testLogin_AuthenticationException() {
        // Arrange
        when(staffUsersRepo.findByUserName("warden")).thenReturn(Optional.of(staffUser));
        when(passwordEncoder.matches("password123", "encodedPassword123")).thenReturn(true);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new AuthenticationException("Bad credentials") {});

        // Act & Assert
        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> staffAuthService.login(reqDto)
        );

        assertEquals("Invalid username or password.", exception.getMessage());
        verify(staffUsersRepo, times(1)).findByUserName("warden");
        verify(passwordEncoder, times(1)).matches("password123", "encodedPassword123");
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verifyNoInteractions(staffJwtUtil);
    }
}
