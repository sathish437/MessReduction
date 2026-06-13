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
import com.hostel.MessReduction.DTO.ResDTO.ReductionFormHistoryResDTO;
import com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO;
import com.hostel.MessReduction.DTO.ResDTO.StaffDashboardCountDTO;
import com.hostel.MessReduction.DTO.ResDTO.YearWiseCountDTO;
import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.ReductionFormHistory;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.MappingDTO.ReductionFormMapper;
import com.hostel.MessReduction.Repo.ReductionFormHistoryRepo;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Service.ActivityLogService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

@Service
@Transactional
public class ReductionFormService {
    private static final String ACTION_APPROVE = "Approve";
    private static final String ACTION_REJECT = "Reject";

    private final ReductionFormRepo reductionFormRepo;
    private final StudentDetailsRepo studentDetailsRepo;
    private final ReductionFormHistoryRepo reductionFormHistoryRepo;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final StaffUsersRepo staffUsersRepo;
    private final TelegramNotificationService telegramNotificationService;

    public ReductionFormService(ReductionFormRepo reductionFormRepo,
                                StudentDetailsRepo studentDetailsRepo,
                                ReductionFormHistoryRepo reductionFormHistoryRepo,
                                ActivityLogService activityLogService,
                                NotificationService notificationService,
                                EmailService emailService,
                                StaffUsersRepo staffUsersRepo,
                                TelegramNotificationService telegramNotificationService) {
        this.reductionFormRepo = reductionFormRepo;
        this.studentDetailsRepo = studentDetailsRepo;
        this.reductionFormHistoryRepo = reductionFormHistoryRepo;
        this.activityLogService = activityLogService;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.staffUsersRepo = staffUsersRepo;
        this.telegramNotificationService = telegramNotificationService;
    }

    private void sendTelegramGroupNotification(ReductionForm form, String status) {
        String message = String.format("""
            🍽️ HOSTEL MESS REDUCTION
            
            Student: %s
            Register No: %s
            Form ID: %d
            Status: %s""", 
            form.getStudentDetails().getName(), 
            form.getStudentDetails().getRegisterNo(), 
            form.getFormId(), 
            status);
            
        telegramNotificationService.sendGroupNotification(message);
    }

    public StudentDetails getStudentDetails(Long id) {
        return studentDetailsRepo.findById(id)
                .orElseThrow(() -> new StudentNotFoundException("Student not found"));
    }

    public ReductionFormResDTO formSubmit(ReductionFormReqDTO dto, Long studentId) {
        StudentDetails studentDetails = getStudentDetails(studentId);
        validateNewSubmission(studentId, dto);

        ReductionForm reductionForm = ReductionFormMapper.mapToReductionForm(dto, studentDetails, LocalDate.now(), calculateTotalLeaves(dto));
        reductionForm.setCurrentStatus(FormStatus.PendingWarden);
        if (dto.getIsEmergency() != null && dto.getIsEmergency()) {
            reductionForm.setEmergency(true);
        }
        reductionFormRepo.save(reductionForm);
        saveFormHistory(reductionForm, "Student Submitted", null, FormStatus.PendingWarden, "student", "Initial submission");
        
        handleNewSubmissionNotifications(reductionForm);
        
        return ReductionFormMapper.mapToReductionFormResDTO(reductionForm);
    }

    private void handleNewSubmissionNotifications(ReductionForm form) {
        List<StaffUsers> wardens = staffUsersRepo.findByRole(Role.Warden);
        for (StaffUsers warden : wardens) {
            if (warden.getUserName().equalsIgnoreCase("warden" + form.getYear())) {
                if (form.isEmergency()) {
                    emailService.sendReminderEmail(warden.getGmail(), form, "EMERGENCY");
                    notificationService.createNotification(warden.getUserName(), "Emergency Reduction Request Received", "EMERGENCY_REQUEST", form.getFormId());
                } else {
                    notificationService.createNotification(warden.getUserName(), "New Reduction Request Received", "NORMAL_REQUEST", form.getFormId());
                }
            }
        }
        
        if (form.isEmergency()) {
            sendTelegramGroupNotification(form, "Emergency Request Submitted");
        }
    }

