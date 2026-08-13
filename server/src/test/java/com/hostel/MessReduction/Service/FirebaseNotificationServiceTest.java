package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Config.FirebaseConfig;
import com.hostel.MessReduction.Entity.FcmToken;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Repo.FcmTokenRepository;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FirebaseNotificationServiceTest {

    @Mock
    private FirebaseConfig firebaseConfig;

    @Mock
    private FcmTokenRepository fcmTokenRepository;

    @Mock
    private StudentDetailsRepo studentDetailsRepo;

    @InjectMocks
    private FirebaseNotificationService firebaseNotificationService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testSendNotificationToUser_FirebaseNotInitialized_SkipsSilently() throws InterruptedException {
        // Arrange
        when(firebaseConfig.isInitialized()).thenReturn(false);

        // Act
        firebaseNotificationService.sendNotificationToUser("deputy01", "Title", "Body", Map.of("key", "val"));
        Thread.sleep(100);

        // Assert
        verify(fcmTokenRepository, never()).findByUsernameInAndActiveTrue(anyList());
    }

    @Test
    void testSendNotificationToUser_NoTokensFound() throws InterruptedException {
        // Arrange
        when(firebaseConfig.isInitialized()).thenReturn(true);
        when(fcmTokenRepository.findByUsernameInAndActiveTrue(anyList())).thenReturn(Collections.emptyList());

        // Act
        firebaseNotificationService.sendNotificationToUser("deputy01", "Title", "Body", Map.of("url", "/deputy"));
        Thread.sleep(200);

        // Assert
        verify(fcmTokenRepository, times(1)).findByUsernameInAndActiveTrue(anyList());
    }

    @Test
    void testSendNotificationToUser_WithEmailResolution() throws InterruptedException {
        // Arrange
        String email = "student@example.com";
        StudentDetails student = new StudentDetails();
        student.setRegisterNo("7100123");
        student.setRollNo("20CS01");

        when(firebaseConfig.isInitialized()).thenReturn(true);
        when(studentDetailsRepo.findByEmailId(email)).thenReturn(student);
        when(fcmTokenRepository.findByUsernameInAndActiveTrue(anyList())).thenReturn(Collections.emptyList());

        // Act
        firebaseNotificationService.sendNotificationToUser(email, "Approved", "Request Approved", Map.of("url", "/student-dashboard"));
        Thread.sleep(200);

        // Assert
        verify(studentDetailsRepo, times(1)).findByEmailId(email);
        verify(fcmTokenRepository, times(1)).findByUsernameInAndActiveTrue(argThat(list -> 
            list.contains(email) && list.contains("7100123") && list.contains("20CS01")
        ));
    }

    @Test
    void testDeactivateInvalidToken() {
        // Arrange
        String badToken = "invalid_fcm_token_123";

        // Act
        firebaseNotificationService.deactivateInvalidToken(badToken);

        // Assert
        verify(fcmTokenRepository, times(1)).deactivateToken(badToken);
    }
}
