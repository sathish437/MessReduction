import sys

with open("server/src/main/java/com/hostel/MessReduction/Service/ReductionFormService.java", "r") as f:
    content = f.read()

# 1. Constructor
content = content.replace("""    private final AutoAcceptSettingsRepo autoAcceptSettingsRepo;
    private final AuditLogRepo auditLogRepo;
    private final org.springframework.context.ApplicationEventPublisher applicationEventPublisher;

    public ReductionFormService(ReductionFormRepo reductionFormRepo,
                                StudentDetailsRepo studentDetailsRepo,
                                ReductionFormHistoryRepo reductionFormHistoryRepo,
                                ActivityLogService activityLogService,
                                NotificationService notificationService,
                                EmailService emailService,
                                StaffUsersRepo staffUsersRepo,
                                AutoAcceptSettingsRepo autoAcceptSettingsRepo,
                                AuditLogRepo auditLogRepo,
                                org.springframework.context.ApplicationEventPublisher applicationEventPublisher) {
        this.reductionFormRepo = reductionFormRepo;
        this.studentDetailsRepo = studentDetailsRepo;
        this.reductionFormHistoryRepo = reductionFormHistoryRepo;
        this.activityLogService = activityLogService;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.staffUsersRepo = staffUsersRepo;
        this.autoAcceptSettingsRepo = autoAcceptSettingsRepo;
        this.auditLogRepo = auditLogRepo;
        this.applicationEventPublisher = applicationEventPublisher;
    }""", """    private final AutoAcceptSettingsRepo autoAcceptSettingsRepo;
    private final AuditLogRepo auditLogRepo;
    private final WhatsAppService whatsAppService;
    private final WhatsAppMessageBuilder whatsAppMessageBuilder;

    public ReductionFormService(ReductionFormRepo reductionFormRepo,
                                StudentDetailsRepo studentDetailsRepo,
                                ReductionFormHistoryRepo reductionFormHistoryRepo,
                                ActivityLogService activityLogService,
                                NotificationService notificationService,
                                EmailService emailService,
                                StaffUsersRepo staffUsersRepo,
                                AutoAcceptSettingsRepo autoAcceptSettingsRepo,
                                AuditLogRepo auditLogRepo,
                                WhatsAppService whatsAppService,
                                WhatsAppMessageBuilder whatsAppMessageBuilder) {
        this.reductionFormRepo = reductionFormRepo;
        this.studentDetailsRepo = studentDetailsRepo;
        this.reductionFormHistoryRepo = reductionFormHistoryRepo;
        this.activityLogService = activityLogService;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.staffUsersRepo = staffUsersRepo;
        this.autoAcceptSettingsRepo = autoAcceptSettingsRepo;
        this.auditLogRepo = auditLogRepo;
        this.whatsAppService = whatsAppService;
        this.whatsAppMessageBuilder = whatsAppMessageBuilder;
    }""")

# 2. handleNewSubmissionNotifications
content = content.replace("""            staffUsersRepo.findByUserName(deputyUsername).ifPresent(dw -> {
                notificationService.createNotification(dw.getUserName(), "New Reduction Request Received", "NORMAL_REQUEST", form.getFormId());
            });
            applicationEventPublisher.publishEvent(new com.hostel.MessReduction.Event.ReductionFormEvent(this, form, com.hostel.MessReduction.Event.ReductionFormEvent.EventType.SUBMITTED));""", """            staffUsersRepo.findByUserName(deputyUsername).ifPresent(dw -> {
                notificationService.createNotification(dw.getUserName(), "New Reduction Request Received", "NORMAL_REQUEST", form.getFormId());
                if (dw.getPhoneNo() != null) {
                    whatsAppService.sendTextMessage(dw.getPhoneNo(), whatsAppMessageBuilder.buildNewRequestMessage(form));
                }
            });""")

# 3. updateWardenPendingStatus
content = content.replace("""        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Warden Approved Request", "APPROVED", form.getFormId());
        applicationEventPublisher.publishEvent(new com.hostel.MessReduction.Event.ReductionFormEvent(this, form, com.hostel.MessReduction.Event.ReductionFormEvent.EventType.WARDEN_APPROVED));""", """        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Warden Approved Request", "APPROVED", form.getFormId());
        if (form.getStudentDetails().getPhoneNo() != null) {
            whatsAppService.sendTextMessage(form.getStudentDetails().getPhoneNo(), whatsAppMessageBuilder.buildWardenApproveToStudentMessage(form));
        }
        staffUsersRepo.findByRole(Role.Office).forEach(office -> {
            if (office.getPhoneNo() != null) {
                whatsAppService.sendTextMessage(office.getPhoneNo(), whatsAppMessageBuilder.buildWardenApproveToOfficeMessage(form));
            }
        });""")