    public ReductionFormResDTO getFormForEdit(Long formId, Long studentId) {
        ReductionForm form = reductionFormRepo.findByFormIdAndStudentDetailsStudentId(formId, studentId)
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
        ReductionForm form = reductionFormRepo.findByFormIdAndStudentDetailsStudentId(formId, studentId)
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

        validateResubmitPayload(dto);

        FormStatus previousStatus = form.getCurrentStatus();
        form.setYear(dto.getYear());
        form.setRoomNo(dto.getRoomNo());
        form.setLeaveDate(dto.getLeaveDate());
        form.setLeaveTime(dto.getLeaveTime());
        form.setArrivalDate(dto.getArrivalDate());
        form.setArrivalTime(dto.getArrivalTime());
        form.setReason(dto.getReason());
        form.setPresentDate(LocalDate.now());
        form.setTotalHolidays(calculateTotalLeaves(dto));
        form.setCurrentStatus(FormStatus.PendingWarden);
        form.setRejectReason(null);

        reductionFormRepo.save(form);
        saveFormHistory(form, "Student Resubmitted", previousStatus, FormStatus.PendingWarden, "student", "Request resubmitted after rejection");
        
        handleNewSubmissionNotifications(form);
        
        return ReductionFormMapper.mapToReductionFormResDTO(form);
    }

    public List<ReductionFormHistoryResDTO> getFormHistory(Long formId, Long studentId) {
        reductionFormRepo.findByFormIdAndStudentDetailsStudentId(formId, studentId)
                .orElseThrow(() -> new ReductionFormNotFoundException("Form not found or not owned by the student"));

        return reductionFormHistoryRepo.findByReductionFormFormIdOrderByEventTimestampAsc(formId).stream()
                .map(this::mapHistoryToDTO)
                .toList();
    }

