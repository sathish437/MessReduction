package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.*;
import com.hostel.MessReduction.Repo.NotificationReminderLogRepository;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReminderNotificationServiceTest {

    @Mock
    private ReductionFormRepo reductionFormRepo;

    @Mock
    private StaffUsersRepo staffUsersRepo;

    @Mock
    private NotificationReminderLogRepository reminderLogRepo;

    @Mock
    private PushNotificationService pushNotificationService;

    @Mock
    private com.hostel.MessReduction.Repo.SystemSettingsRepo systemSettingsRepo;

    @InjectMocks
    private ReminderNotificationService reminderNotificationService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(reminderNotificationService, "reminderEnabled", true);
        ReflectionTestUtils.setField(reminderNotificationService, "reminderIntervalHoursStr", "3");
    }

    @Test
    void testProcessReminders_NoPendingForms() {
        // Arrange
        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(Collections.emptyList());

        // Act
        reminderNotificationService.processReminders();

        // Assert
        verify(pushNotificationService, never()).sendPushNotification(anyString(), anyString(), anyString(), anyString(), anyLong());
    }

    @Test
    void testProcessReminders_NotEligibleYet() {
        // Arrange
        ReductionForm form = new ReductionForm();
        form.setFormId(101L);
        form.setCurrentStatus(FormStatus.PendingDeputyWarden);
        form.setAssignedDeputyWarden("deputyWarden1");
        form.setSubmittedAt(LocalDateTime.now().minusMinutes(30)); // Submitted 30 minutes ago, interval is 3 hours (180 mins)

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(Collections.singletonList(form));
        when(reminderLogRepo.findByRecipientUsernameAndFormId("deputyWarden1", 101L)).thenReturn(Optional.empty());

        // Act
        reminderNotificationService.processReminders();

        // Assert
        verify(pushNotificationService, never()).sendPushNotification(anyString(), anyString(), anyString(), anyString(), anyLong());
    }

    @Test
    void testProcessReminders_EligibleFirstReminder_DeputyWarden() {
        // Arrange
        ReductionForm form = new ReductionForm();
        form.setFormId(101L);
        form.setCurrentStatus(FormStatus.PendingDeputyWarden);
        form.setAssignedDeputyWarden("deputyWarden1");
        form.setSubmittedAt(LocalDateTime.now().minusHours(4)); // Submitted 4 hours ago, interval is 3 hours

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(Collections.singletonList(form));
        when(reminderLogRepo.findByRecipientUsernameAndFormId("deputyWarden1", 101L)).thenReturn(Optional.empty());

        // Act
        reminderNotificationService.processReminders();

        // Assert
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyWarden1"),
            eq("Pending Approval Reminder"),
            eq("You have 1 pending Mess Reduction request waiting for your approval."),
            eq("/deputy"),
            eq(-1L)
        );

        ArgumentCaptor<NotificationReminderLog> logCaptor = ArgumentCaptor.forClass(NotificationReminderLog.class);
        verify(reminderLogRepo, times(1)).save(logCaptor.capture());
        
        NotificationReminderLog savedLog = logCaptor.getValue();
        assertEquals("deputyWarden1", savedLog.getRecipientUsername());
        assertEquals(101L, savedLog.getFormId());
        assertEquals(1, savedLog.getReminderCount());
        assertNotNull(savedLog.getLastReminderSentAt());
    }

    @Test
    void testProcessReminders_EligibleSubsequentReminder_Warden() {
        // Arrange
        ReductionForm form = new ReductionForm();
        form.setFormId(102L);
        form.setCurrentStatus(FormStatus.PendingWarden);
        form.setYear(2);

        StaffUsers warden = new StaffUsers();
        warden.setUserName("warden2");
        warden.setRole(Role.Warden);

        NotificationReminderLog log = new NotificationReminderLog();
        log.setRecipientUsername("warden2");
        log.setFormId(102L);
        log.setReminderCount(1);
        log.setLastReminderSentAt(LocalDateTime.now().minusHours(4)); // Last sent 4 hours ago, interval is 3 hours

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(Collections.singletonList(form));
        when(staffUsersRepo.findByRole(Role.Warden)).thenReturn(Collections.singletonList(warden));
        when(reminderLogRepo.findByRecipientUsernameAndFormId("warden2", 102L)).thenReturn(Optional.of(log));

        // Act
        reminderNotificationService.processReminders();

        // Assert
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("warden2"),
            eq("Pending Approval Reminder"),
            eq("You have 1 pending Mess Reduction request waiting for your approval."),
            eq("/warden"),
            eq(-1L)
        );

        verify(reminderLogRepo, times(1)).save(log);
        assertEquals(2, log.getReminderCount());
    }

    @Test
    void testProcessReminders_MultipleFormsGrouped() {
        // Arrange
        ReductionForm f1 = new ReductionForm();
        f1.setFormId(201L);
        f1.setCurrentStatus(FormStatus.PendingDeputyWarden);
        f1.setAssignedDeputyWarden("deputyWarden1");
        f1.setSubmittedAt(LocalDateTime.now().minusHours(5));

        ReductionForm f2 = new ReductionForm();
        f2.setFormId(202L);
        f2.setCurrentStatus(FormStatus.PendingDeputyWarden);
        f2.setAssignedDeputyWarden("deputyWarden1");
        f2.setSubmittedAt(LocalDateTime.now().minusHours(4));

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(Arrays.asList(f1, f2));
        when(reminderLogRepo.findByRecipientUsernameAndFormId("deputyWarden1", 201L)).thenReturn(Optional.empty());
        when(reminderLogRepo.findByRecipientUsernameAndFormId("deputyWarden1", 202L)).thenReturn(Optional.empty());

        // Act
        reminderNotificationService.processReminders();

        // Assert
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyWarden1"),
            eq("Pending Approval Reminder"),
            eq("You have 2 pending Mess Reduction requests waiting for your approval."),
            eq("/deputy"),
            eq(-1L)
        );

        verify(reminderLogRepo, times(2)).save(any(NotificationReminderLog.class));
    }
}
