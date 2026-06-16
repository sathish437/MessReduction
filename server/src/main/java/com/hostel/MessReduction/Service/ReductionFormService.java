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
import com.hostel.MessReduction.DTO.ResDTO.StaffDashboardCountDTO;
import com.hostel.MessReduction.DTO.ResDTO.YearWiseCountDTO;
import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.Gender;
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
    private final StaffUsersRepo staffUsersRepo;

    public ReductionFormService(ReductionFormRepo reductionFormRepo,
                                StudentDetailsRepo studentDetailsRepo,
                                ReductionFormHistoryRepo reductionFormHistoryRepo,
                                ActivityLogService activityLogService,
                                StaffUsersRepo staffUsersRepo) {
        this.reductionFormRepo = reductionFormRepo;
        this.studentDetailsRepo = studentDetailsRepo;
        this.reductionFormHistoryRepo = reductionFormHistoryRepo;
        this.activityLogService = activityLogService;
        this.staffUsersRepo = staffUsersRepo;
    }

    public StudentDetails getStudentDetails(Long id) {
        return studentDetailsRepo.findById(id)
                .orElseThrow(() -> new StudentNotFoundException("Student not found"));
    }

    public ReductionFormResDTO formSubmit(ReductionFormReqDTO dto, Long studentId) {
        StudentDetails studentDetails = getStudentDetails(studentId);
        validateNewSubmission(studentId, dto);

        String assignedDeputyWarden = resolveAssignedDeputyWarden(studentDetails.getGender(), dto.getYear());
        ReductionForm reductionForm = ReductionFormMapper.mapToReductionForm(dto, studentDetails, LocalDate.now(), calculateTotalLeaves(dto), assignedDeputyWarden);
        reductionForm.setCurrentStatus(FormStatus.PendingDeputyWarden);
        reductionFormRepo.save(reductionForm);
        saveFormHistory(reductionForm, "Student Submitted", null, FormStatus.PendingWarden, "student", "Initial submission");
        return ReductionFormMapper.mapToReductionFormResDTO(reductionForm);
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
        form.setCurrentStatus(FormStatus.PendingDeputyWarden);
        form.setAssignedDeputyWarden(resolveAssignedDeputyWarden(form.getStudentDetails().getGender(), form.getYear()));
        form.setRejectReason(null);

        reductionFormRepo.save(form);
        saveFormHistory(form, "Student Resubmitted", previousStatus, FormStatus.PendingWarden, "student", "Request resubmitted after rejection");
        return ReductionFormMapper.mapToReductionFormResDTO(form);
    }

    public List<ReductionFormHistoryResDTO> getFormHistory(Long formId, Long studentId) {
        reductionFormRepo.findByFormIdAndStudentDetailsStudentIdAndIsActiveTrue(formId, studentId)
                .orElseThrow(() -> new ReductionFormNotFoundException("Form not found or not owned by the student"));

        return reductionFormHistoryRepo.findByReductionFormFormIdAndIsActiveTrueOrderByEventTimestampAsc(formId).stream()
                .map(this::mapHistoryToDTO)
                .toList();
    }

    public List<ReductionFormResDTO> formDetails(Long studentId) {
        List<ReductionForm> forms = reductionFormRepo.findByStudentDetailsStudentIdAndIsActiveTrue(studentId);
        if (forms.isEmpty()) {
            throw new ReductionFormNotFoundException("No forms found for this student");
        }
        return forms.stream()
                .map(ReductionFormMapper::mapToReductionFormResDTO)
                .toList();
    }

    public List<ReductionFormResDTO> wardenPendingStatus(String userName, String gender, Integer year) {
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
        validateDeputyWardenUser(userName);
        List<ReductionForm> forms = reductionFormRepo.findByCurrentStatusAndAssignedDeputyWardenAndIsActiveTrue(FormStatus.PendingDeputyWarden, userName);
        return forms.stream()
                .filter(this::canAccessApprovedForm)
                .map(ReductionFormMapper::mapToReductionFormResDTO)
                .toList();
    }

    public List<ReductionFormResDTO> officePendingStatus(String userName, String gender, Integer year) {
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
        saveFormHistory(form, "Approved by Warden", previousStatus, FormStatus.PendingDeputyWarden, userName, null);
        createActivityLog(form, Role.Warden, userName, "Approved");
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
        saveFormHistory(form, "Rejected by Deputy Warden", previousStatus, FormStatus.RejectedDeputyWarden, userName, rejectReason.trim());
        createActivityLog(form, Role.DeputyWarden, userName, "Rejected");
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
    }

    public StaffDashboardCountDTO getDashboardCount() {
        return new StaffDashboardCountDTO(
                reductionFormRepo.countByCurrentStatusAndIsActiveTrue(FormStatus.PendingWarden),
                reductionFormRepo.countByCurrentStatusAndIsActiveTrue(FormStatus.PendingDeputyWarden),
                reductionFormRepo.countByCurrentStatusAndIsActiveTrue(FormStatus.PendingOffice),
                reductionFormRepo.countByCurrentStatusAndIsActiveTrue(FormStatus.Approved),
                reductionFormRepo.countByCurrentStatusAndIsActiveTrue(FormStatus.RejectedWarden),
                reductionFormRepo.countByCurrentStatusAndIsActiveTrue(FormStatus.RejectedDeputyWarden),
                reductionFormRepo.countByCurrentStatusAndIsActiveTrue(FormStatus.RejectedOffice)
        );
    }

    public StaffDashboardCountDTO getDashboardCountForWarden(String userName) {
        Integer year = resolveWardenYear(userName);
        if (year == null) {
            return getDashboardCount();
        }
        return new StaffDashboardCountDTO(
                reductionFormRepo.countByCurrentStatusAndYearAndIsActiveTrue(FormStatus.PendingWarden, year),
                reductionFormRepo.countByCurrentStatusAndYearAndIsActiveTrue(FormStatus.PendingDeputyWarden, year),
                reductionFormRepo.countByCurrentStatusAndYearAndIsActiveTrue(FormStatus.PendingOffice, year),
                reductionFormRepo.countByCurrentStatusAndYearAndIsActiveTrue(FormStatus.Approved, year),
                reductionFormRepo.countByCurrentStatusAndYearAndIsActiveTrue(FormStatus.RejectedWarden, year),
                reductionFormRepo.countByCurrentStatusAndYearAndIsActiveTrue(FormStatus.RejectedDeputyWarden, year),
                reductionFormRepo.countByCurrentStatusAndYearAndIsActiveTrue(FormStatus.RejectedOffice, year)
        );
    }

    public StaffDashboardCountDTO getDashboardCountForDeputy(String userName) {
        validateDeputyWardenUser(userName);
        return new StaffDashboardCountDTO(
                reductionFormRepo.countByCurrentStatusAndAssignedDeputyWardenAndIsActiveTrue(FormStatus.PendingWarden, userName),
                reductionFormRepo.countByCurrentStatusAndAssignedDeputyWardenAndIsActiveTrue(FormStatus.PendingDeputyWarden, userName),
                reductionFormRepo.countByCurrentStatusAndAssignedDeputyWardenAndIsActiveTrue(FormStatus.PendingOffice, userName),
                reductionFormRepo.countByCurrentStatusAndAssignedDeputyWardenAndIsActiveTrue(FormStatus.Approved, userName),
                reductionFormRepo.countByCurrentStatusAndAssignedDeputyWardenAndIsActiveTrue(FormStatus.RejectedWarden, userName),
                reductionFormRepo.countByCurrentStatusAndAssignedDeputyWardenAndIsActiveTrue(FormStatus.RejectedDeputyWarden, userName),
                reductionFormRepo.countByCurrentStatusAndAssignedDeputyWardenAndIsActiveTrue(FormStatus.RejectedOffice, userName)
        );
    }

    public YearWiseCountDTO deputyWardenYearWiseCount(String userName) {
        validateDeputyWardenUser(userName);
        int assignedYear = resolveDeputyWardenYear(userName);
        return new YearWiseCountDTO(
                assignedYear == 1 ? reductionFormRepo.countByCurrentStatusAndAssignedDeputyWardenAndIsActiveTrue(FormStatus.PendingDeputyWarden, userName) : 0L,
                assignedYear == 2 ? reductionFormRepo.countByCurrentStatusAndAssignedDeputyWardenAndIsActiveTrue(FormStatus.PendingDeputyWarden, userName) : 0L,
                assignedYear == 3 ? reductionFormRepo.countByCurrentStatusAndAssignedDeputyWardenAndIsActiveTrue(FormStatus.PendingDeputyWarden, userName) : 0L,
                assignedYear == 4 ? reductionFormRepo.countByCurrentStatusAndAssignedDeputyWardenAndIsActiveTrue(FormStatus.PendingDeputyWarden, userName) : 0L
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

        List<ReductionForm> validForms = new ArrayList<>();
        for (ReductionForm form : forms) {
            // Skip inactive forms
            if (!form.isActive()) {
                continue;
            }
            // Skip forms not in PendingWarden status instead of throwing error
            if (form.getCurrentStatus() != FormStatus.PendingWarden) {
                continue;
            }
            // Skip forms that don't match warden year validation
            if (year != null && !Objects.equals(form.getYear(), year)) {
                continue;
            }
            FormStatus previousStatus = form.getCurrentStatus();
            form.setCurrentStatus(FormStatus.PendingOffice);
            saveFormHistory(form, "Approved by Warden (Bulk)", previousStatus, FormStatus.PendingOffice, userName, null);
            createActivityLog(form, Role.Warden, userName, "Approved");
            validForms.add(form);
        }

        reductionFormRepo.saveAll(validForms);
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
            // Skip inactive forms
            if (!form.isActive()) {
                continue;
            }
            validateCurrentStatus(form, FormStatus.PendingDeputyWarden, "Form is not in deputy warden stage");
            validateAssignedDeputyWarden(form, userName);
            FormStatus previousStatus = form.getCurrentStatus();
            form.setCurrentStatus(FormStatus.PendingWarden);
            saveFormHistory(form, "Approved by Deputy Warden (Bulk)", previousStatus, FormStatus.PendingWarden, userName, null);
            createActivityLog(form, Role.DeputyWarden, userName, "Approved");
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
            // Skip inactive forms
            if (!form.isActive()) {
                continue;
            }
            validateCurrentStatus(form, FormStatus.PendingOffice, "Form is not in office stage");
            FormStatus previousStatus = form.getCurrentStatus();
            form.setCurrentStatus(FormStatus.Approved);
            saveFormHistory(form, "Approved by Office (Bulk)", previousStatus, FormStatus.Approved, userName, null);
            createActivityLog(form, Role.Office, userName, "Approved");
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
        // Check for pending forms
        if (reductionFormRepo.existsByStudentDetailsStudentIdAndCurrentStatusIn(studentId,
                List.of(FormStatus.PendingWarden, FormStatus.PendingDeputyWarden, FormStatus.PendingOffice))) {
            throw new StatusAlreadyPendingException("Cannot submit a new form while a previous request is still pending");
        }

        // Check for active approved requests (arrival date >= current date)
        validateActiveApprovedRequest(studentId);

        validateResubmitPayload(dto);
    }

    private void validateActiveApprovedRequest(Long studentId) {
        List<ReductionForm> activeApprovedForms = reductionFormRepo
                .findByStudentDetailsStudentIdAndCurrentStatusAndArrivalDateAfterAndIsActiveTrue(
                        studentId,
                        FormStatus.Approved,
                        LocalDate.now()
                );

        if (!activeApprovedForms.isEmpty()) {
            throw new StatusAlreadyPendingException(
                    "You already have an approved reduction request active until your arrival date. New request submission is not allowed."
            );
        }
    }

    public void deleteAllReductionForms() {
        reductionFormRepo.deleteAll();
    }

    public void expireReductionForms() {
        LocalDate today = LocalDate.now();
        List<ReductionForm> expiredForms = reductionFormRepo.findByIsActiveTrueAndArrivalDateBefore(today);
        if (expiredForms.isEmpty()) {
            return;
        }
        List<ReductionForm> formsToDeactivate = expiredForms.stream()
                .filter(form -> form.getCurrentStatus() != FormStatus.Approved)
                .toList();
        if (formsToDeactivate.isEmpty()) {
            return;
        }
        formsToDeactivate.forEach(form -> {
            form.setActive(false);
            // Also deactivate the history records for this form
            form.getHistory().forEach(history -> history.setActive(false));
        });
        reductionFormRepo.saveAll(formsToDeactivate);
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
        List<ReductionForm> reports = reductionFormRepo.findByCurrentStatusAndLeaveDateBetweenOrderByLeaveDateAsc(
                FormStatus.Approved, fourMonthsAgo, today
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
        validateDeputyWardenUser(userName);
        int deputyNumber = Integer.parseInt(userName.substring("deputyWarden".length()));
        return deputyNumber > 4 ? deputyNumber - 4 : deputyNumber;
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
        if (userName == null || !userName.matches("deputyWarden[1-8]")) {
            throw new UnauthorizedUserException("Unauthorized user");
        }
    }

    private void validateOfficeUser(String userName) {
        if (!"office".equals(userName)) {
            throw new UnauthorizedUserException("Unauthorized user");
        }
    }
}
