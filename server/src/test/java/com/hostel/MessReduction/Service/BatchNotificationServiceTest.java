package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.QueuedNotification;
import com.hostel.MessReduction.Repo.QueuedNotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BatchNotificationServiceTest {

    @Mock
    private QueuedNotificationRepository queuedRepo;

    @Mock
    private PushNotificationService pushNotificationService;

    @Mock
    private FirebaseNotificationService firebaseNotificationService;

    @InjectMocks
    private BatchNotificationService batchNotificationService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(batchNotificationService, "batchEnabled", true);
    }

    @Test
    void testEnqueueOrSendPushNotification_BatchEnabled_StaffRecipient() {
        // Arrange
        String recipient = "deputyWarden1";
        
        // Act
        batchNotificationService.enqueueOrSendPushNotification(
            recipient, "Title", "Message", "/url", "NORMAL_REQUEST", 123L
        );

        // Assert
        ArgumentCaptor<QueuedNotification> captor = ArgumentCaptor.forClass(QueuedNotification.class);
        verify(queuedRepo, times(1)).save(captor.capture());
        verify(pushNotificationService, never()).sendPushNotification(anyString(), anyString(), anyString(), anyString(), anyLong());

        QueuedNotification saved = captor.getValue();
        assertEquals(recipient, saved.getRecipientUsername());
        assertEquals("NORMAL_REQUEST", saved.getNotificationType());
        assertEquals(123L, saved.getReferenceId());
        assertFalse(saved.isProcessed());
    }

    @Test
    void testEnqueueOrSendPushNotification_BatchEnabled_StudentRecipient() {
        // Arrange
        String studentRecipient = "student@example.com";

        // Act
        batchNotificationService.enqueueOrSendPushNotification(
            studentRecipient, "Approved", "Your request is approved", "/url", "APPROVED", 123L
        );

        // Assert
        verify(queuedRepo, never()).save(any(QueuedNotification.class));
        verify(pushNotificationService, times(1)).sendPushNotification(
            studentRecipient, "Approved", "Your request is approved", "/url", 123L
        );
    }

    @Test
    void testProcessBatch_EmptyQueue() {
        // Arrange
        when(queuedRepo.findUnprocessedForUpdate()).thenReturn(Collections.emptyList());

        // Act
        batchNotificationService.processBatch();

        // Assert
        verify(pushNotificationService, never()).sendPushNotification(anyString(), anyString(), anyString(), anyString(), anyLong());
        verify(queuedRepo, never()).saveAll(anyList());
    }

    @Test
    void testProcessBatch_SingleNotification() {
        // Arrange
        QueuedNotification qn = new QueuedNotification();
        qn.setId(1L);
        qn.setRecipientUsername("deputyWarden1");
        qn.setNotificationType("NORMAL_REQUEST");
        qn.setReferenceId(101L);
        qn.setProcessed(false);

        when(queuedRepo.findUnprocessedForUpdate()).thenReturn(Collections.singletonList(qn));

        // Act
        batchNotificationService.processBatch();

        // Assert
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyWarden1"),
            eq("New Mess Reduction Request"),
            eq("A new mess reduction request requires your approval."),
            eq("/deputy/request/101"),
            eq(-1L)
        );

        ArgumentCaptor<List<QueuedNotification>> captor = ArgumentCaptor.forClass(List.class);
        verify(queuedRepo, times(1)).saveAll(captor.capture());
        
        List<QueuedNotification> saved = captor.getValue();
        assertEquals(1, saved.size());
        assertTrue(saved.get(0).isProcessed());
        assertNotNull(saved.get(0).getProcessedAt());
    }

    @Test
    void testProcessBatch_MultipleRecipients_GroupedIndependently() {
        // Arrange
        QueuedNotification q1 = new QueuedNotification();
        q1.setId(1L);
        q1.setRecipientUsername("deputyWarden1");
        q1.setNotificationType("NORMAL_REQUEST");
        q1.setReferenceId(101L);
        q1.setProcessed(false);

        QueuedNotification q2 = new QueuedNotification();
        q2.setId(2L);
        q2.setRecipientUsername("warden2");
        q2.setNotificationType("NORMAL_REQUEST");
        q2.setReferenceId(102L);
        q2.setProcessed(false);

        when(queuedRepo.findUnprocessedForUpdate()).thenReturn(Arrays.asList(q1, q2));

        // Act
        batchNotificationService.processBatch();

        // Assert
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyWarden1"), anyString(), anyString(), eq("/deputy/request/101"), eq(-1L)
        );
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("warden2"), anyString(), anyString(), eq("/warden"), eq(-1L)
        );
        verify(queuedRepo, times(2)).saveAll(anyList());
    }

    @Test
    void testProcessBatch_FailureIsolation_OneRecipientFailsDoesNotHaltOther() {
        // Arrange
        QueuedNotification q1 = new QueuedNotification();
        q1.setId(1L);
        q1.setRecipientUsername("deputyWarden1");
        q1.setNotificationType("NORMAL_REQUEST");
        q1.setReferenceId(101L);
        q1.setProcessed(false);

        QueuedNotification q2 = new QueuedNotification();
        q2.setId(2L);
        q2.setRecipientUsername("warden2");
        q2.setNotificationType("NORMAL_REQUEST");
        q2.setReferenceId(102L);
        q2.setProcessed(false);

        when(queuedRepo.findUnprocessedForUpdate()).thenReturn(Arrays.asList(q1, q2));
        doThrow(new RuntimeException("Push network failure")).when(pushNotificationService)
            .sendPushNotification(eq("deputyWarden1"), anyString(), anyString(), anyString(), anyLong());

        // Act
        batchNotificationService.processBatch();

        // Assert: warden2 was still processed despite deputyWarden1 failure
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("warden2"), anyString(), anyString(), eq("/warden"), eq(-1L)
        );
    }

    @Test
    void testEnqueueOrSendPushNotification_BatchDisabled_ImmediateDelivery() {
        // Arrange
        ReflectionTestUtils.setField(batchNotificationService, "batchEnabled", false);

        // Act
        batchNotificationService.enqueueOrSendPushNotification(
            "deputyWarden1", "Title", "Message", "/url", "NORMAL_REQUEST", 123L
        );

        // Assert: Sent immediately, not saved to queue
        verify(queuedRepo, never()).save(any(QueuedNotification.class));
        verify(pushNotificationService, times(1)).sendPushNotification(
            "deputyWarden1", "Title", "Message", "/url", 123L
        );
    }
}
