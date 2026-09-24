package com.hostel.MessReduction.Flow;

import com.hostel.MessReduction.Entity.AutoAcceptSettings;
import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Repo.AutoAcceptSettingsRepo;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Service.ReductionFormExpiryScheduler;
import com.hostel.MessReduction.Service.ReductionFormService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SchedulerAndSystemSettingsWorkflowTest {

    @Mock
    private ReductionFormService reductionFormService;

    @Mock
    private ReductionFormRepo reductionFormRepo;

    @Mock
    private AutoAcceptSettingsRepo autoAcceptSettingsRepo;

    private ReductionFormExpiryScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new ReductionFormExpiryScheduler(reductionFormService);
    }

    @Test
    @DisplayName("WF-HAPPY-18: Scheduler executes midnight cleanup tasks idempotently")
    void testScheduler_MidnightCleanupExecution() {
        scheduler.expireReductionForms();

        verify(reductionFormService, times(1)).expireReductionForms();
        verify(reductionFormService, times(1)).cleanUpExpiredRequests();
    }

    @Test
    @DisplayName("WF-STATE-22: Scheduler auto-disables expired settings and applies active settings")
    void testScheduler_AutoAcceptTasksExecution() {
        scheduler.runAutoAcceptTasks();

        verify(reductionFormService, times(1)).autoDisableExpiredSettings();
        verify(reductionFormService, times(1)).autoApplyActiveSettings();
    }

    @Test
    @DisplayName("WF-HAPPY-18 & WF-STATE-22: Service autoDisableExpiredSettings updates past-date settings to disabled")
    void testService_AutoDisableExpiredSettings_DisablesPastSettings() {
        ReductionFormService service = new ReductionFormService(
                reductionFormRepo,
                null,
                null,
                null,
                null,
                null,
                autoAcceptSettingsRepo,
                null,
                null
        );

        ZoneId systemZone = ZoneId.of("Asia/Kolkata");
        LocalDate today = LocalDate.now(systemZone);

        AutoAcceptSettings expired = new AutoAcceptSettings();
        expired.setId(1L);
        expired.setUsername("deputyWarden1");
        expired.setEnabled(true);
        expired.setFromDate(today.minusDays(10));
        expired.setToDate(today.minusDays(1)); // Expired yesterday

        AutoAcceptSettings active = new AutoAcceptSettings();
        active.setId(2L);
        active.setUsername("deputyWarden2");
        active.setEnabled(true);
        active.setFromDate(today.minusDays(1));
        active.setToDate(today.plusDays(5)); // Still active

        when(autoAcceptSettingsRepo.findAll()).thenReturn(List.of(expired, active));

        service.autoDisableExpiredSettings();

        // Expired setting should have been toggled to disabled
        assertFalse(expired.isEnabled(), "Expired setting must be auto-disabled");
        verify(autoAcceptSettingsRepo, times(1)).saveAll(argThat(list -> {
            List<AutoAcceptSettings> updated = (List<AutoAcceptSettings>) list;
            return updated.size() == 1 && updated.get(0).getId().equals(1L) && !updated.get(0).isEnabled();
        }));
    }
}
