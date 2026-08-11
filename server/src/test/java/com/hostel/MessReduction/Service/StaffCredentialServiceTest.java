package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.BadRequestException;
import com.hostel.MessReduction.DTO.ReqDTO.UpdateStaffCredentialReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StaffCredentialResponseDTO;
import com.hostel.MessReduction.Entity.AuditLog;
import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.Gender;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Repo.ActivityLogRepository;
import com.hostel.MessReduction.Repo.AuditLogRepo;
import com.hostel.MessReduction.Repo.AutoAcceptSettingsRepo;
import com.hostel.MessReduction.Repo.ReductionFormHistoryRepo;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import com.hostel.MessReduction.Repo.SystemSettingsRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StaffCredentialServiceTest {

    @Mock
    private StaffUsersRepo staffUsersRepo;

    @Mock
    private ReductionFormRepo reductionFormRepo;

    @Mock
    private AuditLogRepo auditLogRepo;

    @Mock
    private AutoAcceptSettingsRepo autoAcceptSettingsRepo;

    @Mock
    private StudentDetailsRepo studentDetailsRepo;

    @Mock
    private ReductionFormHistoryRepo reductionFormHistoryRepo;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private SystemSettingsRepo systemSettingsRepo;

    @Mock
    private DepartmentService departmentService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private com.hostel.MessReduction.security.StaffJwtUtil staffJwtUtil;

    @InjectMocks
    private AdminService adminService;

    private StaffUsers warden;
    private StaffUsers deputy;
    private StaffUsers office;

    @BeforeEach
    void setUp() {
        warden = new StaffUsers();
        warden.setUserId(1L);
        warden.setUserName("warden");
        warden.setPassword("$2a$10$encodedWardenPass");
        warden.setRole(Role.Warden);
        warden.setGmail("warden@gmail.com");
        warden.setPhoneNo("+917708988616");

        deputy = new StaffUsers();
        deputy.setUserId(2L);
        deputy.setUserName("deputyWarden1");
        deputy.setPassword("$2a$10$encodedDeputyPass");
        deputy.setRole(Role.DeputyWarden);
        deputy.setGender(Gender.MALE);
        deputy.setYear(1);
        deputy.setGmail("deputy1@gmail.com");

        office = new StaffUsers();
        office.setUserId(3L);
        office.setUserName("office");
        office.setPassword("$2a$10$encodedOfficePass");
        office.setRole(Role.Office);
        office.setGmail("office@gmail.com");
    }

    @Test
    void testGetStaffCredentials_Success() {
        // Arrange
        when(staffUsersRepo.findAll()).thenReturn(List.of(office, deputy, warden));

        // Act
        List<StaffCredentialResponseDTO> result = adminService.getStaffCredentials();

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
        // Ordered: Warden -> DeputyWarden -> Office
        assertEquals(Role.Warden, result.get(0).getRole());
        assertEquals("warden", result.get(0).getUsername());
        assertEquals(Role.DeputyWarden, result.get(1).getRole());
        assertEquals("deputyWarden1", result.get(1).getUsername());
        assertEquals(Role.Office, result.get(2).getRole());
        assertEquals("office", result.get(2).getUsername());

        verify(staffUsersRepo, times(1)).findAll();
    }

    @Test
    void testUpdateStaffCredential_UsernameOnly_Success() {
        // Arrange
        when(staffUsersRepo.findById(1L)).thenReturn(Optional.of(warden));
        when(staffUsersRepo.findByUserName("newWarden")).thenReturn(Optional.empty());

        UpdateStaffCredentialReqDTO req = new UpdateStaffCredentialReqDTO("newWarden", null);

        // Act
        Map<String, Object> response = adminService.updateStaffCredential(1L, req);

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals("Staff credentials updated successfully", response.get("message"));
        assertEquals("newWarden", warden.getUserName());
        assertEquals("$2a$10$encodedWardenPass", warden.getPassword()); // Password unchanged

        verify(staffUsersRepo, times(1)).save(warden);
        verify(passwordEncoder, never()).encode(anyString());

        // Verify audit log captured without plaintext passwords
        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepo, times(1)).save(auditCaptor.capture());
        AuditLog savedLog = auditCaptor.getValue();
        assertEquals("STAFF_CREDENTIAL_UPDATE", savedLog.getEventType());
        assertTrue(savedLog.getMessage().contains("warden -> newWarden"));
        assertTrue(savedLog.getMessage().contains("Password: Unchanged"));
    }

    @Test
    void testUpdateStaffCredential_PasswordOnly_Success() {
        // Arrange
        when(staffUsersRepo.findById(1L)).thenReturn(Optional.of(warden));
        when(passwordEncoder.encode("newPassword123")).thenReturn("$2a$10$newEncodedHash");

        UpdateStaffCredentialReqDTO req = new UpdateStaffCredentialReqDTO("warden", "newPassword123");

        // Act
        Map<String, Object> response = adminService.updateStaffCredential(1L, req);

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals("$2a$10$newEncodedHash", warden.getPassword());
        assertEquals("warden", warden.getUserName()); // Username unchanged

        verify(staffUsersRepo, times(1)).save(warden);
        verify(passwordEncoder, times(1)).encode("newPassword123");

        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepo, times(1)).save(auditCaptor.capture());
        AuditLog savedLog = auditCaptor.getValue();
        assertTrue(savedLog.getMessage().contains("Username: Unchanged"));
        assertTrue(savedLog.getMessage().contains("Password: Changed"));
        assertFalse(savedLog.getMessage().contains("newPassword123")); // Plaintext password must never be in audit log
    }

    @Test
    void testUpdateStaffCredential_BothUsernameAndPassword_Success() {
        // Arrange
        when(staffUsersRepo.findById(2L)).thenReturn(Optional.of(deputy));
        when(staffUsersRepo.findByUserName("newDeputy1")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("newDeputyPass123")).thenReturn("$2a$10$newDeputyEncodedHash");
        when(reductionFormRepo.findByCurrentStatusAndAssignedDeputyWarden(FormStatus.PendingDeputyWarden, "deputyWarden1"))
                .thenReturn(Collections.emptyList());
        when(autoAcceptSettingsRepo.findByUsername("deputyWarden1")).thenReturn(Optional.empty());

        UpdateStaffCredentialReqDTO req = new UpdateStaffCredentialReqDTO("newDeputy1", "newDeputyPass123");

        // Act
        Map<String, Object> response = adminService.updateStaffCredential(2L, req);

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals("newDeputy1", deputy.getUserName());
        assertEquals("$2a$10$newDeputyEncodedHash", deputy.getPassword());

        verify(staffUsersRepo, times(1)).save(deputy);
        verify(passwordEncoder, times(1)).encode("newDeputyPass123");
        verify(auditLogRepo, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testUpdateStaffCredential_ContactDetails_Success() {
        // Arrange
        when(staffUsersRepo.findById(1L)).thenReturn(Optional.of(warden));

        UpdateStaffCredentialReqDTO req = new UpdateStaffCredentialReqDTO(
                "warden",
                null,
                "newwarden@gmail.com",
                "+919999888877"
        );

        // Act
        Map<String, Object> response = adminService.updateStaffCredential(1L, req);

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals("newwarden@gmail.com", warden.getGmail());
        assertEquals("+919999888877", warden.getPhoneNo());

        verify(staffUsersRepo, times(1)).save(warden);

        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepo, times(1)).save(auditCaptor.capture());
        AuditLog savedLog = auditCaptor.getValue();
        assertTrue(savedLog.getMessage().contains("Contact details: Updated"));
    }

    @Test
    void testUpdateStaffCredential_DuplicateUsername_ThrowsBadRequestException() {
        // Arrange
        StaffUsers anotherUser = new StaffUsers();
        anotherUser.setUserId(99L);
        anotherUser.setUserName("existingUsername");

        when(staffUsersRepo.findById(1L)).thenReturn(Optional.of(warden));
        when(staffUsersRepo.findByUserName("existingUsername")).thenReturn(Optional.of(anotherUser));

        UpdateStaffCredentialReqDTO req = new UpdateStaffCredentialReqDTO("existingUsername", null);

        // Act & Assert
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> adminService.updateStaffCredential(1L, req)
        );

        assertEquals("Username already exists.", exception.getMessage());
        verify(staffUsersRepo, never()).save(any(StaffUsers.class));
        verify(auditLogRepo, never()).save(any(AuditLog.class));
    }

    @Test
    void testUpdateStaffCredential_UserNotFound_ThrowsBadRequestException() {
        // Arrange
        when(staffUsersRepo.findById(999L)).thenReturn(Optional.empty());

        UpdateStaffCredentialReqDTO req = new UpdateStaffCredentialReqDTO("someName", null);

        // Act & Assert
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> adminService.updateStaffCredential(999L, req)
        );

        assertEquals("Staff user not found with ID: 999", exception.getMessage());
        verify(staffUsersRepo, never()).save(any(StaffUsers.class));
    }

    @Test
    void testUpdateStaffCredential_EmptyUsername_ThrowsBadRequestException() {
        // Arrange
        when(staffUsersRepo.findById(1L)).thenReturn(Optional.of(warden));

        UpdateStaffCredentialReqDTO req = new UpdateStaffCredentialReqDTO("   ", null);

        // Act & Assert
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> adminService.updateStaffCredential(1L, req)
        );

        assertEquals("Username cannot be empty", exception.getMessage());
        verify(staffUsersRepo, never()).save(any(StaffUsers.class));
    }

    @Test
    void testUpdateStaffCredential_AdminAccount_Success() {
        // Arrange
        StaffUsers adminUser = new StaffUsers();
        adminUser.setUserId(99L);
        adminUser.setUserName("MasterAdmin");
        adminUser.setRole(Role.ADMIN);
        adminUser.setPassword("$2a$10$oldAdminHash");

        when(staffUsersRepo.findById(99L)).thenReturn(Optional.of(adminUser));
        when(staffUsersRepo.findByUserName("MasterAdminUpdated")).thenReturn(Optional.empty());

        UpdateStaffCredentialReqDTO req = new UpdateStaffCredentialReqDTO("MasterAdminUpdated", null);

        // Act
        Map<String, Object> response = adminService.updateStaffCredential(99L, req);

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals("MasterAdminUpdated", adminUser.getUserName());
        verify(staffUsersRepo, times(1)).save(adminUser);
    }
}