    public List<ReductionFormResDTO> formDetails(Long studentId) {
        List<ReductionForm> forms = reductionFormRepo.findByStudentDetailsStudentId(studentId);
        if (forms.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return forms.stream()
                .map(ReductionFormMapper::mapToReductionFormResDTO)
                .toList();
    }

    public List<ReductionFormResDTO> wardenPendingStatus(String userName) {
        Integer year = resolveWardenYear(userName);
        List<ReductionForm> forms = reductionFormRepo.findByCurrentStatusAndYear(FormStatus.PendingWarden, year);
        return forms.stream().map(ReductionFormMapper::mapToReductionFormResDTO).toList();
    }

    public List<ReductionFormResDTO> deputyWardenPendingStatus(String userName) {
        validateDeputyWardenUser(userName);
        List<ReductionForm> forms = reductionFormRepo.findByCurrentStatus(FormStatus.PendingDeputyWarden);
        return forms.stream().map(ReductionFormMapper::mapToReductionFormResDTO).toList();
    }

    public List<ReductionFormResDTO> officePendingStatus(String userName) {
        validateOfficeUser(userName);
        List<ReductionForm> forms = reductionFormRepo.findByCurrentStatus(FormStatus.PendingOffice);
        return forms.stream().map(ReductionFormMapper::mapToReductionFormResDTO).toList();
    }

    public void updateWardenPendingStatus(Long formId, String action, String userName) {
        Integer year = resolveWardenYear(userName);
        validateApproveAction(action, "Use the dedicated reject endpoint with a rejectReason to reject a form");
        ReductionForm form = getFormOrThrow(formId);
        validateCurrentStatus(form, FormStatus.PendingWarden, "Form is not in warden stage");
        validateWardenYear(form, year);
        FormStatus previousStatus = form.getCurrentStatus();
        form.setCurrentStatus(FormStatus.PendingDeputyWarden);
        reductionFormRepo.save(form);
        saveFormHistory(form, "Approved by Warden", previousStatus, FormStatus.PendingDeputyWarden, userName, null);
        createActivityLog(form, Role.Warden, userName, "Approved");
        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Warden Approved Request", "APPROVED", form.getFormId());
        if (form.isEmergency()) {
            staffUsersRepo.findByRole(Role.DeputyWarden).forEach(dw -> 
                notificationService.createNotification(dw.getUserName(), "Emergency Form Ready for Review", "EMERGENCY_REQUEST", form.getFormId())
            );
        }
    }

    public void updateDeputyWardenPendingStatus(Long formId, String action, String userName) {
        validateDeputyWardenUser(userName);
        validateApproveAction(action, "Use the dedicated reject endpoint with a rejectReason to reject a form");
        ReductionForm form = getFormOrThrow(formId);
        validateCurrentStatus(form, FormStatus.PendingDeputyWarden, "Form is not in deputy warden stage");
        FormStatus previousStatus = form.getCurrentStatus();
        form.setCurrentStatus(FormStatus.PendingOffice);
        reductionFormRepo.save(form);
        saveFormHistory(form, "Approved by Deputy Warden", previousStatus, FormStatus.PendingOffice, userName, null);
        createActivityLog(form, Role.DeputyWarden, userName, "Approved");
        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Deputy Warden Approved Request", "APPROVED", form.getFormId());
        if (form.isEmergency()) {
            staffUsersRepo.findByRole(Role.Office).forEach(office -> 
                notificationService.createNotification(office.getUserName(), "Emergency Form Ready for Office Approval", "EMERGENCY_REQUEST", form.getFormId())
            );
        }
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
        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Office Approved Request", "APPROVED", form.getFormId());
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
        saveFormHistory(form, "Rejected by Warden", previousStatus, FormStatus.RejectedWarden, userName, rejectReason.trim());
        createActivityLog(form, Role.Warden, userName, "Rejected");
        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Request Rejected by Warden", "REJECTED", form.getFormId());
    }

    public void rejectDeputyWardenForm(Long formId, String rejectReason, String userName) {
        validateDeputyWardenUser(userName);
        validateRejectReason(rejectReason);
        ReductionForm form = getFormOrThrow(formId);
        validateCurrentStatus(form, FormStatus.PendingDeputyWarden, "Form is not in deputy warden stage");
        FormStatus previousStatus = form.getCurrentStatus();
        form.setCurrentStatus(FormStatus.RejectedDeputyWarden);
        form.setRejectReason(rejectReason.trim());
        reductionFormRepo.save(form);
        saveFormHistory(form, "Rejected by Deputy Warden", previousStatus, FormStatus.RejectedDeputyWarden, userName, rejectReason.trim());
        createActivityLog(form, Role.DeputyWarden, userName, "Rejected");
        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Request Rejected by Deputy Warden", "REJECTED", form.getFormId());
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
        saveFormHistory(form, "Rejected by Office", previousStatus, FormStatus.RejectedOffice, userName, rejectReason.trim());
        createActivityLog(form, Role.Office, userName, "Rejected");
        notificationService.createNotification(form.getStudentDetails().getEmailId(), "Request Rejected by Office", "REJECTED", form.getFormId());
    }

    public StaffDashboardCountDTO getDashboardCount() {
        return new StaffDashboardCountDTO(
                reductionFormRepo.countByCurrentStatus(FormStatus.PendingWarden),
                reductionFormRepo.countByCurrentStatus(FormStatus.PendingDeputyWarden),
                reductionFormRepo.countByCurrentStatus(FormStatus.PendingOffice),
                reductionFormRepo.countByCurrentStatus(FormStatus.Approved),
                reductionFormRepo.countByCurrentStatus(FormStatus.RejectedWarden),
                reductionFormRepo.countByCurrentStatus(FormStatus.RejectedDeputyWarden),
                reductionFormRepo.countByCurrentStatus(FormStatus.RejectedOffice)
        );
    }

    public StaffDashboardCountDTO getDashboardCountForWarden(String userName) {
        Integer year = resolveWardenYear(userName);
        return new StaffDashboardCountDTO(
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingWarden, year),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingDeputyWarden, year),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingOffice, year),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.Approved, year),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.RejectedWarden, year),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.RejectedDeputyWarden, year),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.RejectedOffice, year)
        );
    }

    public YearWiseCountDTO deputyWardenYearWiseCount() {
        return new YearWiseCountDTO(
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingDeputyWarden, 1),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingDeputyWarden, 2),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingDeputyWarden, 3),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingDeputyWarden, 4)
        );
    }

    public YearWiseCountDTO officeYearWiseCount() {
        return new YearWiseCountDTO(
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingOffice, 1),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingOffice, 2),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingOffice, 3),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingOffice, 4)
        );
    }

    public void updateWardenBulkStatus(List<Long> formIds, String action, String userName) {
        validateBulkRequest(formIds);
        validateApproveAction(action, "Bulk rejection is not supported. Use the individual reject endpoint with a rejectReason.");
        Integer year = resolveWardenYear(userName);

        List<ReductionForm> forms = reductionFormRepo.findAllById(formIds);
        if (forms.isEmpty()) {
            throw new ReductionFormNotFoundException("No forms found for the provided IDs");
        }
        long distinctIds = formIds.stream().filter(Objects::nonNull).distinct().count();
        if (forms.size() != distinctIds) {
            throw new ReductionFormNotFoundException("Some form IDs were not found for the provided IDs");
        }

        for (ReductionForm form : forms) {
            validateCurrentStatus(form, FormStatus.PendingWarden, "Form is not in warden stage");
            validateWardenYear(form, year);
            FormStatus previousStatus = form.getCurrentStatus();
            form.setCurrentStatus(FormStatus.PendingDeputyWarden);
            saveFormHistory(form, "Approved by Warden (Bulk)", previousStatus, FormStatus.PendingDeputyWarden, userName, null);
            createActivityLog(form, Role.Warden, userName, "Approved");
            notificationService.createNotification(form.getStudentDetails().getEmailId(), "Warden Approved Request", "APPROVED", form.getFormId());
            if (form.isEmergency()) {
                staffUsersRepo.findByRole(Role.DeputyWarden).forEach(dw -> 
                    notificationService.createNotification(dw.getUserName(), "Emergency Form Ready for Review", "EMERGENCY_REQUEST", form.getFormId())
                );
            }
        }

        reductionFormRepo.saveAll(forms);
    }

    public void updateDeputyWardenPendingBulkStatus(List<Long> formIds, String action, String userName) {
        validateBulkRequest(formIds);
        validateDeputyWardenUser(userName);
        validateApproveAction(action, "Bulk rejection is not supported. Use the individual reject endpoint with a rejectReason.");

        List<ReductionForm> forms = reductionFormRepo.findAllById(formIds);
        if (forms.isEmpty()) {
            throw new ReductionFormNotFoundException("No forms found for the provided IDs");
        }
        long distinctIds = formIds.stream().filter(Objects::nonNull).distinct().count();
        if (forms.size() != distinctIds) {
            throw new ReductionFormNotFoundException("Some form IDs were not found for the provided IDs");
        }

        for (ReductionForm form : forms) {
            validateCurrentStatus(form, FormStatus.PendingDeputyWarden, "Form is not in deputy warden stage");
            FormStatus previousStatus = form.getCurrentStatus();
            form.setCurrentStatus(FormStatus.PendingOffice);
            saveFormHistory(form, "Approved by Deputy Warden (Bulk)", previousStatus, FormStatus.PendingOffice, userName, null);
            createActivityLog(form, Role.DeputyWarden, userName, "Approved");
            notificationService.createNotification(form.getStudentDetails().getEmailId(), "Deputy Warden Approved Request", "APPROVED", form.getFormId());
            if (form.isEmergency()) {
                staffUsersRepo.findByRole(Role.Office).forEach(office -> 
                    notificationService.createNotification(office.getUserName(), "Emergency Form Ready for Office Approval", "EMERGENCY_REQUEST", form.getFormId())
                );
            }
        }

        reductionFormRepo.saveAll(forms);
    }

    public void updateOfficePendingBulkStatus(List<Long> formIds, String action, String userName) {
        validateBulkRequest(formIds);
        validateOfficeUser(userName);
        validateApproveAction(action, "Bulk rejection is not supported. Use the individual reject endpoint with a rejectReason.");

        List<ReductionForm> forms = reductionFormRepo.findAllById(formIds);
        if (forms.isEmpty()) {
            throw new ReductionFormNotFoundException("No forms found for the provided IDs");
        }
        long distinctIds = formIds.stream().filter(Objects::nonNull).distinct().count();
        if (forms.size() != distinctIds) {
            throw new ReductionFormNotFoundException("Some form IDs were not found for the provided IDs");
        }

        for (ReductionForm form : forms) {
            validateCurrentStatus(form, FormStatus.PendingOffice, "Form is not in office stage");
            FormStatus previousStatus = form.getCurrentStatus();
            form.setCurrentStatus(FormStatus.Approved);
            saveFormHistory(form, "Approved by Office (Bulk)", previousStatus, FormStatus.Approved, userName, null);
            createActivityLog(form, Role.Office, userName, "Approved");
            notificationService.createNotification(form.getStudentDetails().getEmailId(), "Office Approved Request", "APPROVED", form.getFormId());
        }

        reductionFormRepo.saveAll(forms);
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
        activityLogRequest.setStudentId(form.getStudentDetails().getStudentId());
        activityLogRequest.setStudentName(form.getStudentDetails().getName());
        activityLogRequest.setDepartment(form.getStudentDetails().getDepartment().name());
        activityLogRequest.setStaffRole(staffRole);
        activityLogRequest.setStaffName(staffName);
        activityLogRequest.setAction(action);
        activityLogRequest.setArrivalDate(form.getArrivalDate());
        activityLogService.createLog(activityLogRequest);
    }

    private ReductionFormHistoryResDTO mapHistoryToDTO(ReductionFormHistory history) {
        return new ReductionFormHistoryResDTO(
                history.getId(),
                history.getReductionForm().getFormId(),
                history.getFromStatus(),
                history.getToStatus(),
                history.getEventType(),
                history.getPerformedBy(),
                history.getComment(),
                history.getEventTimestamp()
        );
    }

    private void validateNewSubmission(Long studentId, ReductionFormReqDTO dto) {
        if (reductionFormRepo.existsByStudentDetailsStudentIdAndCurrentStatusIn(studentId,
                List.of(FormStatus.PendingWarden, FormStatus.PendingDeputyWarden, FormStatus.PendingOffice))) {
            throw new StatusAlreadyPendingException("Cannot submit a new form while a previous request is still pending");
        }
        validateResubmitPayload(dto);
    }

    private void validateResubmitPayload(ReductionFormReqDTO dto) {
        if (dto.getArrivalDate().isBefore(dto.getLeaveDate()) || dto.getArrivalDate().isEqual(dto.getLeaveDate())) {
            throw new DateNotValidException("Arrival date must be after leave date");
        }
        calculateTotalLeaves(dto);
    }

    private long calculateTotalLeaves(ReductionFormReqDTO dto) {
        long totalDays = ChronoUnit.DAYS.between(dto.getLeaveDate(), dto.getArrivalDate());
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
        return switch (userName) {
            case "warden1" -> 1;
            case "warden2" -> 2;
            case "warden3" -> 3;
            case "warden4" -> 4;
            default -> throw new UnauthorizedUserException("Unauthorized user");
        };
    }

    private void validateWardenYear(ReductionForm form, Integer year) {
        if (!Objects.equals(form.getYear(), year)) {
            throw new UnauthorizedUserException("Unauthorized access");
        }
    }

    private void validateDeputyWardenUser(String userName) {
        if (!"deputyWarden".equals(userName)) {
            throw new UnauthorizedUserException("Unauthorized user");
        }
    }

    private void validateOfficeUser(String userName) {
        if (!"office".equals(userName)) {
            throw new UnauthorizedUserException("Unauthorized user");
        }
    }
}
