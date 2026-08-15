package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.BadRequestException;
import com.hostel.MessReduction.CustomException.DateNotValidException;
import com.hostel.MessReduction.CustomException.InvalidActionException;
import com.hostel.MessReduction.CustomException.InvalidStatusException;
import com.hostel.MessReduction.CustomException.ReductionFormNotFoundException;
import com.hostel.MessReduction.CustomException.StatusAlreadyPendingException;
import com.hostel.MessReduction.CustomException.StudentNotFoundException;
import com.hostel.MessReduction.CustomException.TotalLeaveDateCountException;
import com.hostel.MessReduction.CustomException.UnauthorizedUserException;
import com.hostel.MessReduction.DTO.ReqDTO.ActivityLogRequest;
import com.hostel.MessReduction.DTO.ReqDTO.ReductionFormReqDTO;
import com.hostel.MessReduction.Entity.Gender;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import com.hostel.MessReduction.DTO.ResDTO.ReductionFormHistoryResDTO;
import com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO;
import com.hostel.MessReduction.DTO.ResDTO.RequestTrackingResDTO;
import com.hostel.MessReduction.DTO.ResDTO.StaffDashboardCountDTO;
import com.hostel.MessReduction.DTO.ResDTO.YearWiseCountDTO;
import com.hostel.MessReduction.DTO.ResDTO.BulkRejectSummaryDTO;
import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.ReductionFormHistory;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.MappingDTO.ReductionFormMapper;
import com.hostel.MessReduction.Repo.ReductionFormHistoryRepo;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import com.hostel.MessReduction.Service.ActivityLogService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Objects;
import java.util.Optional;

import com.hostel.MessReduction.Entity.AutoAcceptSettings;
import com.hostel.MessReduction.Repo.AutoAcceptSettingsRepo;
import com.hostel.MessReduction.DTO.ReqDTO.AutoAcceptSettingsDTO;
import com.hostel.MessReduction.Entity.AuditLog;
import com.hostel.MessReduction.Repo.AuditLogRepo;
import java.time.ZoneId;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional(noRollbackFor = {
    BadRequestException.class,
    DateNotValidException.class,
    TotalLeaveDateCountException.class,
    StatusAlreadyPendingException.class,
    InvalidStatusException.class,
    InvalidActionException.class,
    StudentNotFoundException.class,
    ReductionFormNotFoundException.class,
    IllegalArgumentException.class
})
@Slf4j
public class ReductionFormService {
    private static final String ACTION_APPROVE = "Approve";
    private static final String ACTION_REJECT = "Reject";

    private final ReductionFormRepo reductionFormRepo;
    private final StudentDetailsRepo studentDetailsRepo;
    private final ReductionFormHistoryRepo reductionFormHistoryRepo;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;
    private final StaffUsersRepo staffUsersRepo;
    private final AutoAcceptSettingsRepo autoAcceptSettingsRepo;
    private final AuditLogRepo auditLogRepo;
    private final com.hostel.MessReduction.Repo.SystemSettingsRepo systemSettingsRepo;

    public ReductionFormService(ReductionFormRepo reductionFormRepo,
                                StudentDetailsRepo studentDetailsRepo,
                                ReductionFormHistoryRepo reductionFormHistoryRepo,
                                ActivityLogService activityLogService,
                                NotificationService notificationService,
                                StaffUsersRepo staffUsersRepo,
                                AutoAcceptSettingsRepo autoAcceptSettingsRepo,
                                AuditLogRepo auditLogRepo,
                                com.hostel.MessReduction.Repo.SystemSettingsRepo systemSettingsRepo) {
        this.reductionFormRepo = reductionFormRepo;
        this.studentDetailsRepo = studentDetailsRepo;
        this.reductionFormHistoryRepo = reductionFormHistoryRepo;
        this.activityLogService = activityLogService;
        this.notificationService = notificationService;
        this.staffUsersRepo = staffUsersRepo;
        this.autoAcceptSettingsRepo = autoAcceptSettingsRepo;
        this.auditLogRepo = auditLogRepo;
        this.systemSettingsRepo = systemSettingsRepo;
    }


