package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.QueuedNotification;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Repo.QueuedNotificationRepository;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.*;

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

    @Mock
    private ReductionFormRepo reductionFormRepo;

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

        ReductionForm form = new ReductionForm();
        form.setFormId(101L);
        form.setActive(true);
        form.setCurrentStatus(FormStatus.PendingDeputyWarden);

        when(queuedRepo.findUnprocessedForUpdate()).thenReturn(Collections.singletonList(qn));
        when(reductionFormRepo.findByFormIdIn(anyList())).thenReturn(Collections.singletonList(form));

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

        ReductionForm f1 = new ReductionForm();
        f1.setFormId(101L);
        f1.setActive(true);
        f1.setCurrentStatus(FormStatus.PendingDeputyWarden);

        QueuedNotification q2 = new QueuedNotification();
        q2.setId(2L);
        q2.setRecipientUsername("warden2");
        q2.setNotificationType("NORMAL_REQUEST");
        q2.setReferenceId(102L);
        q2.setProcessed(false);

        ReductionForm f2 = new ReductionForm();
        f2.setFormId(102L);
        f2.setActive(true);
        f2.setCurrentStatus(FormStatus.PendingWarden);

        when(queuedRepo.findUnprocessedForUpdate()).thenReturn(Arrays.asList(q1, q2));
        when(reductionFormRepo.findByFormIdIn(anyList())).thenReturn(Arrays.asList(f1, f2));

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

        ReductionForm f1 = new ReductionForm();
        f1.setFormId(101L);
        f1.setActive(true);
        f1.setCurrentStatus(FormStatus.PendingDeputyWarden);

        QueuedNotification q2 = new QueuedNotification();
        q2.setId(2L);
        q2.setRecipientUsername("warden2");
        q2.setNotificationType("NORMAL_REQUEST");
        q2.setReferenceId(102L);
        q2.setProcessed(false);

        ReductionForm f2 = new ReductionForm();
        f2.setFormId(102L);
        f2.setActive(true);
        f2.setCurrentStatus(FormStatus.PendingWarden);

        when(queuedRepo.findUnprocessedForUpdate()).thenReturn(Arrays.asList(q1, q2));
        when(reductionFormRepo.findByFormIdIn(anyList())).thenReturn(Arrays.asList(f1, f2));
        lenient().doThrow(new RuntimeException("Push network failure")).when(pushNotificationService)
            .sendPushNotification(eq("deputyWarden1"), anyString(), anyString(), anyString(), anyLong());

        // Act
        batchNotificationService.processBatch();

        // Assert: warden2 was still processed despite deputyWarden1 failure
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("warden2"), anyString(), anyString(), eq("/warden"), eq(-1L)
        );
        // Only warden2's notifications marked processed; deputyWarden1 remains unprocessed for retry
        verify(queuedRepo, times(1)).saveAll(Collections.singletonList(q2));
    }

    @Test
    void testProcessBatch_Scenario1_CurrentBatch10Requests() {
        // Arrange: 10 new requests in current batch for deputyWarden1
        List<QueuedNotification> queue = new ArrayList<>();
        List<ReductionForm> forms = new ArrayList<>();

        for (long i = 1; i <= 10; i++) {
            QueuedNotification qn = new QueuedNotification();
            qn.setId(i);
            qn.setRecipientUsername("deputyWarden1");
            qn.setNotificationType("NORMAL_REQUEST");
            qn.setReferenceId(100L + i);
            qn.setProcessed(false);
            queue.add(qn);

            ReductionForm f = new ReductionForm();
            f.setFormId(100L + i);
            f.setActive(true);
            f.setCurrentStatus(FormStatus.PendingDeputyWarden);
            forms.add(f);
        }

        when(queuedRepo.findUnprocessedForUpdate()).thenReturn(queue);
        when(reductionFormRepo.findByFormIdIn(anyList())).thenReturn(forms);

        // Act
        batchNotificationService.processBatch();

        // Assert: Exactly 10 requests reported
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyWarden1"),
            eq("New Mess Reduction Requests"),
            eq("You have 10 new requests waiting for approval."),
            eq("/deputy"),
            eq(-1L)
        );
    }

    @Test
    void testProcessBatch_Scenario2_PreviousBatch10_CurrentBatch4_NotAccumulated() {
        // Arrange: Only 4 unprocessed requests in queue for this batch (previous 10 already processed)
        List<QueuedNotification> queue = new ArrayList<>();
        List<ReductionForm> forms = new ArrayList<>();

        for (long i = 1; i <= 4; i++) {
            QueuedNotification qn = new QueuedNotification();
            qn.setId(i + 10);
            qn.setRecipientUsername("deputyWarden1");
            qn.setNotificationType("NORMAL_REQUEST");
            qn.setReferenceId(200L + i);
            qn.setProcessed(false);
            queue.add(qn);

            ReductionForm f = new ReductionForm();
            f.setFormId(200L + i);
            f.setActive(true);
            f.setCurrentStatus(FormStatus.PendingDeputyWarden);
            forms.add(f);
        }

        when(queuedRepo.findUnprocessedForUpdate()).thenReturn(queue);
        when(reductionFormRepo.findByFormIdIn(anyList())).thenReturn(forms);

        // Act
        batchNotificationService.processBatch();

        // Assert: Notification must say 4, NOT 14
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyWarden1"),
            eq("New Mess Reduction Requests"),
            eq("You have 4 new requests waiting for approval."),
            eq("/deputy"),
            eq(-1L)
        );
    }

    @Test
    void testProcessBatch_Scenario3_RecipientA6_RecipientB4() {
        // Arrange: Recipient A (deputyA) has 6, Recipient B (deputyB) has 4
        List<QueuedNotification> queue = new ArrayList<>();
        List<ReductionForm> forms = new ArrayList<>();

        for (long i = 1; i <= 6; i++) {
            QueuedNotification qn = new QueuedNotification();
            qn.setId(i);
            qn.setRecipientUsername("deputyA");
            qn.setNotificationType("NORMAL_REQUEST");
            qn.setReferenceId(300L + i);
            qn.setProcessed(false);
            queue.add(qn);

            ReductionForm f = new ReductionForm();
            f.setFormId(300L + i);
            f.setActive(true);
            f.setCurrentStatus(FormStatus.PendingDeputyWarden);
            forms.add(f);
        }

        for (long i = 1; i <= 4; i++) {
            QueuedNotification qn = new QueuedNotification();
            qn.setId(i + 10);
            qn.setRecipientUsername("deputyB");
            qn.setNotificationType("NORMAL_REQUEST");
            qn.setReferenceId(400L + i);
            qn.setProcessed(false);
            queue.add(qn);

            ReductionForm f = new ReductionForm();
            f.setFormId(400L + i);
            f.setActive(true);
            f.setCurrentStatus(FormStatus.PendingDeputyWarden);
            forms.add(f);
        }

        when(queuedRepo.findUnprocessedForUpdate()).thenReturn(queue);
        when(reductionFormRepo.findByFormIdIn(anyList())).thenReturn(forms);

        // Act
        batchNotificationService.processBatch();

        // Assert: deputyA receives 6, deputyB receives 4
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyA"),
            eq("New Mess Reduction Requests"),
            eq("You have 6 new requests waiting for approval."),
            eq("/deputy"),
            eq(-1L)
        );

        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyB"),
            eq("New Mess Reduction Requests"),
            eq("You have 4 new requests waiting for approval."),
            eq("/deputy"),
            eq(-1L)
        );
    }

    @Test
    void testProcessBatch_Scenario5_DuplicateQueueRecords_Deduplicated() {
        // Arrange: 3 queue items, but 2 reference the same formId 501L
        QueuedNotification q1 = new QueuedNotification(1L, "deputyWarden1", "NORMAL_REQUEST", 501L, null, false, null);
        QueuedNotification q2 = new QueuedNotification(2L, "deputyWarden1", "NORMAL_REQUEST", 501L, null, false, null);
        QueuedNotification q3 = new QueuedNotification(3L, "deputyWarden1", "NORMAL_REQUEST", 502L, null, false, null);

        ReductionForm f1 = new ReductionForm();
        f1.setFormId(501L);
        f1.setActive(true);
        f1.setCurrentStatus(FormStatus.PendingDeputyWarden);

        ReductionForm f2 = new ReductionForm();
        f2.setFormId(502L);
        f2.setActive(true);
        f2.setCurrentStatus(FormStatus.PendingDeputyWarden);

        when(queuedRepo.findUnprocessedForUpdate()).thenReturn(Arrays.asList(q1, q2, q3));
        when(reductionFormRepo.findByFormIdIn(anyList())).thenReturn(Arrays.asList(f1, f2));

        // Act
        batchNotificationService.processBatch();

        // Assert: Deduplicated to 2 distinct requests (501, 502), not 3
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyWarden1"),
            eq("New Mess Reduction Requests"),
            eq("You have 2 new requests waiting for approval."),
            eq("/deputy"),
            eq(-1L)
        );

        // All 3 queue items are marked processed
        verify(queuedRepo, times(1)).saveAll(Arrays.asList(q1, q2, q3));
    }

    @Test
    void testProcessBatch_FormsAlreadyProcessedBeforeBatch_FilteredOut() {
        // Arrange: 3 queue items, but form 601 was approved and form 602 was deleted before batch ran
        QueuedNotification q1 = new QueuedNotification(1L, "deputyWarden1", "NORMAL_REQUEST", 601L, null, false, null);
        QueuedNotification q2 = new QueuedNotification(2L, "deputyWarden1", "NORMAL_REQUEST", 602L, null, false, null);
        QueuedNotification q3 = new QueuedNotification(3L, "deputyWarden1", "NORMAL_REQUEST", 603L, null, false, null);

        // Form 601 was already approved (status no longer PendingDeputyWarden)
        ReductionForm f1 = new ReductionForm();
        f1.setFormId(601L);
        f1.setActive(true);
        f1.setCurrentStatus(FormStatus.PendingWarden);

        // Form 602 was deleted by student
        ReductionForm f2 = new ReductionForm();
        f2.setFormId(602L);
        f2.setActive(true);
        f2.setDeletedByStudent(true);
        f2.setCurrentStatus(FormStatus.PendingDeputyWarden);

        // Form 603 is valid
        ReductionForm f3 = new ReductionForm();
        f3.setFormId(603L);
        f3.setActive(true);
        f3.setCurrentStatus(FormStatus.PendingDeputyWarden);

        when(queuedRepo.findUnprocessedForUpdate()).thenReturn(Arrays.asList(q1, q2, q3));
        when(reductionFormRepo.findByFormIdIn(anyList())).thenReturn(Arrays.asList(f1, f2, f3));

        // Act
        batchNotificationService.processBatch();

        // Assert: Only 1 valid request reported (form 603)
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyWarden1"),
            eq("New Mess Reduction Request"),
            eq("A new mess reduction request requires your approval."),
            eq("/deputy/request/603"),
            eq(-1L)
        );

        // All 3 queue items are marked processed
        verify(queuedRepo, times(1)).saveAll(Arrays.asList(q1, q2, q3));
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
