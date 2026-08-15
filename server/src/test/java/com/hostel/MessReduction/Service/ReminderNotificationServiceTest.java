package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.*;
import com.hostel.MessReduction.Repo.AppNotificationRepository;
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
    private FirebaseNotificationService firebaseNotificationService;

    @Mock
    private AppNotificationRepository appNotificationRepository;

    @InjectMocks
    private ReminderNotificationService reminderNotificationService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(reminderNotificationService, "reminderEnabled", true);
        ReflectionTestUtils.setField(reminderNotificationService, "reminderDelayHoursStr", "24");
        ReflectionTestUtils.setField(reminderNotificationService, "reminderIntervalHoursStr", "24");
    }

    @Test
    void testProcessReminders_NoPendingForms() {
        // Arrange
        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(Collections.emptyList());

        // Act
        reminderNotificationService.processReminders();

        // Assert
        verify(pushNotificationService, never()).sendPushNotification(anyString(), anyString(), anyString(), anyString(), anyLong());
        verify(appNotificationRepository, never()).save(any(AppNotification.class));
    }

    @Test
    void testProcessReminders_NotEligibleYet_WithinInitialDelay() {
        // Arrange: Submitted 2 hours ago, but delay-hours is 24 hours
        ReductionForm form = new ReductionForm();
        form.setFormId(101L);
        form.setActive(true);
        form.setCurrentStatus(FormStatus.PendingDeputyWarden);
        form.setAssignedDeputyWarden("deputyWarden1");
        form.setSubmittedAt(LocalDateTime.now().minusHours(2));

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(Collections.singletonList(form));
        when(reminderLogRepo.findByFormIdIn(anyList())).thenReturn(Collections.emptyList());

        // Act
        reminderNotificationService.processReminders();

        // Assert
        verify(pushNotificationService, never()).sendPushNotification(anyString(), anyString(), anyString(), anyString(), anyLong());
        verify(appNotificationRepository, never()).save(any(AppNotification.class));
    }

    @Test
    void testProcessReminders_EligibleFirstReminder_DeputyWarden() {
        // Arrange: Submitted 25 hours ago, delay-hours is 24 hours
        ReductionForm form = new ReductionForm();
        form.setFormId(101L);
        form.setActive(true);
        form.setCurrentStatus(FormStatus.PendingDeputyWarden);
        form.setAssignedDeputyWarden("deputyWarden1");
        form.setSubmittedAt(LocalDateTime.now().minusHours(25));

        StudentDetails student = new StudentDetails();
        student.setName("Alice");
        form.setStudentDetails(student);

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(Collections.singletonList(form));
        when(reminderLogRepo.findByFormIdIn(Collections.singletonList(101L))).thenReturn(Collections.emptyList());

        // Act
        reminderNotificationService.processReminders();

        // Assert
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyWarden1"),
            eq("Mess Reduction Reminder"),
            eq("Request from Alice is waiting for your action."),
            eq("/deputy/request/101"),
            eq(101L)
        );

        verify(appNotificationRepository, times(1)).save(any(AppNotification.class));

        ArgumentCaptor<List<NotificationReminderLog>> logCaptor = ArgumentCaptor.forClass(List.class);
        verify(reminderLogRepo, times(1)).saveAll(logCaptor.capture());
        
        List<NotificationReminderLog> savedLogs = logCaptor.getValue();
        assertEquals(1, savedLogs.size());
        assertEquals("deputyWarden1", savedLogs.get(0).getRecipientUsername());
        assertEquals(101L, savedLogs.get(0).getFormId());
        assertEquals(1, savedLogs.get(0).getReminderCount());
        assertNotNull(savedLogs.get(0).getLastReminderSentAt());
    }

    @Test
    void testProcessReminders_EligibleSubsequentReminder_Warden() {
        // Arrange
        ReductionForm form = new ReductionForm();
        form.setFormId(102L);
        form.setActive(true);
        form.setCurrentStatus(FormStatus.PendingWarden);
        form.setYear(2);
        form.setSubmittedAt(LocalDateTime.now().minusHours(50));

        StaffUsers warden = new StaffUsers();
        warden.setUserName("warden2");
        warden.setRole(Role.Warden);

        NotificationReminderLog existingLog = new NotificationReminderLog();
        existingLog.setRecipientUsername("warden2");
        existingLog.setFormId(102L);
        existingLog.setReminderCount(1);
        existingLog.setLastReminderSentAt(LocalDateTime.now().minusHours(26)); // Last sent 26 hours ago (> 24h interval)

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(Collections.singletonList(form));
        when(staffUsersRepo.findByRole(Role.Warden)).thenReturn(Collections.singletonList(warden));
        when(reminderLogRepo.findByFormIdIn(Collections.singletonList(102L))).thenReturn(Collections.singletonList(existingLog));

        // Act
        reminderNotificationService.processReminders();

        // Assert
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("warden2"),
            eq("Mess Reduction Reminder"),
            anyString(),
            eq("/warden"),
            eq(102L)
        );

        verify(appNotificationRepository, times(1)).save(any(AppNotification.class));
        verify(reminderLogRepo, times(1)).saveAll(anyList());
        assertEquals(2, existingLog.getReminderCount());
    }

    @Test
    void testProcessReminders_DuplicateReminderPrevention_WithinInterval() {
        // Arrange: Last reminder sent 4 hours ago, interval is 24 hours
        ReductionForm form = new ReductionForm();
        form.setFormId(102L);
        form.setActive(true);
        form.setCurrentStatus(FormStatus.PendingWarden);
        form.setYear(2);
        form.setSubmittedAt(LocalDateTime.now().minusHours(50));

        StaffUsers warden = new StaffUsers();
        warden.setUserName("warden2");
        warden.setRole(Role.Warden);

        NotificationReminderLog existingLog = new NotificationReminderLog();
        existingLog.setRecipientUsername("warden2");
        existingLog.setFormId(102L);
        existingLog.setReminderCount(1);
        existingLog.setLastReminderSentAt(LocalDateTime.now().minusHours(4)); // 4 hours ago < 24h interval

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(Collections.singletonList(form));
        when(staffUsersRepo.findByRole(Role.Warden)).thenReturn(Collections.singletonList(warden));
        when(reminderLogRepo.findByFormIdIn(Collections.singletonList(102L))).thenReturn(Collections.singletonList(existingLog));

        // Act
        reminderNotificationService.processReminders();

        // Assert: No duplicate reminder sent
        verify(pushNotificationService, never()).sendPushNotification(anyString(), anyString(), anyString(), anyString(), anyLong());
        verify(appNotificationRepository, never()).save(any(AppNotification.class));
        verify(reminderLogRepo, never()).saveAll(anyList());
    }

    @Test
    void testProcessReminders_MultipleFormsGrouped_ConsolidatedNotification() {
        // Arrange
        ReductionForm f1 = new ReductionForm();
        f1.setFormId(201L);
        f1.setActive(true);
        f1.setCurrentStatus(FormStatus.PendingDeputyWarden);
        f1.setAssignedDeputyWarden("deputyWarden1");
        f1.setSubmittedAt(LocalDateTime.now().minusHours(30));

        ReductionForm f2 = new ReductionForm();
        f2.setFormId(202L);
        f2.setActive(true);
        f2.setCurrentStatus(FormStatus.PendingDeputyWarden);
        f2.setAssignedDeputyWarden("deputyWarden1");
        f2.setSubmittedAt(LocalDateTime.now().minusHours(28));

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(Arrays.asList(f1, f2));
        when(reminderLogRepo.findByFormIdIn(Arrays.asList(201L, 202L))).thenReturn(Collections.emptyList());

        // Act
        reminderNotificationService.processReminders();

        // Assert: Consolidated notification sent
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyWarden1"),
            eq("Mess Reduction Reminder"),
            eq("2 mess reduction requests are pending your action."),
            eq("/deputy"),
            eq(-1L)
        );

        ArgumentCaptor<AppNotification> appNotifCaptor = ArgumentCaptor.forClass(AppNotification.class);
        verify(appNotificationRepository, times(1)).save(appNotifCaptor.capture());
        assertEquals("BATCH_REMINDER", appNotifCaptor.getValue().getType());
        assertEquals("2 mess reduction requests are pending your action.", appNotifCaptor.getValue().getMessage());

        verify(reminderLogRepo, times(1)).saveAll(anyList());
    }

    @Test
    void testProcessReminders_OfficeRecipient() {
        // Arrange
        ReductionForm form = new ReductionForm();
        form.setFormId(301L);
        form.setActive(true);
        form.setCurrentStatus(FormStatus.PendingOffice);
        form.setSubmittedAt(LocalDateTime.now().minusHours(30));

        StaffUsers officeUser = new StaffUsers();
        officeUser.setUserName("office");
        officeUser.setRole(Role.Office);

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(Collections.singletonList(form));
        when(staffUsersRepo.findByRole(Role.Office)).thenReturn(Collections.singletonList(officeUser));
        when(reminderLogRepo.findByFormIdIn(Collections.singletonList(301L))).thenReturn(Collections.emptyList());

        // Act
        reminderNotificationService.processReminders();

        // Assert
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("office"),
            eq("Mess Reduction Reminder"),
            anyString(),
            eq("/office"),
            eq(301L)
        );
        verify(appNotificationRepository, times(1)).save(any(AppNotification.class));
    }

    @Test
    void testProcessReminders_DisabledConfiguration() {
        // Arrange
        ReflectionTestUtils.setField(reminderNotificationService, "reminderEnabled", false);

        // Act
        reminderNotificationService.processReminders();

        // Assert
        verify(reductionFormRepo, never()).findPendingFormsForUpdate(anyList());
        verify(pushNotificationService, never()).sendPushNotification(anyString(), anyString(), anyString(), anyString(), anyLong());
    }

    @Test
    void testProcessReminders_InactiveOrDeletedForms_Skipped() {
        // Arrange
        ReductionForm inactiveForm = new ReductionForm();
        inactiveForm.setFormId(401L);
        inactiveForm.setActive(false);
        inactiveForm.setCurrentStatus(FormStatus.PendingDeputyWarden);

        ReductionForm deletedForm = new ReductionForm();
        deletedForm.setFormId(402L);
        deletedForm.setActive(true);
        deletedForm.setDeletedByStudent(true);
        deletedForm.setCurrentStatus(FormStatus.PendingDeputyWarden);

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(Arrays.asList(inactiveForm, deletedForm));

        // Act
        reminderNotificationService.processReminders();

        // Assert
        verify(pushNotificationService, never()).sendPushNotification(anyString(), anyString(), anyString(), anyString(), anyLong());
        verify(reminderLogRepo, never()).findByFormIdIn(anyList());
    }

    @Test
    void testProcessReminders_Scenario1_CurrentPending7_PreviousReminderCount10() {
        // Arrange: 7 current pending forms for deputyWarden1, with previous reminder logs having reminderCount=10
        List<ReductionForm> forms = new ArrayList<>();
        List<NotificationReminderLog> logs = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (long i = 1; i <= 7; i++) {
            ReductionForm f = new ReductionForm();
            f.setFormId(100L + i);
            f.setActive(true);
            f.setCurrentStatus(FormStatus.PendingDeputyWarden);
            f.setAssignedDeputyWarden("deputyWarden1");
            f.setSubmittedAt(now.minusHours(50));
            forms.add(f);

            NotificationReminderLog log = new NotificationReminderLog();
            log.setRecipientUsername("deputyWarden1");
            log.setFormId(100L + i);
            log.setReminderCount(10); // Stale previous reminder count
            log.setLastReminderSentAt(now.minusHours(30)); // Over 24h ago -> due for reminder
            logs.add(log);
        }

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(forms);
        when(reminderLogRepo.findByFormIdIn(anyList())).thenReturn(logs);

        // Act
        reminderNotificationService.processReminders();

        // Assert: Notification must state current actual count (7), NOT stale 10
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyWarden1"),
            eq("Mess Reduction Reminder"),
            eq("7 mess reduction requests are pending your action."),
            eq("/deputy"),
            eq(-1L)
        );

        ArgumentCaptor<AppNotification> appNotifCaptor = ArgumentCaptor.forClass(AppNotification.class);
        verify(appNotificationRepository, times(1)).save(appNotifCaptor.capture());
        assertEquals("7 mess reduction requests are pending your action.", appNotifCaptor.getValue().getMessage());
    }

    @Test
    void testProcessReminders_Scenario3_CurrentPending3_PreviousReminderCount20() {
        // Arrange: 3 current pending forms for deputyWarden1, with previous reminder logs having reminderCount=20
        List<ReductionForm> forms = new ArrayList<>();
        List<NotificationReminderLog> logs = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (long i = 1; i <= 3; i++) {
            ReductionForm f = new ReductionForm();
            f.setFormId(200L + i);
            f.setActive(true);
            f.setCurrentStatus(FormStatus.PendingDeputyWarden);
            f.setAssignedDeputyWarden("deputyWarden1");
            f.setSubmittedAt(now.minusHours(50));
            forms.add(f);

            NotificationReminderLog log = new NotificationReminderLog();
            log.setRecipientUsername("deputyWarden1");
            log.setFormId(200L + i);
            log.setReminderCount(20); // Stale high count
            log.setLastReminderSentAt(now.minusHours(26));
            logs.add(log);
        }

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(forms);
        when(reminderLogRepo.findByFormIdIn(anyList())).thenReturn(logs);

        // Act
        reminderNotificationService.processReminders();

        // Assert: Notification must state current actual count (3)
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyWarden1"),
            eq("Mess Reduction Reminder"),
            eq("3 mess reduction requests are pending your action."),
            eq("/deputy"),
            eq(-1L)
        );
    }

    @Test
    void testProcessReminders_Scenario4_RecipientA5_RecipientB8() {
        // Arrange: Recipient A (deputyA) has 5 pending forms, Recipient B (deputyB) has 8 pending forms
        List<ReductionForm> forms = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (long i = 1; i <= 5; i++) {
            ReductionForm f = new ReductionForm();
            f.setFormId(300L + i);
            f.setActive(true);
            f.setCurrentStatus(FormStatus.PendingDeputyWarden);
            f.setAssignedDeputyWarden("deputyA");
            f.setSubmittedAt(now.minusHours(30));
            forms.add(f);
        }

        for (long i = 1; i <= 8; i++) {
            ReductionForm f = new ReductionForm();
            f.setFormId(400L + i);
            f.setActive(true);
            f.setCurrentStatus(FormStatus.PendingDeputyWarden);
            f.setAssignedDeputyWarden("deputyB");
            f.setSubmittedAt(now.minusHours(30));
            forms.add(f);
        }

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(forms);
        when(reminderLogRepo.findByFormIdIn(anyList())).thenReturn(Collections.emptyList());

        // Act
        reminderNotificationService.processReminders();

        // Assert: deputyA receives 5, deputyB receives 8
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyA"),
            eq("Mess Reduction Reminder"),
            eq("5 mess reduction requests are pending your action."),
            eq("/deputy"),
            eq(-1L)
        );

        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyB"),
            eq("Mess Reduction Reminder"),
            eq("8 mess reduction requests are pending your action."),
            eq("/deputy"),
            eq(-1L)
        );
    }

    @Test
    void testProcessReminders_PartialEligibleOverdue_ShowsTotalCurrentPendingCount() {
        // Arrange: 7 total pending forms for deputyWarden1: 2 overdue (>24h), 5 recent (<24h)
        List<ReductionForm> forms = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // 2 overdue forms (>24h)
        for (long i = 1; i <= 2; i++) {
            ReductionForm f = new ReductionForm();
            f.setFormId(500L + i);
            f.setActive(true);
            f.setCurrentStatus(FormStatus.PendingDeputyWarden);
            f.setAssignedDeputyWarden("deputyWarden1");
            f.setSubmittedAt(now.minusHours(30));
            forms.add(f);
        }

        // 5 fresh forms (<24h)
        for (long i = 3; i <= 7; i++) {
            ReductionForm f = new ReductionForm();
            f.setFormId(500L + i);
            f.setActive(true);
            f.setCurrentStatus(FormStatus.PendingDeputyWarden);
            f.setAssignedDeputyWarden("deputyWarden1");
            f.setSubmittedAt(now.minusHours(2));
            forms.add(f);
        }

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(forms);
        when(reminderLogRepo.findByFormIdIn(anyList())).thenReturn(Collections.emptyList());

        // Act
        reminderNotificationService.processReminders();

        // Assert: Reminder triggered by the 2 overdue forms, but message must report the total current pending count (7)!
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyWarden1"),
            eq("Mess Reduction Reminder"),
            eq("7 mess reduction requests are pending your action."),
            eq("/deputy"),
            eq(-1L)
        );
    }

    @Test
    void testProcessReminders_ExactScenario_CurrentPending8_Shows8() {
        // Arrange: 8 current pending forms for deputyWarden1
        List<ReductionForm> forms = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (long i = 1; i <= 8; i++) {
            ReductionForm f = new ReductionForm();
            f.setFormId(800L + i);
            f.setActive(true);
            f.setCurrentStatus(FormStatus.PendingDeputyWarden);
            f.setAssignedDeputyWarden("deputyWarden1");
            f.setSubmittedAt(now.minusHours(30));
            forms.add(f);
        }

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(forms);
        when(reminderLogRepo.findByFormIdIn(anyList())).thenReturn(Collections.emptyList());

        // Act
        reminderNotificationService.processReminders();

        // Assert: Exactly 8 reported
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyWarden1"),
            eq("Mess Reduction Reminder"),
            eq("8 mess reduction requests are pending your action."),
            eq("/deputy"),
            eq(-1L)
        );
    }

    @Test
    void testProcessReminders_ExactScenario_PreviousReminder10_CurrentPending5_Shows5() {
        // Arrange: 5 current pending forms for deputyWarden1 with stale log count = 10
        List<ReductionForm> forms = new ArrayList<>();
        List<NotificationReminderLog> logs = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (long i = 1; i <= 5; i++) {
            ReductionForm f = new ReductionForm();
            f.setFormId(850L + i);
            f.setActive(true);
            f.setCurrentStatus(FormStatus.PendingDeputyWarden);
            f.setAssignedDeputyWarden("deputyWarden1");
            f.setSubmittedAt(now.minusHours(50));
            forms.add(f);

            NotificationReminderLog log = new NotificationReminderLog();
            log.setRecipientUsername("deputyWarden1");
            log.setFormId(850L + i);
            log.setReminderCount(10); // Previous reminder count
            log.setLastReminderSentAt(now.minusHours(26));
            logs.add(log);
        }

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(forms);
        when(reminderLogRepo.findByFormIdIn(anyList())).thenReturn(logs);

        // Act
        reminderNotificationService.processReminders();

        // Assert: Exactly 5 reported, NOT 10
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyWarden1"),
            eq("Mess Reduction Reminder"),
            eq("5 mess reduction requests are pending your action."),
            eq("/deputy"),
            eq(-1L)
        );
    }

    @Test
    void testProcessReminders_ExactScenario_PreviousReminder20_CurrentPending2_Shows2() {
        // Arrange: 2 current pending forms for deputyWarden1 with stale log count = 20
        List<ReductionForm> forms = new ArrayList<>();
        List<NotificationReminderLog> logs = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (long i = 1; i <= 2; i++) {
            ReductionForm f = new ReductionForm();
            f.setFormId(870L + i);
            f.setActive(true);
            f.setCurrentStatus(FormStatus.PendingDeputyWarden);
            f.setAssignedDeputyWarden("deputyWarden1");
            f.setSubmittedAt(now.minusHours(60));
            forms.add(f);

            NotificationReminderLog log = new NotificationReminderLog();
            log.setRecipientUsername("deputyWarden1");
            log.setFormId(870L + i);
            log.setReminderCount(20); // Stale high count
            log.setLastReminderSentAt(now.minusHours(30));
            logs.add(log);
        }

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(forms);
        when(reminderLogRepo.findByFormIdIn(anyList())).thenReturn(logs);

        // Act
        reminderNotificationService.processReminders();

        // Assert: Exactly 2 reported, NOT 20
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyWarden1"),
            eq("Mess Reduction Reminder"),
            eq("2 mess reduction requests are pending your action."),
            eq("/deputy"),
            eq(-1L)
        );
    }

    @Test
    void testProcessReminders_ExactScenario_RecipientA7_RecipientB3() {
        // Arrange: Recipient A = 7 pending, Recipient B = 3 pending
        List<ReductionForm> forms = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (long i = 1; i <= 7; i++) {
            ReductionForm f = new ReductionForm();
            f.setFormId(900L + i);
            f.setActive(true);
            f.setCurrentStatus(FormStatus.PendingDeputyWarden);
            f.setAssignedDeputyWarden("deputyA");
            f.setSubmittedAt(now.minusHours(30));
            forms.add(f);
        }

        for (long i = 1; i <= 3; i++) {
            ReductionForm f = new ReductionForm();
            f.setFormId(950L + i);
            f.setActive(true);
            f.setCurrentStatus(FormStatus.PendingDeputyWarden);
            f.setAssignedDeputyWarden("deputyB");
            f.setSubmittedAt(now.minusHours(30));
            forms.add(f);
        }

        when(reductionFormRepo.findPendingFormsForUpdate(anyList())).thenReturn(forms);
        when(reminderLogRepo.findByFormIdIn(anyList())).thenReturn(Collections.emptyList());

        // Act
        reminderNotificationService.processReminders();

        // Assert: A receives 7, B receives 3
        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyA"),
            eq("Mess Reduction Reminder"),
            eq("7 mess reduction requests are pending your action."),
            eq("/deputy"),
            eq(-1L)
        );

        verify(pushNotificationService, times(1)).sendPushNotification(
            eq("deputyB"),
            eq("Mess Reduction Reminder"),
            eq("3 mess reduction requests are pending your action."),
            eq("/deputy"),
            eq(-1L)
        );
    }
}