# 4. updateDeputyWardenPendingStatus
content = content.replace("""        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Deputy Warden Approved Request", "APPROVED", form.getFormId());
        applicationEventPublisher.publishEvent(new com.hostel.MessReduction.Event.ReductionFormEvent(this, form, com.hostel.MessReduction.Event.ReductionFormEvent.EventType.DEPUTY_WARDEN_APPROVED));""", """        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Deputy Warden Approved Request", "APPROVED", form.getFormId());
        if (form.getStudentDetails().getPhoneNo() != null) {
            whatsAppService.sendTextMessage(form.getStudentDetails().getPhoneNo(), whatsAppMessageBuilder.buildDeputyWardenApproveToStudentMessage(form));
        }
        staffUsersRepo.findByRole(Role.Warden).forEach(warden -> {
            if ("warden".equals(warden.getUserName()) || ("warden" + form.getYear()).equals(warden.getUserName())) {
                if (warden.getPhoneNo() != null) {
                    whatsAppService.sendTextMessage(warden.getPhoneNo(), whatsAppMessageBuilder.buildDeputyWardenApproveToWardenMessage(form));
                }
            }
        });""")

# 5. updateOfficePendingStatus
content = content.replace("""        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Office Approved Request", "APPROVED", form.getFormId());
        applicationEventPublisher.publishEvent(new com.hostel.MessReduction.Event.ReductionFormEvent(this, form, com.hostel.MessReduction.Event.ReductionFormEvent.EventType.OFFICE_APPROVED));""", """        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Office Approved Request", "APPROVED", form.getFormId());
        if (form.getStudentDetails().getPhoneNo() != null) {
            whatsAppService.sendTextMessage(form.getStudentDetails().getPhoneNo(), whatsAppMessageBuilder.buildOfficeApproveMessage(form));
        }""")

# 6. rejectWardenForm
content = content.replace("""        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Request Rejected by Warden", "REJECTED", form.getFormId());
        applicationEventPublisher.publishEvent(new com.hostel.MessReduction.Event.ReductionFormEvent(this, form, com.hostel.MessReduction.Event.ReductionFormEvent.EventType.WARDEN_REJECTED));""", """        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Request Rejected by Warden", "REJECTED", form.getFormId());
        if (form.getStudentDetails().getPhoneNo() != null) {
            whatsAppService.sendTextMessage(form.getStudentDetails().getPhoneNo(), whatsAppMessageBuilder.buildWardenRejectMessage(form));
        }""")

# 7. rejectDeputyWardenForm
content = content.replace("""        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Request Rejected by Deputy Warden", "REJECTED", form.getFormId());
        applicationEventPublisher.publishEvent(new com.hostel.MessReduction.Event.ReductionFormEvent(this, form, com.hostel.MessReduction.Event.ReductionFormEvent.EventType.DEPUTY_WARDEN_REJECTED));""", """        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Request Rejected by Deputy Warden", "REJECTED", form.getFormId());
        if (form.getStudentDetails().getPhoneNo() != null) {
            whatsAppService.sendTextMessage(form.getStudentDetails().getPhoneNo(), whatsAppMessageBuilder.buildDeputyWardenRejectMessage(form));
        }""")

# 8. rejectOfficeForm
content = content.replace("""        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Request Rejected by Office", "REJECTED", form.getFormId());
        applicationEventPublisher.publishEvent(new com.hostel.MessReduction.Event.ReductionFormEvent(this, form, com.hostel.MessReduction.Event.ReductionFormEvent.EventType.OFFICE_REJECTED));""", """        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Request Rejected by Office", "REJECTED", form.getFormId());
        if (form.getStudentDetails().getPhoneNo() != null) {
            whatsAppService.sendTextMessage(form.getStudentDetails().getPhoneNo(), whatsAppMessageBuilder.buildOfficeRejectMessage(form));
        }""")

# 9. checkAndApplyAutoAcceptForDeputy (AUTO_ACCEPTED)
content = content.replace("""        try {
            applicationEventPublisher.publishEvent(new com.hostel.MessReduction.Event.ReductionFormEvent(this, form, com.hostel.MessReduction.Event.ReductionFormEvent.EventType.AUTO_ACCEPTED));
        } catch (Exception e) {
            log.error("[AUTO_ACCEPT] WhatsApp notification failed for formId={}: {}", form.getFormId(), e.getMessage());
        }""", """        try {
            if (form.getStudentDetails().getPhoneNo() != null) {
                whatsAppService.sendTextMessage(form.getStudentDetails().getPhoneNo(), whatsAppMessageBuilder.buildAutoAcceptMessage(form));
            }
        } catch (Exception e) {
            log.error("[AUTO_ACCEPT] WhatsApp notification failed for formId={}: {}", form.getFormId(), e.getMessage());
        }""")

# 10. checkAndApplyAutoAcceptForWarden (AUTO_ACCEPTED)
content = content.replace("""        try {
            applicationEventPublisher.publishEvent(new com.hostel.MessReduction.Event.ReductionFormEvent(this, form, com.hostel.MessReduction.Event.ReductionFormEvent.EventType.AUTO_ACCEPTED));
        } catch (Exception e) {
            log.error("[AUTO_ACCEPT] WhatsApp notification failed for formId={}: {}", form.getFormId(), e.getMessage());
        }""", """        try {
            if (form.getStudentDetails().getPhoneNo() != null) {
                whatsAppService.sendTextMessage(form.getStudentDetails().getPhoneNo(), whatsAppMessageBuilder.buildAutoAcceptMessage(form));
            }
        } catch (Exception e) {
            log.error("[AUTO_ACCEPT] WhatsApp notification failed for formId={}: {}", form.getFormId(), e.getMessage());
        }""")


with open("server/src/main/java/com/hostel/MessReduction/Service/ReductionFormService.java", "w") as f:
    f.write(content)