    public StudentDetails getStudentDetails(Long id) {
        if (id == null || id <= 0) {
            throw new BadRequestException("Invalid student ID");
        }
        autoDeactivateAllExpiredForms();
        StudentDetails student = studentDetailsRepo.findById(id)
                .orElseThrow(() -> new StudentNotFoundException("Student not found"));
        if (student.resetSubmissionCountIfNewDay()) {
            studentDetailsRepo.save(student);
        }
        return student;
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getStudentProfileWithForms(Long id) {
        log.info("Student ID received: {}", id);
        if (id == null || id <= 0) {
            throw new BadRequestException("Invalid student ID");
        }
        autoDeactivateAllExpiredForms();
        StudentDetails studentDetails = getStudentDetails(id);
        log.info("Student found: {}", studentDetails.getName());

        List<ReductionForm> forms = reductionFormRepo.findByStudentDetailsStudentIdAndIsActiveTrue(id);
        log.info("Repository query executed. Forms retrieved count: {}", forms != null ? forms.size() : 0);
        
        log.info("DTO mapping started");
        // Map to a safe structure to avoid LazyInitializationException/Infinite recursion during serialization
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("studentId", studentDetails.getStudentId());
        response.put("name", studentDetails.getName());
        response.put("registerNo", studentDetails.getRegisterNo());
        response.put("rollNo", studentDetails.getRollNo());
        response.put("department", studentDetails.getDepartment());
        response.put("gender", studentDetails.getGender());
        response.put("dob", studentDetails.getDob());
        response.put("emailId", studentDetails.getEmailId());
        response.put("phoneNo", studentDetails.getPhoneNo());
        ZoneId systemZone = ZoneId.of("Asia/Kolkata");
        java.time.LocalDate todayInIst = java.time.LocalDate.now(systemZone);
        java.time.LocalDateTime nowInIst = java.time.LocalDateTime.now(systemZone);
        response.put("serverDate", todayInIst.toString());
        response.put("serverDateTime", nowInIst.toString());

        response.put("dailySubmissionCount", studentDetails.getDailySubmissionCount());
        response.put("extraSubmissionGranted", studentDetails.getExtraSubmissionGranted());
        response.put("extraSubmissionUsed", studentDetails.getExtraSubmissionUsed());
        response.put("lastSubmissionDate", studentDetails.getLastSubmissionDate());
        
        java.util.List<com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO> formDTOs = new java.util.ArrayList<>();
        if (forms != null) {
            for (com.hostel.MessReduction.Entity.ReductionForm form : forms) {
                if (form != null) {
                    formDTOs.add(com.hostel.MessReduction.MappingDTO.ReductionFormMapper.mapToReductionFormResDTO(form));
                }
            }
        }
        response.put("reductionForms", formDTOs);
        log.info("DTO mapping completed");
        
        return response;
    }

    public ReductionFormResDTO formSubmit(ReductionFormReqDTO dto, Long studentId) {
        StudentDetails studentDetails = getStudentDetails(studentId);
        validateNewSubmission(studentId, dto);

        String assignedDeputyWarden = resolveAssignedDeputyWarden(studentDetails.getGender(), dto.getYear());
        ReductionForm reductionForm = ReductionFormMapper.mapToReductionForm(dto, studentDetails, LocalDate.now(), calculateTotalLeaves(dto), assignedDeputyWarden);
        reductionForm.setCurrentStatus(FormStatus.PendingDeputyWarden);
        reductionFormRepo.save(reductionForm);
        log.info("Student request created");
        saveFormHistory(reductionForm, "Student Submitted", null, FormStatus.PendingDeputyWarden, "student", "Initial submission");
        
        processAutoAcceptIfApplicable(reductionForm);
        
        sendWorkflowNotifications(reductionForm);
        
        return ReductionFormMapper.mapToReductionFormResDTO(reductionForm);
    }

    private void sendWorkflowNotifications(ReductionForm form) {
        if (form.getCurrentStatus() == FormStatus.PendingDeputyWarden) {
            String deputyUsername = form.getAssignedDeputyWarden();
            if (deputyUsername != null) {
                staffUsersRepo.findByUserName(deputyUsername).ifPresent(dw -> {
                    notificationService.createNotification(dw.getUserName(), "You have a new request pending.", "NORMAL_REQUEST", form.getFormId());
                });
            }
        } else if (form.getCurrentStatus() == FormStatus.PendingWarden) {
            staffUsersRepo.findByRole(Role.Warden).forEach(warden -> {
                if ("warden".equals(warden.getUserName()) || ("warden" + form.getYear()).equals(warden.getUserName())) {
                    notificationService.createNotification(warden.getUserName(), "New Mess Reduction Request Pending.", "NORMAL_REQUEST", form.getFormId());
                }
            });
        } else if (form.getCurrentStatus() == FormStatus.PendingOffice) {
            log.info("Moving request to Office");
            staffUsersRepo.findByRole(Role.Office).forEach(office -> {
                notificationService.createNotification(office.getUserName(), "New request pending for approval.", "NORMAL_REQUEST", form.getFormId());
            });
        }
    }

    public ReductionFormResDTO getFormForEdit(Long formId, Long studentId) {
        ReductionForm form = reductionFormRepo.findByFormIdAndStudentDetailsStudentIdAndIsActiveTrue(formId, studentId)
                .orElseThrow(() -> new ReductionFormNotFoundException("Form not found or not owned by the student"));

        if (form.getCurrentStatus() == FormStatus.Approved) {
            throw new InvalidStatusException("Approved requests cannot be edited");
        }
        if (form.getCurrentStatus() == FormStatus.PendingWarden || form.getCurrentStatus() == FormStatus.PendingDeputyWarden || form.getCurrentStatus() == FormStatus.PendingOffice) {
            throw new InvalidStatusException("Pending requests cannot be edited");
        }
        return ReductionFormMapper.mapToReductionFormResDTO(form);
    }

    public ReductionFormResDTO resubmitForm(Long formId, Long studentId, ReductionFormReqDTO dto) {
        ReductionForm form = reductionFormRepo.findByFormIdAndStudentDetailsStudentIdAndIsActiveTrue(formId, studentId)
                .orElseThrow(() -> new ReductionFormNotFoundException("Form not found or not owned by the student"));

        if (form.getCurrentStatus() == FormStatus.Approved) {
            throw new InvalidStatusException("Approved requests cannot be edited or resubmitted");
        }
        if (form.getCurrentStatus() == FormStatus.PendingWarden || form.getCurrentStatus() == FormStatus.PendingDeputyWarden || form.getCurrentStatus() == FormStatus.PendingOffice) {
            throw new InvalidStatusException("Pending requests cannot be edited or resubmitted");
        }
        if (!isRejectedStatus(form.getCurrentStatus())) {
            throw new InvalidStatusException("Only rejected requests can be edited and resubmitted");
        }

        StudentDetails studentDetails = form.getStudentDetails();
        if (studentDetails == null) {
            throw new StudentNotFoundException("Student details not associated with this form");
        }
        validateResubmitPayload(dto);

        // Enforce daily submission limit on resubmission (increments lifetime count)
        checkSubmissionLimit(studentDetails);

        FormStatus previousStatus = form.getCurrentStatus();
        form.setYear(dto.getYear());
        form.setRoomNo(dto.getRoomNo());
        form.setLeaveDate(dto.getLeaveDate());
        form.setLeaveTime(dto.getLeaveTime());
        form.setToDate(dto.getToDate());
        form.setArrivalDate(dto.getArrivalDate());
        form.setArrivalTime(dto.getArrivalTime());
        form.setReason(dto.getReason());
        form.setAdditionalRemarks(dto.getAdditionalRemarks());
        form.setPresentDate(LocalDate.now());
        form.setTotalHolidays(calculateTotalLeaves(dto));
        
        FormStatus newStatus = FormStatus.PendingDeputyWarden;
        String stageName = "Deputy Warden";

        if (previousStatus == FormStatus.RejectedDeputyWarden) {
            newStatus = FormStatus.PendingDeputyWarden;
            stageName = "Deputy Warden";
        } else if (previousStatus == FormStatus.RejectedWarden) {
            newStatus = FormStatus.PendingWarden;
            stageName = "Warden";
        } else if (previousStatus == FormStatus.RejectedOffice) {
            newStatus = FormStatus.PendingOffice;
            stageName = "Office";
        }
        
        form.setRejectedStage(previousStatus);
        form.setResumeStage(newStatus);
        form.setResubmissionCount(form.getResubmissionCount() + 1);
        form.setCurrentStatus(newStatus);
        
        if (form.getAssignedDeputyWarden() == null) {
            form.setAssignedDeputyWarden(resolveAssignedDeputyWarden(studentDetails.getGender(), form.getYear()));
        }
        form.setRejectReason(null);

        reductionFormRepo.save(form);
        saveFormHistory(form, "Student Resubmitted", previousStatus, newStatus, "student", "Student resubmitted request after " + stageName + " rejection");
        
        processAutoAcceptIfApplicable(form);
        
        sendWorkflowNotifications(form);
        
        return ReductionFormMapper.mapToReductionFormResDTO(form);
    }

    public void deleteStudentRequest(Long formId, Long studentId) {
        ReductionForm form = reductionFormRepo.findByFormIdAndStudentDetailsStudentIdAndIsActiveTrue(formId, studentId)
                .orElseThrow(() -> new ReductionFormNotFoundException("Form not found or not owned by the student"));

        if (form.getCurrentStatus() == FormStatus.Approved) {
            throw new InvalidStatusException("Approved requests cannot be deleted.");
        }

        FormStatus currentStatus = form.getCurrentStatus();

        form.setActive(false);
        form.setDeletedByStudent(true);
        form.setDeletedAt(LocalDateTime.now());
        reductionFormRepo.save(form);
        
        StudentDetails student = form.getStudentDetails();
        // Only restore count if the deleted form was currently PENDING (if already rejected, limit was restored on rejection)
        if (!isRejectedStatus(currentStatus)) {
            restoreSubmissionCountIfSubmittedToday(student, form);
        }
        
        // Remove all activity log entries related to this request when deleted by student
        activityLogService.deleteLogsByFormId(formId);

        saveFormHistory(form, "Student Deleted Request", currentStatus, null, "student", "Request deleted by student.");
        notificationService.createNotification(student.getEmailId(), "Your request was successfully deleted.", "DELETED", form.getFormId());
    }

    private void restoreSubmissionCountIfSubmittedToday(StudentDetails student, ReductionForm form) {
        // Submission count is a permanent lifetime count and must NEVER decrease on deletion or rejection.
        return;
    }

    public List<ReductionFormHistoryResDTO> getFormHistory(Long formId, Long studentId) {
        reductionFormRepo.findByFormIdAndStudentDetailsStudentIdAndIsActiveTrue(formId, studentId)
                .orElseThrow(() -> new ReductionFormNotFoundException("Form not found or not owned by the student"));

        return reductionFormHistoryRepo.findByReductionFormFormIdAndIsActiveTrueOrderByEventTimestampAsc(formId).stream()
                .map(this::mapHistoryToDTO)
                .toList();
    }

    public List<ReductionFormResDTO> formDetails(Long studentId) {
        autoDeactivateAllExpiredForms();
        List<ReductionForm> forms = reductionFormRepo.findByStudentDetailsStudentIdAndIsActiveTrue(studentId);
        if (forms.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return forms.stream()
                .map(ReductionFormMapper::mapToReductionFormResDTO)
                .toList();
    }

    public List<ReductionFormResDTO> wardenPendingStatus(String userName, String gender, Integer year) {
        autoDeactivateAllExpiredForms();
        Integer wardenYear = resolveWardenYear(userName);
        List<ReductionForm> forms;

        // Apply filters based on parameters
        if (gender != null && !gender.isEmpty() && year != null) {
            // Both gender and year filters
            Gender genderEnum = Gender.valueOf(gender.toUpperCase());
            forms = reductionFormRepo.findByCurrentStatusAndYearAndStudentDetailsGenderAndIsActiveTrue(FormStatus.PendingWarden, year, genderEnum);
        } else if (gender != null && !gender.isEmpty()) {
            // Only gender filter
            Gender genderEnum = Gender.valueOf(gender.toUpperCase());
            forms = reductionFormRepo.findByCurrentStatusAndStudentDetailsGenderAndIsActiveTrue(FormStatus.PendingWarden, genderEnum);
        } else if (year != null) {
            // Only year filter
            forms = reductionFormRepo.findByCurrentStatusAndYearAndIsActiveTrue(FormStatus.PendingWarden, year);
        } else {
            // No filters - use existing logic based on warden year
            forms = (wardenYear == null)
                    ? reductionFormRepo.findByCurrentStatusAndIsActiveTrue(FormStatus.PendingWarden)
                    : reductionFormRepo.findByCurrentStatusAndYearAndIsActiveTrue(FormStatus.PendingWarden, wardenYear);
        }

        return forms.stream()
                .filter(this::canAccessApprovedForm)
                .map(ReductionFormMapper::mapToReductionFormResDTO)
                .toList();
    }

    public List<ReductionFormResDTO> deputyWardenPendingStatus(String userName) {
        autoDeactivateAllExpiredForms();
        validateDeputyWardenUser(userName);
        List<ReductionForm> forms = reductionFormRepo.findByCurrentStatusAndAssignedDeputyWardenAndIsActiveTrue(FormStatus.PendingDeputyWarden, userName);
        return forms.stream()
                .filter(this::canAccessApprovedForm)
                .map(ReductionFormMapper::mapToReductionFormResDTO)
                .toList();
    }

    public List<ReductionFormResDTO> officePendingStatus(String userName, String gender, Integer year) {
        autoDeactivateAllExpiredForms();
        validateOfficeUser(userName);
        List<ReductionForm> forms;

        // Apply filters based on parameters
        if (gender != null && !gender.isEmpty() && year != null) {
            // Both gender and year filters
            Gender genderEnum = Gender.valueOf(gender.toUpperCase());
            forms = reductionFormRepo.findByCurrentStatusAndYearAndStudentDetailsGenderAndIsActiveTrue(FormStatus.PendingOffice, year, genderEnum);
        } else if (gender != null && !gender.isEmpty()) {
            // Only gender filter
            Gender genderEnum = Gender.valueOf(gender.toUpperCase());
            forms = reductionFormRepo.findByCurrentStatusAndStudentDetailsGenderAndIsActiveTrue(FormStatus.PendingOffice, genderEnum);
        } else if (year != null) {
            // Only year filter
            forms = reductionFormRepo.findByCurrentStatusAndYearAndIsActiveTrue(FormStatus.PendingOffice, year);
        } else {
            // No filters - return all
            forms = reductionFormRepo.findByCurrentStatusAndIsActiveTrue(FormStatus.PendingOffice);
        }

        return forms.stream()
                .filter(this::canAccessApprovedForm)
                .map(ReductionFormMapper::mapToReductionFormResDTO)
                .toList();
    }

    public void updateWardenPendingStatus(Long formId, String action, String userName) {
        Integer year = resolveWardenYear(userName);
        validateApproveAction(action, "Use the dedicated reject endpoint with a rejectReason to reject a form");
        ReductionForm form = getFormOrThrow(formId);
        validateCurrentStatus(form, FormStatus.PendingWarden, "Form is not in warden stage");
        validateWardenYear(form, year);
        FormStatus previousStatus = form.getCurrentStatus();
        form.setCurrentStatus(FormStatus.PendingOffice);
        reductionFormRepo.save(form);
        saveFormHistory(form, "Approved by Warden", previousStatus, FormStatus.PendingOffice, userName, null);
        createActivityLog(form, Role.Warden, userName, "Approved");
        
        log.info("Warden manual approval completed");
        
        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Your request has been approved by Warden.", "APPROVED", form.getFormId());
        if (form.getStudentDetails().getPhoneNo() != null) {
            // WhatsApp message will be sent by batch scheduler
        }
        
        sendWorkflowNotifications(form);
    }




    public void updateDeputyWardenPendingStatus(Long formId, String action, String userName) {
        validateDeputyWardenUser(userName);
        validateApproveAction(action, "Use the dedicated reject endpoint with a rejectReason to reject a form");
        ReductionForm form = getFormOrThrow(formId);
        validateCurrentStatus(form, FormStatus.PendingDeputyWarden, "Form is not in deputy warden stage");
        validateAssignedDeputyWarden(form, userName);
        FormStatus previousStatus = form.getCurrentStatus();
        form.setCurrentStatus(FormStatus.PendingWarden);
        reductionFormRepo.save(form);
        saveFormHistory(form, "Approved by Deputy Warden", previousStatus, FormStatus.PendingWarden, userName, null);
        createActivityLog(form, Role.DeputyWarden, userName, "Approved");
        
        log.info("Deputy Warden manual approval completed");
        
        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Your request has been approved by Deputy Warden.", "APPROVED", form.getFormId());
        if (form.getStudentDetails().getPhoneNo() != null) {
            // WhatsApp message will be sent by batch scheduler
        }
        
        processAutoAcceptIfApplicable(form);
        
        sendWorkflowNotifications(form);
    }

    public void updateOfficePendingStatus(Long formId, String action, String userName) {
        validateOfficeUser(userName);
        validateApproveAction(action, "Use the dedicated reject endpoint with a rejectReason to reject a form");
        ReductionForm form = getFormOrThrow(formId);
        validateCurrentStatus(form, FormStatus.PendingOffice, "Form is not in office stage");
        FormStatus previousStatus = form.getCurrentStatus();
        form.setCurrentStatus(FormStatus.Approved);
        reductionFormRepo.save(form);
        saveFormHistory(form, "Approved by Office", previousStatus, FormStatus.Approved, userName, null);
        createActivityLog(form, Role.Office, userName, "Approved");
        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Your request has been approved.", "APPROVED", form.getFormId());
        if (form.getStudentDetails().getPhoneNo() != null) {
            // WhatsApp message will be sent by batch scheduler
        }
    }

    public void rejectWardenForm(Long formId, String rejectReason, String userName) {
        Integer year = resolveWardenYear(userName);
        validateRejectReason(rejectReason);
        ReductionForm form = getFormOrThrow(formId);
        validateCurrentStatus(form, FormStatus.PendingWarden, "Form is not in warden stage");
        validateWardenYear(form, year);
        FormStatus previousStatus = form.getCurrentStatus();
        form.setCurrentStatus(FormStatus.RejectedWarden);
        form.setRejectReason(rejectReason.trim());
        reductionFormRepo.save(form);
        restoreSubmissionCountIfSubmittedToday(form.getStudentDetails(), form);
        saveFormHistory(form, "Rejected by Warden", previousStatus, FormStatus.RejectedWarden, userName, rejectReason.trim());
        createActivityLog(form, Role.Warden, userName, "Rejected");
        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Your request was rejected.\nReason:\n" + rejectReason.trim(), "REJECTED", form.getFormId());
        if (form.getStudentDetails().getPhoneNo() != null) {
            // WhatsApp message will be sent by batch scheduler
        }
    }

    public void rejectDeputyWardenForm(Long formId, String rejectReason, String userName) {
        validateDeputyWardenUser(userName);
        validateRejectReason(rejectReason);
        ReductionForm form = getFormOrThrow(formId);
        validateCurrentStatus(form, FormStatus.PendingDeputyWarden, "Form is not in deputy warden stage");
        validateAssignedDeputyWarden(form, userName);
        FormStatus previousStatus = form.getCurrentStatus();
        form.setCurrentStatus(FormStatus.RejectedDeputyWarden);
        form.setRejectReason(rejectReason.trim());
        reductionFormRepo.save(form);
        restoreSubmissionCountIfSubmittedToday(form.getStudentDetails(), form);
        saveFormHistory(form, "Rejected by Deputy Warden", previousStatus, FormStatus.RejectedDeputyWarden, userName, rejectReason.trim());
        createActivityLog(form, Role.DeputyWarden, userName, "Rejected");
        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Your request was rejected.\nReason:\n" + rejectReason.trim(), "REJECTED", form.getFormId());
        if (form.getStudentDetails().getPhoneNo() != null) {
            // WhatsApp message will be sent by batch scheduler
        }
    }

    public void rejectOfficeForm(Long formId, String rejectReason, String userName) {
        validateOfficeUser(userName);
        validateRejectReason(rejectReason);
        ReductionForm form = getFormOrThrow(formId);
        validateCurrentStatus(form, FormStatus.PendingOffice, "Form is not in office stage");
        FormStatus previousStatus = form.getCurrentStatus();
        form.setCurrentStatus(FormStatus.RejectedOffice);
        form.setRejectReason(rejectReason.trim());
        reductionFormRepo.save(form);
        restoreSubmissionCountIfSubmittedToday(form.getStudentDetails(), form);
        saveFormHistory(form, "Rejected by Office", previousStatus, FormStatus.RejectedOffice, userName, rejectReason.trim());
        createActivityLog(form, Role.Office, userName, "Rejected");
        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Your request was rejected.\nReason:\n" + rejectReason.trim(), "REJECTED", form.getFormId());
        if (form.getStudentDetails().getPhoneNo() != null) {
            // WhatsApp message will be sent by batch scheduler
        }
    }

    private StaffDashboardCountDTO buildDashboardCountDTO(List<Object[]> statusCounts) {
        Map<FormStatus, Long> map = statusCounts.stream()
                .filter(row -> row[0] != null && row[1] != null)
                .collect(Collectors.toMap(
                        row -> (FormStatus) row[0],
                        row -> (Long) row[1],
                        (a, b) -> a
                ));
        return new StaffDashboardCountDTO(
                map.getOrDefault(FormStatus.PendingWarden, 0L),
                map.getOrDefault(FormStatus.PendingDeputyWarden, 0L),
                map.getOrDefault(FormStatus.PendingOffice, 0L),
                map.getOrDefault(FormStatus.Approved, 0L),
                map.getOrDefault(FormStatus.RejectedWarden, 0L),
                map.getOrDefault(FormStatus.RejectedDeputyWarden, 0L),
                map.getOrDefault(FormStatus.RejectedOffice, 0L)
        );
    }

    public StaffDashboardCountDTO getDashboardCount() {
        return buildDashboardCountDTO(reductionFormRepo.countGroupByStatus());
    }

    public StaffDashboardCountDTO getDashboardCountForWarden(String userName) {
        Integer year = resolveWardenYear(userName);
        if (year == null) {
            return getDashboardCount();
        }
        return buildDashboardCountDTO(reductionFormRepo.countGroupByStatusAndYear(year));
    }

    public StaffDashboardCountDTO getDashboardCountForDeputy(String userName) {
        validateDeputyWardenUser(userName);
        return buildDashboardCountDTO(reductionFormRepo.countGroupByStatusAndDeputy(userName));
    }

    public YearWiseCountDTO deputyWardenYearWiseCount(String userName) {
        validateDeputyWardenUser(userName);
        int assignedYear = resolveDeputyWardenYear(userName);
        return new YearWiseCountDTO(
                assignedYear == 1 ? reductionFormRepo.countByAssignedDeputyWardenAndIsActiveTrue(userName) : 0L,
                assignedYear == 2 ? reductionFormRepo.countByAssignedDeputyWardenAndIsActiveTrue(userName) : 0L,
                assignedYear == 3 ? reductionFormRepo.countByAssignedDeputyWardenAndIsActiveTrue(userName) : 0L,
                assignedYear == 4 ? reductionFormRepo.countByAssignedDeputyWardenAndIsActiveTrue(userName) : 0L
        );
    }

    public YearWiseCountDTO officeYearWiseCount() {
        return new YearWiseCountDTO(
                reductionFormRepo.countByCurrentStatusAndYearAndIsActiveTrue(FormStatus.PendingOffice, 1),
                reductionFormRepo.countByCurrentStatusAndYearAndIsActiveTrue(FormStatus.PendingOffice, 2),
                reductionFormRepo.countByCurrentStatusAndYearAndIsActiveTrue(FormStatus.PendingOffice, 3),
                reductionFormRepo.countByCurrentStatusAndYearAndIsActiveTrue(FormStatus.PendingOffice, 4)
        );
    }

    public void updateWardenBulkStatus(List<Long> formIds, String action, String userName) {
        long start = System.nanoTime();
        validateBulkRequest(formIds);
        validateApproveAction(action, "Bulk rejection is not supported. Use the individual reject endpoint with a rejectReason.");
        Integer year = resolveWardenYear(userName);

        List<Long> distinctIds = formIds.stream().filter(Objects::nonNull).distinct().toList();
        if (distinctIds.isEmpty()) {
            throw new BadRequestException("Form ID list cannot be empty");
        }

        // Single eager fetch with studentDetails (Zero N+1)
        long fetchStart = System.nanoTime();
        List<ReductionForm> forms = reductionFormRepo.findByFormIdIn(distinctIds);
        long fetchDurationMs = (System.nanoTime() - fetchStart) / 1_000_000;
        if (forms.isEmpty()) {
            throw new ReductionFormNotFoundException("No forms found for the provided IDs");
        }
        if (forms.size() != distinctIds.size()) {
            throw new ReductionFormNotFoundException("Some form IDs were not found for the provided IDs");
        }

        List<Long> validFormIds = new ArrayList<>();
        List<ReductionFormHistory> histories = new ArrayList<>();
        List<ActivityLogRequest> activityLogs = new ArrayList<>();
        List<NotificationService.BatchNotificationItem> notificationItems = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        List<StaffUsers> officeUsers = staffUsersRepo.findByRole(Role.Office);

        for (ReductionForm form : forms) {
            if (!form.isActive() || form.getCurrentStatus() != FormStatus.PendingWarden) {
                continue;
            }
            if (year != null && !Objects.equals(form.getYear(), year)) {
                continue;
            }
            FormStatus previousStatus = form.getCurrentStatus();
            validFormIds.add(form.getFormId());

            ReductionFormHistory history = new ReductionFormHistory();
            history.setReductionForm(form);
            history.setFromStatus(previousStatus);
            history.setToStatus(FormStatus.PendingOffice);
            history.setEventType("Approved by Warden (Bulk)");
            history.setPerformedBy(userName);
            history.setEventTimestamp(now);
            histories.add(history);

            ActivityLogRequest activityLogRequest = new ActivityLogRequest();
            activityLogRequest.setFormId(form.getFormId());
            StudentDetails studentDetails = form.getStudentDetails();
            if (studentDetails != null) {
                activityLogRequest.setStudentId(studentDetails.getStudentId());
                activityLogRequest.setStudentName(studentDetails.getName());
                activityLogRequest.setDepartment(studentDetails.getDepartment());
                notificationItems.add(new NotificationService.BatchNotificationItem(
                    studentDetails.getEmailId(), "Your request has been approved by Warden.", "APPROVED", form.getFormId(), "STUDENT"
                ));
            }
            activityLogRequest.setStaffRole(Role.Warden);
            activityLogRequest.setStaffName(userName);
            activityLogRequest.setAction("Approved");
            activityLogRequest.setArrivalDate(form.getArrivalDate());
            activityLogRequest.setYear(form.getYear());
            activityLogs.add(activityLogRequest);

            for (StaffUsers office : officeUsers) {
                notificationItems.add(new NotificationService.BatchNotificationItem(
                    office.getUserName(), "New request pending for approval.", "NORMAL_REQUEST", form.getFormId(), "Office"
                ));
            }
        }

        if (!validFormIds.isEmpty()) {
            // Database-level conditional set-based BULK UPDATE
            long updateStart = System.nanoTime();
            int updatedRows = (year != null)
                ? reductionFormRepo.bulkUpdateWardenStatusWithYear(validFormIds, FormStatus.PendingWarden, FormStatus.PendingOffice, year)
                : reductionFormRepo.bulkUpdateWardenStatusAllYears(validFormIds, FormStatus.PendingWarden, FormStatus.PendingOffice);
            long updateDurationMs = (System.nanoTime() - updateStart) / 1_000_000;
            if (updatedRows < validFormIds.size()) {
                log.warn("Warden Bulk Approval concurrency discrepancy: expected {} updates but only {} rows updated. Some forms may have been concurrently processed.",
                        validFormIds.size(), updatedRows);
            }

            // Batch persistence for histories, activity logs, and in-app notifications (utilizing JDBC batching)
            long batchInsertStart = System.nanoTime();
            reductionFormHistoryRepo.saveAll(histories);
            activityLogService.createLogs(activityLogs);
            notificationService.createNotificationsBatch(notificationItems);
            long batchInsertDurationMs = (System.nanoTime() - batchInsertStart) / 1_000_000;

            long totalDurationMs = (System.nanoTime() - start) / 1_000_000;
            log.info("Warden Bulk Approval Performance [Total: {} ms]: fetch={} ms, bulkUpdate={} ms ({} rows), batchInserts={} ms ({} histories, {} logs, {} notifications)",
                    totalDurationMs, fetchDurationMs, updateDurationMs, updatedRows, batchInsertDurationMs, histories.size(), activityLogs.size(), notificationItems.size());
        }
    }

    public void updateDeputyWardenPendingBulkStatus(List<Long> formIds, String action, String userName) {
        long start = System.nanoTime();
        validateBulkRequest(formIds);
        validateDeputyWardenUser(userName);
        validateApproveAction(action, "Bulk rejection is not supported. Use the individual reject endpoint with a rejectReason.");

        List<Long> distinctIds = formIds.stream().filter(Objects::nonNull).distinct().toList();
        if (distinctIds.isEmpty()) {
            throw new BadRequestException("Form ID list cannot be empty");
        }

        // Single eager fetch with studentDetails (Zero N+1)
        long fetchStart = System.nanoTime();
        List<ReductionForm> forms = reductionFormRepo.findByFormIdIn(distinctIds);
        long fetchDurationMs = (System.nanoTime() - fetchStart) / 1_000_000;
        if (forms.isEmpty()) {
            throw new ReductionFormNotFoundException("No forms found for the provided IDs");
        }
        if (forms.size() != distinctIds.size()) {
            throw new ReductionFormNotFoundException("Some form IDs were not found for the provided IDs");
        }

        List<Long> validFormIds = new ArrayList<>();
        List<ReductionFormHistory> histories = new ArrayList<>();
        List<ActivityLogRequest> activityLogs = new ArrayList<>();
        List<NotificationService.BatchNotificationItem> notificationItems = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        List<StaffUsers> wardens = staffUsersRepo.findByRole(Role.Warden);

        for (ReductionForm form : forms) {
            if (!form.isActive() || form.getCurrentStatus() != FormStatus.PendingDeputyWarden) {
                continue;
            }
            if (!Objects.equals(form.getAssignedDeputyWarden(), userName)) {
                continue;
            }
            FormStatus previousStatus = form.getCurrentStatus();
            validFormIds.add(form.getFormId());

            ReductionFormHistory history = new ReductionFormHistory();
            history.setReductionForm(form);
            history.setFromStatus(previousStatus);
            history.setToStatus(FormStatus.PendingWarden);
            history.setEventType("Approved by Deputy Warden (Bulk)");
            history.setPerformedBy(userName);
            history.setEventTimestamp(now);
            histories.add(history);

            ActivityLogRequest activityLogRequest = new ActivityLogRequest();
            activityLogRequest.setFormId(form.getFormId());
            StudentDetails studentDetails = form.getStudentDetails();
            if (studentDetails != null) {
                activityLogRequest.setStudentId(studentDetails.getStudentId());
                activityLogRequest.setStudentName(studentDetails.getName());
                activityLogRequest.setDepartment(studentDetails.getDepartment());
                notificationItems.add(new NotificationService.BatchNotificationItem(
                    studentDetails.getEmailId(), "Your request has been approved by Deputy Warden.", "APPROVED", form.getFormId(), "STUDENT"
                ));
            }
            activityLogRequest.setStaffRole(Role.DeputyWarden);
            activityLogRequest.setStaffName(userName);
            activityLogRequest.setAction("Approved");
            activityLogRequest.setArrivalDate(form.getArrivalDate());
            activityLogRequest.setYear(form.getYear());
            activityLogs.add(activityLogRequest);

            for (StaffUsers warden : wardens) {
                if ("warden".equals(warden.getUserName()) || ("warden" + form.getYear()).equals(warden.getUserName())) {
                    notificationItems.add(new NotificationService.BatchNotificationItem(
                        warden.getUserName(), "New Mess Reduction Request Pending.", "NORMAL_REQUEST", form.getFormId(), "Warden"
                    ));
                }
            }
        }

        if (!validFormIds.isEmpty()) {
            // Database-level conditional set-based BULK UPDATE
            long updateStart = System.nanoTime();
            int updatedRows = reductionFormRepo.bulkUpdateDeputyWardenStatus(validFormIds, FormStatus.PendingDeputyWarden, FormStatus.PendingWarden, userName);
            long updateDurationMs = (System.nanoTime() - updateStart) / 1_000_000;
            if (updatedRows < validFormIds.size()) {
                log.warn("Deputy Warden Bulk Approval concurrency discrepancy: expected {} updates but only {} rows updated. Some forms may have been concurrently processed.",
                        validFormIds.size(), updatedRows);
            }

            long batchInsertStart = System.nanoTime();
            reductionFormHistoryRepo.saveAll(histories);
            activityLogService.createLogs(activityLogs);
            notificationService.createNotificationsBatch(notificationItems);
            long batchInsertDurationMs = (System.nanoTime() - batchInsertStart) / 1_000_000;

            long totalDurationMs = (System.nanoTime() - start) / 1_000_000;
            log.info("Deputy Warden Bulk Approval Performance [Total: {} ms]: fetch={} ms, bulkUpdate={} ms ({} rows), batchInserts={} ms ({} histories, {} logs, {} notifications)",
                    totalDurationMs, fetchDurationMs, updateDurationMs, updatedRows, batchInsertDurationMs, histories.size(), activityLogs.size(), notificationItems.size());
        }
    }

    public void updateOfficePendingBulkStatus(List<Long> formIds, String action, String userName) {
        long start = System.nanoTime();
        validateBulkRequest(formIds);
        validateOfficeUser(userName);
        validateApproveAction(action, "Bulk rejection is not supported. Use the individual reject endpoint with a rejectReason.");

        List<Long> distinctIds = formIds.stream().filter(Objects::nonNull).distinct().toList();
        if (distinctIds.isEmpty()) {
            throw new BadRequestException("Form ID list cannot be empty");
        }

        // Single eager fetch with studentDetails (Zero N+1)
        long fetchStart = System.nanoTime();
        List<ReductionForm> forms = reductionFormRepo.findByFormIdIn(distinctIds);
        long fetchDurationMs = (System.nanoTime() - fetchStart) / 1_000_000;
        if (forms.isEmpty()) {
            throw new ReductionFormNotFoundException("No forms found for the provided IDs");
        }
        if (forms.size() != distinctIds.size()) {
            throw new ReductionFormNotFoundException("Some form IDs were not found for the provided IDs");
        }

        List<Long> validFormIds = new ArrayList<>();
        List<ReductionFormHistory> histories = new ArrayList<>();
        List<ActivityLogRequest> activityLogs = new ArrayList<>();
        List<NotificationService.BatchNotificationItem> notificationItems = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (ReductionForm form : forms) {
            if (!form.isActive() || form.getCurrentStatus() != FormStatus.PendingOffice) {
                continue;
            }
            FormStatus previousStatus = form.getCurrentStatus();
            validFormIds.add(form.getFormId());

            ReductionFormHistory history = new ReductionFormHistory();
            history.setReductionForm(form);
            history.setFromStatus(previousStatus);
            history.setToStatus(FormStatus.Approved);
            history.setEventType("Approved by Office (Bulk)");
            history.setPerformedBy(userName);
            history.setEventTimestamp(now);
            histories.add(history);

            ActivityLogRequest activityLogRequest = new ActivityLogRequest();
            activityLogRequest.setFormId(form.getFormId());
            StudentDetails studentDetails = form.getStudentDetails();
            if (studentDetails != null) {
                activityLogRequest.setStudentId(studentDetails.getStudentId());
                activityLogRequest.setStudentName(studentDetails.getName());
                activityLogRequest.setDepartment(studentDetails.getDepartment());
                notificationItems.add(new NotificationService.BatchNotificationItem(
                    studentDetails.getEmailId(), "Your request has been approved.", "APPROVED", form.getFormId(), "STUDENT"
                ));
            }
            activityLogRequest.setStaffRole(Role.Office);
            activityLogRequest.setStaffName(userName);
            activityLogRequest.setAction("Approved");
            activityLogRequest.setArrivalDate(form.getArrivalDate());
            activityLogRequest.setYear(form.getYear());
            activityLogs.add(activityLogRequest);
        }

        if (!validFormIds.isEmpty()) {
            // Database-level conditional set-based BULK UPDATE
            long updateStart = System.nanoTime();
            int updatedRows = reductionFormRepo.bulkUpdateOfficeStatus(validFormIds, FormStatus.PendingOffice, FormStatus.Approved);
            long updateDurationMs = (System.nanoTime() - updateStart) / 1_000_000;
            if (updatedRows < validFormIds.size()) {
                log.warn("Office Bulk Approval concurrency discrepancy: expected {} updates but only {} rows updated. Some forms may have been concurrently processed.",
                        validFormIds.size(), updatedRows);
            }

            long batchInsertStart = System.nanoTime();
            reductionFormHistoryRepo.saveAll(histories);
            activityLogService.createLogs(activityLogs);
            notificationService.createNotificationsBatch(notificationItems);
            long batchInsertDurationMs = (System.nanoTime() - batchInsertStart) / 1_000_000;

            long totalDurationMs = (System.nanoTime() - start) / 1_000_000;
            log.info("Office Bulk Approval Performance [Total: {} ms]: fetch={} ms, bulkUpdate={} ms ({} rows), batchInserts={} ms ({} histories, {} logs, {} notifications)",
                    totalDurationMs, fetchDurationMs, updateDurationMs, updatedRows, batchInsertDurationMs, histories.size(), activityLogs.size(), notificationItems.size());
        }
    }

    public BulkRejectSummaryDTO rejectWardenBulk(List<Long> formIds, String rejectReason, String userName) {
        long start = System.nanoTime();
        validateBulkRequest(formIds);
        validateRejectReason(rejectReason);
        Integer year = resolveWardenYear(userName);

        List<Long> distinctIds = formIds.stream().filter(Objects::nonNull).distinct().toList();
        long fetchStart = System.nanoTime();
        List<ReductionForm> forms = reductionFormRepo.findByFormIdIn(distinctIds);
        long fetchDurationMs = (System.nanoTime() - fetchStart) / 1_000_000;
        Map<Long, ReductionForm> formMap = forms.stream().collect(Collectors.toMap(ReductionForm::getFormId, f -> f, (a, b) -> a));

        int selected = formIds.size();
        int rejected = 0;
        int failed = 0;

        List<Long> rejectedFormIds = new ArrayList<>();
        List<ReductionFormHistory> histories = new ArrayList<>();
        List<ActivityLogRequest> activityLogs = new ArrayList<>();
        List<NotificationService.BatchNotificationItem> notificationItems = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        String trimmedReason = rejectReason.trim();

        for (Long formId : formIds) {
            if (formId == null) {
                failed++;
                continue;
            }
            ReductionForm form = formMap.get(formId);
            if (form == null || !form.isActive() || form.getCurrentStatus() != FormStatus.PendingWarden) {
                failed++;
                continue;
            }
            if (year != null && !Objects.equals(form.getYear(), year)) {
                failed++;
                continue;
            }

            FormStatus previousStatus = form.getCurrentStatus();
            rejectedFormIds.add(form.getFormId());
            restoreSubmissionCountIfSubmittedToday(form.getStudentDetails(), form);

            ReductionFormHistory history = new ReductionFormHistory();
            history.setReductionForm(form);
            history.setFromStatus(previousStatus);
            history.setToStatus(FormStatus.RejectedWarden);
            history.setEventType("Rejected by Warden (Bulk)");
            history.setPerformedBy(userName);
            history.setComment(trimmedReason);
            history.setEventTimestamp(now);
            histories.add(history);

            ActivityLogRequest activityLogRequest = new ActivityLogRequest();
            activityLogRequest.setFormId(form.getFormId());
            StudentDetails studentDetails = form.getStudentDetails();
            if (studentDetails != null) {
                activityLogRequest.setStudentId(studentDetails.getStudentId());
                activityLogRequest.setStudentName(studentDetails.getName());
                activityLogRequest.setDepartment(studentDetails.getDepartment());
                notificationItems.add(new NotificationService.BatchNotificationItem(
                    studentDetails.getEmailId(), "Your request was rejected.\nReason:\n" + trimmedReason, "REJECTED", form.getFormId(), "STUDENT"
                ));
            }
            activityLogRequest.setStaffRole(Role.Warden);
            activityLogRequest.setStaffName(userName);
            activityLogRequest.setAction("Rejected");
            activityLogRequest.setArrivalDate(form.getArrivalDate());
            activityLogRequest.setYear(form.getYear());
            activityLogs.add(activityLogRequest);

            rejected++;
        }

        if (!rejectedFormIds.isEmpty()) {
            // Database-level conditional set-based BULK REJECT
            long updateStart = System.nanoTime();
            int updatedRows = (year != null)
                ? reductionFormRepo.bulkRejectWardenStatusWithYear(rejectedFormIds, FormStatus.PendingWarden, FormStatus.RejectedWarden, trimmedReason, year)
                : reductionFormRepo.bulkRejectWardenStatusAllYears(rejectedFormIds, FormStatus.PendingWarden, FormStatus.RejectedWarden, trimmedReason);
            long updateDurationMs = (System.nanoTime() - updateStart) / 1_000_000;

            long batchInsertStart = System.nanoTime();
            reductionFormHistoryRepo.saveAll(histories);
            activityLogService.createLogs(activityLogs);
            notificationService.createNotificationsBatch(notificationItems);
            long batchInsertDurationMs = (System.nanoTime() - batchInsertStart) / 1_000_000;

            long totalDurationMs = (System.nanoTime() - start) / 1_000_000;
            log.info("Warden Bulk Reject Performance [Total: {} ms]: fetch={} ms, bulkReject={} ms ({} rows), batchInserts={} ms ({} histories, {} logs, {} notifications), selected={}, rejected={}, failed={}",
                    totalDurationMs, fetchDurationMs, updateDurationMs, updatedRows, batchInsertDurationMs, histories.size(), activityLogs.size(), notificationItems.size(), selected, rejected, failed);
        }

        return new BulkRejectSummaryDTO(selected, rejected, failed);
    }

    public BulkRejectSummaryDTO rejectDeputyWardenBulk(List<Long> formIds, String rejectReason, String userName) {
        long start = System.nanoTime();
        validateBulkRequest(formIds);
        validateRejectReason(rejectReason);
        validateDeputyWardenUser(userName);

        List<Long> distinctIds = formIds.stream().filter(Objects::nonNull).distinct().toList();
        long fetchStart = System.nanoTime();
        List<ReductionForm> forms = reductionFormRepo.findByFormIdIn(distinctIds);
        long fetchDurationMs = (System.nanoTime() - fetchStart) / 1_000_000;
        Map<Long, ReductionForm> formMap = forms.stream().collect(Collectors.toMap(ReductionForm::getFormId, f -> f, (a, b) -> a));

        int selected = formIds.size();
        int rejected = 0;
        int failed = 0;

        List<Long> rejectedFormIds = new ArrayList<>();
        List<ReductionFormHistory> histories = new ArrayList<>();
        List<ActivityLogRequest> activityLogs = new ArrayList<>();
        List<NotificationService.BatchNotificationItem> notificationItems = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        String trimmedReason = rejectReason.trim();

        for (Long formId : formIds) {
            if (formId == null) {
                failed++;
                continue;
            }
            ReductionForm form = formMap.get(formId);
            if (form == null || !form.isActive() || form.getCurrentStatus() != FormStatus.PendingDeputyWarden) {
                failed++;
                continue;
            }
            if (!Objects.equals(form.getAssignedDeputyWarden(), userName)) {
                failed++;
                continue;
            }

            FormStatus previousStatus = form.getCurrentStatus();
            rejectedFormIds.add(form.getFormId());
            restoreSubmissionCountIfSubmittedToday(form.getStudentDetails(), form);

            ReductionFormHistory history = new ReductionFormHistory();
            history.setReductionForm(form);
            history.setFromStatus(previousStatus);
            history.setToStatus(FormStatus.RejectedDeputyWarden);
            history.setEventType("Rejected by Deputy Warden (Bulk)");
            history.setPerformedBy(userName);
            history.setComment(trimmedReason);
            history.setEventTimestamp(now);
            histories.add(history);

            ActivityLogRequest activityLogRequest = new ActivityLogRequest();
            activityLogRequest.setFormId(form.getFormId());
            StudentDetails studentDetails = form.getStudentDetails();
            if (studentDetails != null) {
                activityLogRequest.setStudentId(studentDetails.getStudentId());
                activityLogRequest.setStudentName(studentDetails.getName());
                activityLogRequest.setDepartment(studentDetails.getDepartment());
                notificationItems.add(new NotificationService.BatchNotificationItem(
                    studentDetails.getEmailId(), "Your request was rejected.\nReason:\n" + trimmedReason, "REJECTED", form.getFormId(), "STUDENT"
                ));
            }
            activityLogRequest.setStaffRole(Role.DeputyWarden);
            activityLogRequest.setStaffName(userName);
            activityLogRequest.setAction("Rejected");
            activityLogRequest.setArrivalDate(form.getArrivalDate());
            activityLogRequest.setYear(form.getYear());
            activityLogs.add(activityLogRequest);

            rejected++;
        }

        if (!rejectedFormIds.isEmpty()) {
            // Database-level conditional set-based BULK REJECT
            long updateStart = System.nanoTime();
            int updatedRows = reductionFormRepo.bulkRejectDeputyWardenStatus(rejectedFormIds, FormStatus.PendingDeputyWarden, FormStatus.RejectedDeputyWarden, trimmedReason, userName);
            long updateDurationMs = (System.nanoTime() - updateStart) / 1_000_000;

            long batchInsertStart = System.nanoTime();
            reductionFormHistoryRepo.saveAll(histories);
            activityLogService.createLogs(activityLogs);
            notificationService.createNotificationsBatch(notificationItems);
            long batchInsertDurationMs = (System.nanoTime() - batchInsertStart) / 1_000_000;

            long totalDurationMs = (System.nanoTime() - start) / 1_000_000;
            log.info("Deputy Warden Bulk Reject Performance [Total: {} ms]: fetch={} ms, bulkReject={} ms ({} rows), batchInserts={} ms ({} histories, {} logs, {} notifications), selected={}, rejected={}, failed={}",
                    totalDurationMs, fetchDurationMs, updateDurationMs, updatedRows, batchInsertDurationMs, histories.size(), activityLogs.size(), notificationItems.size(), selected, rejected, failed);
        }

        return new BulkRejectSummaryDTO(selected, rejected, failed);
    }

    public BulkRejectSummaryDTO rejectOfficeBulk(List<Long> formIds, String rejectReason, String userName) {
        long start = System.nanoTime();
        validateBulkRequest(formIds);
        validateRejectReason(rejectReason);
        validateOfficeUser(userName);

        List<Long> distinctIds = formIds.stream().filter(Objects::nonNull).distinct().toList();
        long fetchStart = System.nanoTime();
        List<ReductionForm> forms = reductionFormRepo.findByFormIdIn(distinctIds);
        long fetchDurationMs = (System.nanoTime() - fetchStart) / 1_000_000;
        Map<Long, ReductionForm> formMap = forms.stream().collect(Collectors.toMap(ReductionForm::getFormId, f -> f, (a, b) -> a));

        int selected = formIds.size();
        int rejected = 0;
        int failed = 0;

        List<Long> rejectedFormIds = new ArrayList<>();
        List<ReductionFormHistory> histories = new ArrayList<>();
        List<ActivityLogRequest> activityLogs = new ArrayList<>();
        List<NotificationService.BatchNotificationItem> notificationItems = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        String trimmedReason = rejectReason.trim();

        for (Long formId : formIds) {
            if (formId == null) {
                failed++;
                continue;
            }
            ReductionForm form = formMap.get(formId);
            if (form == null || !form.isActive() || form.getCurrentStatus() != FormStatus.PendingOffice) {
                failed++;
                continue;
            }

            FormStatus previousStatus = form.getCurrentStatus();
            rejectedFormIds.add(form.getFormId());
            restoreSubmissionCountIfSubmittedToday(form.getStudentDetails(), form);

            ReductionFormHistory history = new ReductionFormHistory();
            history.setReductionForm(form);
            history.setFromStatus(previousStatus);
            history.setToStatus(FormStatus.RejectedOffice);
            history.setEventType("Rejected by Office (Bulk)");
            history.setPerformedBy(userName);
            history.setComment(trimmedReason);
            history.setEventTimestamp(now);
            histories.add(history);

            ActivityLogRequest activityLogRequest = new ActivityLogRequest();
            activityLogRequest.setFormId(form.getFormId());
            StudentDetails studentDetails = form.getStudentDetails();
            if (studentDetails != null) {
                activityLogRequest.setStudentId(studentDetails.getStudentId());
                activityLogRequest.setStudentName(studentDetails.getName());
                activityLogRequest.setDepartment(studentDetails.getDepartment());
                notificationItems.add(new NotificationService.BatchNotificationItem(
                    studentDetails.getEmailId(), "Your request was rejected.\nReason:\n" + trimmedReason, "REJECTED", form.getFormId(), "STUDENT"
                ));
            }
            activityLogRequest.setStaffRole(Role.Office);
            activityLogRequest.setStaffName(userName);
            activityLogRequest.setAction("Rejected");
            activityLogRequest.setArrivalDate(form.getArrivalDate());
            activityLogRequest.setYear(form.getYear());
            activityLogs.add(activityLogRequest);

            rejected++;
        }

        if (!rejectedFormIds.isEmpty()) {
            // Database-level conditional set-based BULK REJECT
            long updateStart = System.nanoTime();
            int updatedRows = reductionFormRepo.bulkRejectOfficeStatus(rejectedFormIds, FormStatus.PendingOffice, FormStatus.RejectedOffice, trimmedReason);
            long updateDurationMs = (System.nanoTime() - updateStart) / 1_000_000;

            long batchInsertStart = System.nanoTime();
            reductionFormHistoryRepo.saveAll(histories);
            activityLogService.createLogs(activityLogs);
            notificationService.createNotificationsBatch(notificationItems);
            long batchInsertDurationMs = (System.nanoTime() - batchInsertStart) / 1_000_000;

            long totalDurationMs = (System.nanoTime() - start) / 1_000_000;
            log.info("Office Bulk Reject Performance [Total: {} ms]: fetch={} ms, bulkReject={} ms ({} rows), batchInserts={} ms ({} histories, {} logs, {} notifications), selected={}, rejected={}, failed={}",
                    totalDurationMs, fetchDurationMs, updateDurationMs, updatedRows, batchInsertDurationMs, histories.size(), activityLogs.size(), notificationItems.size(), selected, rejected, failed);
        }

        return new BulkRejectSummaryDTO(selected, rejected, failed);
    }

    private void saveFormHistory(ReductionForm form, String eventType, FormStatus fromStatus, FormStatus toStatus, String performedBy, String comment) {
        ReductionFormHistory history = new ReductionFormHistory();
        history.setReductionForm(form);
        history.setFromStatus(fromStatus);
        history.setToStatus(toStatus);
        history.setEventType(eventType);
        history.setPerformedBy(performedBy);
        history.setComment(comment);
        history.setEventTimestamp(LocalDateTime.now());
        reductionFormHistoryRepo.save(history);
    }

    private void createActivityLog(ReductionForm form, Role staffRole, String staffName, String action) {
        ActivityLogRequest activityLogRequest = new ActivityLogRequest();
        activityLogRequest.setFormId(form.getFormId());
        StudentDetails studentDetails = form.getStudentDetails();
        if (studentDetails != null) {
            activityLogRequest.setStudentId(studentDetails.getStudentId());
            activityLogRequest.setStudentName(studentDetails.getName());
            activityLogRequest.setDepartment(studentDetails.getDepartment());
        }
        activityLogRequest.setStaffRole(staffRole);
        activityLogRequest.setStaffName(staffName);
        activityLogRequest.setAction(action);
        activityLogRequest.setArrivalDate(form.getArrivalDate());
        activityLogRequest.setYear(form.getYear());
        activityLogService.createLog(activityLogRequest);
    }

    private ReductionFormHistoryResDTO mapHistoryToDTO(ReductionFormHistory history) {
        return new ReductionFormHistoryResDTO(
                history.getId(),
                history.getReductionForm() != null ? history.getReductionForm().getFormId() : null,
                history.getFromStatus(),
                history.getToStatus(),
                history.getEventType(),
                history.getPerformedBy(),
                history.getComment(),
                history.getEventTimestamp()
        );
    }

    public void autoDeactivateAllExpiredForms() {
        LocalDateTime now = LocalDateTime.now();
        reductionFormRepo.deactivateExpiredForms(now.toLocalDate(), now.toLocalTime());
        reductionFormRepo.deactivateExpiredFormHistories();
    }

    private void checkSubmissionLimit(StudentDetails student) {
        boolean reset = student.resetSubmissionCountIfNewDay();

        int totalCount = student.getDailySubmissionCount() != null ? student.getDailySubmissionCount() : 0;
        int granted = student.getExtraSubmissionGranted() != null ? student.getExtraSubmissionGranted() : 0;
        int maxAllowed = 3 + granted;

        if (totalCount >= maxAllowed) {
            if (reset) {
                studentDetailsRepo.save(student);
            }
            throw new BadRequestException("You have reached the maximum limit of 3 mess reduction requests.\n\nIf you need another reduction request, please contact the Hostel Administration through the existing Admin Request process.");
        }

        student.setDailySubmissionCount(totalCount + 1);
        student.setLastSubmissionDate(LocalDate.now());
        studentDetailsRepo.save(student);
    }

    private void validateNewSubmission(Long studentId, ReductionFormReqDTO dto) {

        autoDeactivateAllExpiredForms();

        // 1. Validate payload first before modifying submission limit
        validateResubmitPayload(dto);

        // 2. Check if there is any active form for this student that is NOT rejected
        List<ReductionForm> activeForms = reductionFormRepo.findByStudentDetailsStudentIdAndIsActiveTrue(studentId);
        boolean hasPendingOrApproved = activeForms.stream()
                .anyMatch(form -> !isRejectedStatus(form.getCurrentStatus()));

        if (hasPendingOrApproved) {
            throw new StatusAlreadyPendingException("You already have an active mess reduction request. New requests can be submitted after your arrival date and time.");
        }

        // 3. Check and increment submission limit
        StudentDetails student = getStudentDetails(studentId);
        checkSubmissionLimit(student);
    }


    public void deleteAllReductionForms() {
        reductionFormRepo.deleteAll();
    }

    public void expireReductionForms() {
        autoDeactivateAllExpiredForms();
    }

    public void cleanUpExpiredRequests() {
        LocalDate thresholdDate = LocalDate.now().minusMonths(4);
        List<ReductionForm> toDelete = reductionFormRepo.findByArrivalDateBefore(thresholdDate);
        if (!toDelete.isEmpty()) {
            reductionFormRepo.deleteAll(toDelete);
        }
    }

    public List<ReductionFormResDTO> getOfficeReportData() {
        LocalDate today = LocalDate.now();
        LocalDate fourMonthsAgo = today.minusMonths(4);
        LocalDate futureBound = today.plusYears(5);
        List<ReductionForm> reports = reductionFormRepo.findByCurrentStatusAndLeaveDateBetweenOrderByLeaveDateAsc(
                FormStatus.Approved, fourMonthsAgo, futureBound
        );
        return reports.stream()
                .map(ReductionFormMapper::mapToReductionFormResDTO)
                .toList();
    }

    private boolean canAccessApprovedForm(ReductionForm form) {
        // If form is not approved, it can be accessed
        if (form.getCurrentStatus() != FormStatus.Approved) {
            return true;
        }

        // If form is approved, check if current date > arrival date
        // If current date > arrival date, form cannot be accessed
        LocalDate currentDate = LocalDate.now();
        return !currentDate.isAfter(form.getArrivalDate());
    }

    private void validateResubmitPayload(ReductionFormReqDTO dto) {
        if (dto.getLeaveDate().isBefore(LocalDate.now())) {
            throw new DateNotValidException("From Date cannot be before today");
        }
        if (dto.getToDate() != null && dto.getToDate().isBefore(dto.getLeaveDate())) {
            throw new DateNotValidException("To Date cannot be before From Date");
        }
        if (dto.getToDate() != null && dto.getArrivalDate().isBefore(dto.getToDate())) {
            throw new DateNotValidException("Arrival Date must be greater than or equal to To Date");
        }
        calculateTotalLeaves(dto);
    }

    private long calculateTotalLeaves(ReductionFormReqDTO dto) {
        LocalDate endDate = dto.getToDate() != null ? dto.getToDate() : dto.getArrivalDate();
        long totalDays = ChronoUnit.DAYS.between(dto.getLeaveDate(), endDate);
        if (totalDays > 3) {
            return totalDays - 3;
        }
        throw new TotalLeaveDateCountException("Leave duration must be more than 3 days to apply for mess reduction");
    }

    private void validateBulkRequest(List<Long> formIds) {
        if (formIds == null || formIds.isEmpty()) {
            throw new BadRequestException("Form ID list cannot be empty");
        }
    }

    private void validateApproveAction(String action, String rejectMessage) {
        if (action == null || action.isBlank()) {
            throw new BadRequestException("Action is required");
        }
        if (ACTION_APPROVE.equalsIgnoreCase(action)) {
            return;
        }
        if (ACTION_REJECT.equalsIgnoreCase(action)) {
            throw new InvalidActionException(rejectMessage);
        }
        throw new InvalidActionException("Invalid action");
    }

    private void validateRejectReason(String rejectReason) {
        if (rejectReason == null || rejectReason.isBlank()) {
            throw new BadRequestException("Reject reason cannot be null or empty");
        }
    }

    private ReductionForm getFormOrThrow(Long formId) {
        return reductionFormRepo.findById(formId)
                .filter(form -> form.isActive())
                .orElseThrow(() -> new ReductionFormNotFoundException("Form not found"));
    }

    private void validateCurrentStatus(ReductionForm form, FormStatus expectedStatus, String message) {
        if (!Objects.equals(form.getCurrentStatus(), expectedStatus)) {
            throw new InvalidStatusException(message);
        }
    }

    private boolean isRejectedStatus(FormStatus status) {
        return status == FormStatus.RejectedWarden || status == FormStatus.RejectedDeputyWarden || status == FormStatus.RejectedOffice;
    }

    private Integer resolveWardenYear(String userName) {
        if (userName != null) {
            Optional<StaffUsers> staffOpt = staffUsersRepo.findByUserName(userName);
            if (staffOpt.isPresent() && staffOpt.get().getRole() == Role.Warden) {
                return staffOpt.get().getYear();
            }
        }
        if ("warden".equals(userName)) {
            return null;
        }
        return switch (userName) {
            case "warden1" -> 1;
            case "warden2" -> 2;
            case "warden3" -> 3;
            case "warden4" -> 4;
            default -> throw new UnauthorizedUserException("Unauthorized user");
        };
    }

    private void validateWardenYear(ReductionForm form, Integer year) {
        if (year != null && !Objects.equals(form.getYear(), year)) {
            throw new UnauthorizedUserException("Unauthorized access");
        }
    }

    private int resolveDeputyWardenYear(String userName) {
        if (userName != null) {
            Optional<StaffUsers> staffOpt = staffUsersRepo.findByUserName(userName);
            if (staffOpt.isPresent() && staffOpt.get().getRole() == Role.DeputyWarden && staffOpt.get().getYear() != null) {
                return staffOpt.get().getYear();
            }
        }
        validateDeputyWardenUser(userName);
        if (userName != null && userName.matches("deputyWarden[1-8]")) {
            int deputyNumber = Integer.parseInt(userName.substring("deputyWarden".length()));
            return deputyNumber > 4 ? deputyNumber - 4 : deputyNumber;
        }
        return 1;
    }

    private String resolveAssignedDeputyWarden(Gender gender, Integer year) {
        if (gender == null || year == null) {
            throw new BadRequestException("Student gender and year are required for deputy warden routing");
        }
        return staffUsersRepo.findByRoleAndGenderAndYear(Role.DeputyWarden, gender, year)
                .map(StaffUsers::getUserName)
                .orElseThrow(() -> new BadRequestException("Unable to assign a deputy warden for the given gender and year"));
    }

    private void validateAssignedDeputyWarden(ReductionForm form, String userName) {
        if (!Objects.equals(form.getAssignedDeputyWarden(), userName)) {
            throw new UnauthorizedUserException("Unauthorized access");
        }
    }

    private void validateDeputyWardenUser(String userName) {
        if (userName == null) {
            throw new UnauthorizedUserException("Unauthorized user");
        }
        Optional<StaffUsers> staffOpt = staffUsersRepo.findByUserName(userName);
        if (staffOpt.isPresent() && staffOpt.get().getRole() == Role.DeputyWarden) {
            return;
        }
        if (!userName.matches("deputyWarden[1-8]")) {
            throw new UnauthorizedUserException("Unauthorized user");
        }
    }

    private void validateOfficeUser(String userName) {
        if (userName == null) {
            throw new UnauthorizedUserException("Unauthorized user");
        }
        Optional<StaffUsers> staffOpt = staffUsersRepo.findByUserName(userName);
        if (staffOpt.isPresent() && staffOpt.get().getRole() == Role.Office) {
            return;
        }
        if (!"office".equals(userName)) {
            throw new UnauthorizedUserException("Unauthorized user");
        }
    }

    public AutoAcceptSettings getAutoAcceptSettings(String username) {
        return autoAcceptSettingsRepo.findByUsername(username)
                .orElseGet(() -> {
                    AutoAcceptSettings defaultSettings = new AutoAcceptSettings();
                    defaultSettings.setUsername(username);
                    defaultSettings.setRole(username.startsWith("deputy") ? "DEPUTY_WARDEN" : "WARDEN");
                    defaultSettings.setEnabled(false);
                    defaultSettings.setFromDate(LocalDate.now());
                    defaultSettings.setToDate(LocalDate.now());
                    defaultSettings.setReason("");
                    return defaultSettings;
                });
    }

    public AutoAcceptSettings saveAutoAcceptSettings(String username, String role, AutoAcceptSettingsDTO dto) {
        AutoAcceptSettings settings = autoAcceptSettingsRepo.findByUsername(username)
                .orElse(new AutoAcceptSettings());
        
        settings.setUsername(username);
        settings.setRole(role);
        settings.setEnabled(dto.isEnabled());
        settings.setFromDate(dto.getFromDate());
        settings.setToDate(dto.getToDate());
        settings.setDepartment(dto.getDepartment());
        settings.setYear(dto.getYear());
        settings.setReason(dto.getReason());
        
        return autoAcceptSettingsRepo.save(settings);
    }

    private boolean isWithinDateRange(AutoAcceptSettings settings) {
        ZoneId systemZone = ZoneId.of("Asia/Kolkata");
        LocalDate today = LocalDate.now(systemZone);
        return !today.isBefore(settings.getFromDate()) && !today.isAfter(settings.getToDate());
    }

    private boolean isMatchingDepartmentAndYear(AutoAcceptSettings settings, ReductionForm form) {
        if (settings == null || form == null) {
            return false;
        }

        // Department check (supports multi-select comma-separated values)
        String reqDept = settings.getDepartment();
        if (reqDept != null && !reqDept.trim().isEmpty() && !"ALL".equalsIgnoreCase(reqDept.trim())) {
            String formDept = form.getStudentDetails() != null ? form.getStudentDetails().getDepartment() : null;
            if (formDept == null) {
                return false;
            }
            java.util.List<String> depts = java.util.Arrays.stream(reqDept.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
            if (!depts.isEmpty() && !depts.stream().anyMatch(d -> "ALL".equalsIgnoreCase(d) || d.equalsIgnoreCase(formDept.trim()))) {
                return false;
            }
        }

        // Year check (supports multi-select comma-separated values)
        String reqYear = settings.getYear();
        if (reqYear != null && !reqYear.trim().isEmpty() && !"ALL".equalsIgnoreCase(reqYear.trim())) {
            Integer formYear = form.getYear();
            if (formYear == null) {
                return false;
            }
            java.util.List<String> years = java.util.Arrays.stream(reqYear.split(","))
                    .map(s -> s.replaceAll("[^0-9]", "").trim())
                    .filter(s -> !s.isEmpty())
                    .toList();
            if (!years.isEmpty() && !years.stream().anyMatch(y -> "ALL".equalsIgnoreCase(y) || y.equalsIgnoreCase(String.valueOf(formYear)))) {
                return false;
            }
        }

        return true;
    }

    public void processAutoAcceptIfApplicable(ReductionForm form) {
        if (form == null || !form.isActive()) {
            return;
        }

        if (form.getCurrentStatus() == FormStatus.PendingDeputyWarden) {
            checkAndApplyAutoAcceptForDeputy(form);
        }
        
        if (form.getCurrentStatus() == FormStatus.PendingWarden) {
            checkAndApplyAutoAcceptForWarden(form);
        }
    }

    private boolean checkAndApplyAutoAcceptForDeputy(ReductionForm form) {
        String deputyWarden = form.getAssignedDeputyWarden();
        if (deputyWarden == null) {
            return false;
        }
        
        Optional<AutoAcceptSettings> settingOpt = autoAcceptSettingsRepo.findByUsername(deputyWarden);
        if (settingOpt.isEmpty()) {
            return false;
        }
        
        AutoAcceptSettings settings = settingOpt.get();
        if (!settings.isEnabled() || !isWithinDateRange(settings) || !isMatchingDepartmentAndYear(settings, form)) {
            return false;
        }
        
        log.info("Deputy Warden auto approval enabled");
        
        // Conflict resolution: Ensure form was submitted after this auto-accept setting was created
        if (form.getSubmittedAt() != null && form.getSubmittedAt().isBefore(settings.getCreatedAt())) {
            return false;
        }
        
        // Prevent duplicate auto-accept action for the same transition
        boolean alreadyTransitioned = reductionFormHistoryRepo.findByReductionFormFormIdOrderByEventTimestampAsc(form.getFormId())
                .stream()
                .anyMatch(history -> "AUTO_ACCEPT".equals(history.getEventType()) && history.getFromStatus() == FormStatus.PendingDeputyWarden);
        if (alreadyTransitioned) {
            return false;
        }
        
        // Auto Accept and transition!
        FormStatus previousStatus = form.getCurrentStatus();
        form.setCurrentStatus(FormStatus.PendingWarden);
        reductionFormRepo.save(form);
        
        log.info("Deputy Warden auto approved request");
        log.info("[AUTO_ACCEPT] DeputyWarden auto-accept triggered: user={}, formId={}, previousStatus={}", deputyWarden, form.getFormId(), previousStatus);
        
        try {
            saveFormHistory(form, "AUTO_ACCEPT", previousStatus, FormStatus.PendingWarden, "SYSTEM (Auto Accept)", "Automatically approved because Auto Accept was enabled.");
            log.info("[AUTO_ACCEPT] FormHistory saved for formId={}", form.getFormId());
        } catch (Exception e) {
            log.error("[AUTO_ACCEPT] FAILED to save FormHistory for formId={}: {}", form.getFormId(), e.getMessage(), e);
        }
        
        try {
            createActivityLog(form, Role.DeputyWarden, "SYSTEM", "Approved");
            log.info("[AUTO_ACCEPT] ActivityLog saved for formId={}, role=DeputyWarden, action=Approved", form.getFormId());
        } catch (Exception e) {
            log.error("[AUTO_ACCEPT] FAILED to save ActivityLog for formId={}: {}", form.getFormId(), e.getMessage(), e);
        }
        
        try {
            saveAuditLog(form.getFormId());
            log.info("[AUTO_ACCEPT] AuditLog saved for formId={}", form.getFormId());
        } catch (Exception e) {
            log.error("[AUTO_ACCEPT] FAILED to save AuditLog for formId={}: {}", form.getFormId(), e.getMessage(), e);
        }
        
        // WhatsApp notification will be sent by batch scheduler
        
        return true;
    }

    private boolean checkAndApplyAutoAcceptForWarden(ReductionForm form) {
        String yearWarden = "warden" + form.getYear();
        
        Optional<AutoAcceptSettings> wardenSettingOpt = autoAcceptSettingsRepo.findByUsername(yearWarden);
        if (wardenSettingOpt.isEmpty() || !wardenSettingOpt.get().isEnabled()) {
            wardenSettingOpt = autoAcceptSettingsRepo.findByUsername("warden");
        }
        
        if (wardenSettingOpt.isEmpty()) {
            return false;
        }
        
        AutoAcceptSettings settings = wardenSettingOpt.get();
        if (!settings.isEnabled() || !isWithinDateRange(settings) || !isMatchingDepartmentAndYear(settings, form)) {
            return false;
        }
        
        log.info("Warden auto approval enabled");
        
        // Conflict resolution: Ensure form was submitted after this auto-accept setting was created
        if (form.getSubmittedAt() != null && form.getSubmittedAt().isBefore(settings.getCreatedAt())) {
            return false;
        }
        
        // Prevent duplicate auto-accept action for the same transition
        boolean alreadyTransitioned = reductionFormHistoryRepo.findByReductionFormFormIdOrderByEventTimestampAsc(form.getFormId())
                .stream()
                .anyMatch(history -> "AUTO_ACCEPT".equals(history.getEventType()) && history.getFromStatus() == FormStatus.PendingWarden);
        if (alreadyTransitioned) {
            return false;
        }
        
        // Auto Accept and transition!
        FormStatus previousStatus = form.getCurrentStatus();
        form.setCurrentStatus(FormStatus.PendingOffice);
        reductionFormRepo.save(form);
        
        log.info("Warden auto approved request");
        log.info("[AUTO_ACCEPT] Warden auto-accept triggered: user={}, formId={}, previousStatus={}", settings.getUsername(), form.getFormId(), previousStatus);
        
        try {
            saveFormHistory(form, "AUTO_ACCEPT", previousStatus, FormStatus.PendingOffice, "SYSTEM (Auto Accept)", "Automatically approved because Auto Accept was enabled.");
            log.info("[AUTO_ACCEPT] FormHistory saved for formId={}", form.getFormId());
        } catch (Exception e) {
            log.error("[AUTO_ACCEPT] FAILED to save FormHistory for formId={}: {}", form.getFormId(), e.getMessage(), e);
        }
        
        try {
            createActivityLog(form, Role.Warden, "SYSTEM", "Approved");
            log.info("[AUTO_ACCEPT] ActivityLog saved for formId={}, role=Warden, action=Approved", form.getFormId());
        } catch (Exception e) {
            log.error("[AUTO_ACCEPT] FAILED to save ActivityLog for formId={}: {}", form.getFormId(), e.getMessage(), e);
        }
        
        try {
            saveAuditLog(form.getFormId());
            log.info("[AUTO_ACCEPT] AuditLog saved for formId={}", form.getFormId());
        } catch (Exception e) {
            log.error("[AUTO_ACCEPT] FAILED to save AuditLog for formId={}: {}", form.getFormId(), e.getMessage(), e);
        }
        
        // WhatsApp notification will be sent by batch scheduler
        
        return true;
    }

    private void saveAuditLog(Long formId) {
        AuditLog auditLog = new AuditLog();
        auditLog.setEventType("AUTO_ACCEPT");
        auditLog.setPerformedBy("SYSTEM");
        auditLog.setPerformedByRole("SYSTEM");
        auditLog.setFormId(formId);
        auditLog.setTimestamp(LocalDateTime.now(ZoneId.of("Asia/Kolkata")));
        auditLog.setMessage("Auto accepted due to staff availability settings");
        
        auditLogRepo.saveAndFlush(auditLog);
    }

    public void autoApplyActiveSettings() {
        List<ReductionForm> pendingForms = reductionFormRepo.findByCurrentStatusInAndIsActiveTrue(
                List.of(FormStatus.PendingDeputyWarden, FormStatus.PendingWarden)
        );
        for (ReductionForm form : pendingForms) {
            try {
                processAutoAcceptIfApplicable(form);
            } catch (Exception e) {
                log.error("Error auto-applying settings for formId={}", form.getFormId(), e);
            }
        }
    }

    public void autoDisableExpiredSettings() {
        ZoneId systemZone = ZoneId.of("Asia/Kolkata");
        LocalDate today = LocalDate.now(systemZone);
        List<AutoAcceptSettings> activeSettings = autoAcceptSettingsRepo.findAll();
        List<AutoAcceptSettings> updated = new java.util.ArrayList<>();
        for (AutoAcceptSettings setting : activeSettings) {
            if (setting.isEnabled() && setting.getToDate().isBefore(today)) {
                setting.setEnabled(false);
                updated.add(setting);
                log.info("Auto-disabled expired auto-accept setting for user: {}", setting.getUsername());
            }
        }
        if (!updated.isEmpty()) {
            autoAcceptSettingsRepo.saveAll(updated);
        }
    }

    @Transactional(readOnly = true)
    public RequestTrackingResDTO getTrackingDetails(Long formId) {
        ReductionForm form = reductionFormRepo.findById(formId)
                .orElseThrow(() -> new ReductionFormNotFoundException("Form not found"));

        RequestTrackingResDTO tracking = new RequestTrackingResDTO();
        tracking.setCurrentStatus(form.getCurrentStatus().name());
        tracking.setSubmittedTime(form.getSubmittedAt());

        // Map status to current stage
        String currentStage;
        if (form.getCurrentStatus() == FormStatus.Approved) {
            currentStage = "COMPLETED";
        } else if (form.getCurrentStatus().name().startsWith("Rejected")) {
            currentStage = "REJECTED";
        } else if (form.getCurrentStatus() == FormStatus.PendingOffice) {
            currentStage = "OFFICE";
        } else if (form.getCurrentStatus() == FormStatus.PendingWarden) {
            currentStage = "WARDEN";
        } else if (form.getCurrentStatus() == FormStatus.PendingDeputyWarden) {
            currentStage = "DEPUTY_WARDEN";
        } else {
            currentStage = "SUBMITTED";
        }
        tracking.setCurrentStage(currentStage);

        // Fetch history to populate approval times and actors
        List<ReductionFormHistory> history = form.getHistory();
        if (history != null) {
            for (ReductionFormHistory h : history) {
                if (h.getToStatus() == null) {
                    continue;
                }
                // Tracking who rejected
                if (h.getToStatus().name().startsWith("Rejected")) {
                    tracking.setRejectedBy(h.getToStatus().name().replace("Rejected", ""));
                    tracking.setRejectionReason(form.getRejectReason() != null ? form.getRejectReason() : h.getComment());
                    tracking.setRejectedTime(h.getEventTimestamp());
                }

                // If it moved TO PendingWarden, it means DeputyWarden approved it
                if (h.getToStatus() == FormStatus.PendingWarden && h.getFromStatus() == FormStatus.PendingDeputyWarden) {
                    tracking.setDeputyApprovalTime(h.getEventTimestamp());
                    tracking.setDeputyWardenName(h.getPerformedBy());
                }

                // If it moved TO PendingOffice, it means Warden approved it
                if (h.getToStatus() == FormStatus.PendingOffice && h.getFromStatus() == FormStatus.PendingWarden) {
                    tracking.setWardenApprovalTime(h.getEventTimestamp());
                    tracking.setWardenName(h.getPerformedBy());
                }

                // If it moved TO Approved, it means Office approved it
                if (h.getToStatus() == FormStatus.Approved) {
                    tracking.setOfficeApprovalTime(h.getEventTimestamp());
                    tracking.setOfficeName(h.getPerformedBy());
                    
                    if (h.getPerformedBy() != null && h.getPerformedBy().startsWith("SYSTEM")) {
                        tracking.setAutoAccepted(true);
                    }
                }
            }
        }

        return tracking;
    }
}

