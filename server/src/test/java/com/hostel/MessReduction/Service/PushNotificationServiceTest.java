package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.PushSubscription;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Repo.PushSubscriptionRepository;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PushNotificationServiceTest {

    @Mock
    private PushSubscriptionRepository pushSubscriptionRepository;

    @Mock
    private StudentDetailsRepo studentDetailsRepo;

    @InjectMocks
    private PushNotificationService pushNotificationService;

    @BeforeEach
    void setUp() {
        // Set mocked value properties for test
        ReflectionTestUtils.setField(pushNotificationService, "publicKey", "BPejw3UgSdG7KbS1f25tJX4GBOelpocpuEzEXoO86xHFfXPsUeJDkCtaigahspBtTbt6c107BFJlcmImfY1sZhg");
        ReflectionTestUtils.setField(pushNotificationService, "privateKey", "bpJq_LDP9W0lchR0jZyLqEIi1gh_Ib63H00nhCH88tw");
        ReflectionTestUtils.setField(pushNotificationService, "subject", "mailto:admin@example.com");
        pushNotificationService.init();
    }

    @Test
    void testSendPushNotification_NoSubscriptions() throws InterruptedException {
        // Arrange
        String username = "deputy01";
        when(pushSubscriptionRepository.findByUsername(username)).thenReturn(Optional.empty());

        // Act
        pushNotificationService.sendPushNotification(username, "Test Title", "Test Message");
        Thread.sleep(200);

        // Assert
        verify(pushSubscriptionRepository, times(1)).findByUsername(username);
    }

    @Test
    void testSendPushNotification_WithEmailResolution() throws InterruptedException {
        // Arrange
        String email = "student@example.com";
        StudentDetails student = new StudentDetails();
        student.setRegisterNo("REG001");
        student.setRollNo("ROLL001");
        
        when(studentDetailsRepo.findByEmailId(email)).thenReturn(student);
        when(pushSubscriptionRepository.findByUsername(email)).thenReturn(Optional.empty());
        when(pushSubscriptionRepository.findByUsername("REG001")).thenReturn(Optional.empty());
        when(pushSubscriptionRepository.findByUsername("ROLL001")).thenReturn(Optional.empty());

        // Act
        pushNotificationService.sendPushNotification(email, "Approved", "Approved by Warden");
        Thread.sleep(200);

        // Assert
        verify(studentDetailsRepo, times(1)).findByEmailId(email);
        verify(pushSubscriptionRepository, times(1)).findByUsername(email);
        verify(pushSubscriptionRepository, times(1)).findByUsername("REG001");
        verify(pushSubscriptionRepository, times(1)).findByUsername("ROLL001");
    }
}
