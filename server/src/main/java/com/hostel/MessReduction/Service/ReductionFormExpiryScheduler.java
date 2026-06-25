package com.hostel.MessReduction.Service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReductionFormExpiryScheduler {

    private final ReductionFormService reductionFormService;

    public ReductionFormExpiryScheduler(ReductionFormService reductionFormService) {
        this.reductionFormService = reductionFormService;
    }

    @Scheduled(cron = "0 0 0 * * ?")
    public void expireReductionForms() {
        reductionFormService.expireReductionForms();
        reductionFormService.cleanUpExpiredRequests();
    }

    @Scheduled(cron = "0 */10 * * * *")
    public void runAutoAcceptTasks() {
        reductionFormService.autoDisableExpiredSettings();
        reductionFormService.autoApplyActiveSettings();
    }
}
