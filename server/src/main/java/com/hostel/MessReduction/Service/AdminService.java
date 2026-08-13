package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.DTO.ReqDTO.StudentRequestDTO;
import com.hostel.MessReduction.DTO.ResDTO.PaginatedResponseDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentResponseDTO;
import com.hostel.MessReduction.Entity.Department;
import com.hostel.MessReduction.Entity.Gender;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;
import com.hostel.MessReduction.DTO.ReqDTO.UpdateStaffCredentialReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StaffCredentialResponseDTO;
import com.hostel.MessReduction.Entity.AuditLog;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Repo.AuditLogRepo;
import com.hostel.MessReduction.Repo.AutoAcceptSettingsRepo;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class AdminService {

    private final StudentDetailsRepo studentDetailsRepo;
    private final com.hostel.MessReduction.Repo.ReductionFormRepo reductionFormRepo;
    private final com.hostel.MessReduction.Repo.StaffUsersRepo staffUsersRepo;
    private final com.hostel.MessReduction.Repo.ReductionFormHistoryRepo reductionFormHistoryRepo;
    private final com.hostel.MessReduction.Repo.ExtraSubmissionRequestRepo extraSubmissionRequestRepo;
    private final com.hostel.MessReduction.Repo.ActivityLogRepository activityLogRepository;
    private final com.hostel.MessReduction.Repo.SystemSettingsRepo systemSettingsRepo;
    private final AuditLogRepo auditLogRepo;
    private final AutoAcceptSettingsRepo autoAcceptSettingsRepo;
    private final DepartmentService departmentService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.hostel.MessReduction.security.StaffJwtUtil staffJwtUtil;

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public PaginatedResponseDTO<StudentResponseDTO> getStudents(
            String search, String department, Gender gender, Integer year,
            int page, int size, String sortBy, String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<StudentDetails> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), searchPattern),
                        cb.like(cb.lower(root.get("registerNo")), searchPattern),
                        cb.like(cb.lower(root.get("rollNo")), searchPattern),
                        cb.like(cb.lower(root.get("phoneNo")), searchPattern),
                        cb.like(cb.lower(root.get("emailId")), searchPattern)
                ));
            }

            if (department != null && !department.trim().isEmpty()) {
                String d = department.trim().toLowerCase();
                predicates.add(cb.equal(cb.lower(root.get("department")), d));
            }

            if (gender != null) {
                predicates.add(cb.equal(root.get("gender"), gender));
            }

            if (year != null) {
                predicates.add(cb.equal(root.get("currentYear"), year));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<StudentDetails> studentPage = studentDetailsRepo.findAll(spec, pageable);

        List<StudentResponseDTO> content = studentPage.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return new PaginatedResponseDTO<>(
                content,
                studentPage.getNumber(),
                studentPage.getSize(),
                studentPage.getTotalElements(),
                studentPage.getTotalPages(),
                studentPage.isLast()
        );
    }

    public StudentResponseDTO getStudentById(Long id) {
        StudentDetails student = studentDetailsRepo.findById(id)
                .orElseThrow(() -> new com.hostel.MessReduction.CustomException.StudentNotFoundException("Student not found with ID: " + id));
        return mapToDTO(student);
    }

    public StudentResponseDTO createStudent(StudentRequestDTO dto) {
        if (studentDetailsRepo.findByRegisterNo(dto.getRegisterNo()).isPresent()) {
            throw new com.hostel.MessReduction.CustomException.BadRequestException("Register number already exists");
        }
        if (studentDetailsRepo.findByRollNo(dto.getRollNo()).isPresent()) {
            throw new com.hostel.MessReduction.CustomException.BadRequestException("Roll number already exists");
        }
        if (studentDetailsRepo.existsByEmailId(dto.getEmailId())) {
            throw new com.hostel.MessReduction.CustomException.BadRequestException("Email already exists");
        }

        StudentDetails student = new StudentDetails();
        updateEntity(student, dto);
        student = studentDetailsRepo.save(student);
        return mapToDTO(student);
    }

    public StudentResponseDTO updateStudent(Long id, StudentRequestDTO dto) {
        StudentDetails student = studentDetailsRepo.findById(id)
                .orElseThrow(() -> new com.hostel.MessReduction.CustomException.StudentNotFoundException("Student not found with ID: " + id));

        if (!student.getRegisterNo().equals(dto.getRegisterNo()) && studentDetailsRepo.findByRegisterNo(dto.getRegisterNo()).isPresent()) {
            throw new com.hostel.MessReduction.CustomException.BadRequestException("Register number already exists");
        }
        if (!student.getRollNo().equals(dto.getRollNo()) && studentDetailsRepo.findByRollNo(dto.getRollNo()).isPresent()) {
            throw new com.hostel.MessReduction.CustomException.BadRequestException("Roll number already exists");
        }
        if (!student.getEmailId().equals(dto.getEmailId()) && studentDetailsRepo.existsByEmailId(dto.getEmailId())) {
            throw new com.hostel.MessReduction.CustomException.BadRequestException("Email already exists");
        }

        updateEntity(student, dto);
        student = studentDetailsRepo.save(student);
        return mapToDTO(student);
    }

    public void deleteStudent(Long id) {
        if (id == null) return;
        bulkDeleteStudents(List.of(id));
    }

    @org.springframework.transaction.annotation.Transactional
    public void bulkDeleteStudents(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return;
        List<Long> distinctIds = ids.stream().filter(java.util.Objects::nonNull).distinct().toList();
        if (distinctIds.isEmpty()) return;

        long start = System.nanoTime();

        // 1. Delete all ReductionFormHistory entries referencing forms of these students
        long historyStart = System.nanoTime();
        int deletedHistories = reductionFormHistoryRepo.deleteHistoriesByStudentIdsIn(distinctIds);
        long historyDurationMs = (System.nanoTime() - historyStart) / 1_000_000;

        // 2. Delete all ReductionForm entries of these students
        long formStart = System.nanoTime();
        int deletedForms = reductionFormRepo.deleteFormsByStudentIdsIn(distinctIds);
        long formDurationMs = (System.nanoTime() - formStart) / 1_000_000;

        // 3. Delete all ExtraSubmissionRequest entries of these students
        long extraStart = System.nanoTime();
        int deletedExtras = extraSubmissionRequestRepo.deleteExtraSubmissionsByStudentIdsIn(distinctIds);
        long extraDurationMs = (System.nanoTime() - extraStart) / 1_000_000;

        // 4. Delete the StudentDetails entries
        long studentStart = System.nanoTime();
        int deletedStudents = studentDetailsRepo.deleteStudentsByIdsIn(distinctIds);
        long studentDurationMs = (System.nanoTime() - studentStart) / 1_000_000;

        long totalDurationMs = (System.nanoTime() - start) / 1_000_000;
        log.info("Bulk Delete Students Performance [Total: {} ms]: deletedStudents={} ({} ms), deletedForms={} ({} ms), deletedHistories={} ({} ms), deletedExtraSubmissions={} ({} ms)",
                totalDurationMs, deletedStudents, studentDurationMs, deletedForms, formDurationMs, deletedHistories, historyDurationMs, deletedExtras, extraDurationMs);
    }

    private void updateEntity(StudentDetails student, StudentRequestDTO dto) {
        student.setName(dto.getName());
        student.setRegisterNo(dto.getRegisterNo());
        student.setRollNo(dto.getRollNo());
        if (dto.getDepartment() != null && !dto.getDepartment().trim().isEmpty()) {
            student.setDepartment(dto.getDepartment().trim());
        }
        student.setGender(dto.getGender());
        student.setDob(dto.getDob());
        student.setEmailId(dto.getEmailId());
        student.setPhoneNo(dto.getPhoneNo());
        student.setCurrentYear(dto.getCurrentYear());
    }

    private StudentResponseDTO mapToDTO(StudentDetails student) {
        return new StudentResponseDTO(
                student.getStudentId(),
                student.getName(),
                student.getRegisterNo(),
                student.getRollNo(),
                student.getDepartment(),
                student.getGender(),
                student.getDob(),
                student.getEmailId(),
                student.getPhoneNo(),
                student.getCurrentYear() != null ? student.getCurrentYear() : 3
        );
    }


    public void updatePassword(String oldPassword, String newPassword) {
        String currentUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        com.hostel.MessReduction.Entity.StaffUsers adminUser = staffUsersRepo.findByUserName(currentUsername)
                .orElseThrow(() -> new com.hostel.MessReduction.CustomException.BadRequestException("Admin user not found"));

        if (adminUser.getPassword().startsWith("{noop}")) {
            String plainOld = adminUser.getPassword().substring(6);
            if (!plainOld.equals(oldPassword)) {
                throw new com.hostel.MessReduction.CustomException.BadRequestException("Incorrect old password");
            }
        } else if (!passwordEncoder.matches(oldPassword, adminUser.getPassword())) {
            throw new com.hostel.MessReduction.CustomException.BadRequestException("Incorrect old password");
        }

        adminUser.setPassword(passwordEncoder.encode(newPassword));
        staffUsersRepo.save(adminUser);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public int getReminderOffsetDays() {
        return systemSettingsRepo.findById("REMINDER_BEFORE_ARRIVAL_DAYS")
                .map(setting -> {
                    try {
                        return Integer.parseInt(setting.getSettingValue());
                    } catch (Exception e) {
                        return 3;
                    }
                })
                .orElse(3);
    }

    public int updateReminderOffsetDays(int days) {
        if (days < 1) {
            throw new com.hostel.MessReduction.CustomException.BadRequestException("Reminder offset days must be at least 1");
        }
        com.hostel.MessReduction.Entity.SystemSettings setting = systemSettingsRepo.findById("REMINDER_BEFORE_ARRIVAL_DAYS")
                .orElseGet(() -> new com.hostel.MessReduction.Entity.SystemSettings("REMINDER_BEFORE_ARRIVAL_DAYS", "3"));
        setting.setSettingValue(String.valueOf(days));
        systemSettingsRepo.save(setting);
        return days;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<StaffCredentialResponseDTO> getStaffCredentials() {
        return staffUsersRepo.findAll().stream()
                .sorted((a, b) -> {
                    int roleOrderA = getRoleOrder(a.getRole());
                    int roleOrderB = getRoleOrder(b.getRole());
                    if (roleOrderA != roleOrderB) {
                        return Integer.compare(roleOrderA, roleOrderB);
                    }
                    if (a.getYear() != null && b.getYear() != null) {
                        int yearComp = Integer.compare(a.getYear(), b.getYear());
                        if (yearComp != 0) return yearComp;
                    }
                    if (a.getGender() != null && b.getGender() != null) {
                        int genComp = a.getGender().compareTo(b.getGender());
                        if (genComp != 0) return genComp;
                    }
                    return a.getUserName().compareToIgnoreCase(b.getUserName());
                })
                .map(this::mapToStaffCredentialDTO)
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> updateStaffCredential(Long id, UpdateStaffCredentialReqDTO dto) {
        StaffUsers staff = staffUsersRepo.findById(id)
                .orElseThrow(() -> new com.hostel.MessReduction.CustomException.BadRequestException("Staff user not found with ID: " + id));

        String newUsername = dto.getUsername() != null ? dto.getUsername().trim() : "";
        if (newUsername.isEmpty()) {
            throw new com.hostel.MessReduction.CustomException.BadRequestException("Username cannot be empty");
        }

        String oldUsername = staff.getUserName();
        boolean usernameChanged = !oldUsername.equals(newUsername);

        if (usernameChanged) {
            Optional<StaffUsers> existingUser = staffUsersRepo.findByUserName(newUsername);
            if (existingUser.isPresent() && !existingUser.get().getUserId().equals(id)) {
                throw new com.hostel.MessReduction.CustomException.BadRequestException("Username already exists.");
            }
        }

        boolean passwordChanged = false;
        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            String newPassword = dto.getPassword().trim();
            if (newPassword.length() < 4) {
                throw new com.hostel.MessReduction.CustomException.BadRequestException("Password must be at least 4 characters long.");
            }
            staff.setPassword(passwordEncoder.encode(newPassword));
            passwordChanged = true;
        }

        if (usernameChanged) {
            staff.setUserName(newUsername);

            // Update assignedDeputyWarden in active reduction forms if applicable
            if (staff.getRole() == Role.DeputyWarden) {
                List<com.hostel.MessReduction.Entity.ReductionForm> assignedForms = 
                        reductionFormRepo.findByCurrentStatusAndAssignedDeputyWarden(
                                com.hostel.MessReduction.Entity.FormStatus.PendingDeputyWarden, oldUsername);
                for (com.hostel.MessReduction.Entity.ReductionForm form : assignedForms) {
                    form.setAssignedDeputyWarden(newUsername);
                }
                reductionFormRepo.saveAll(assignedForms);
            }

            // Update auto-accept settings username if present
            autoAcceptSettingsRepo.findByUsername(oldUsername).ifPresent(settings -> {
                settings.setUsername(newUsername);
                autoAcceptSettingsRepo.save(settings);
            });
        }

        boolean contactChanged = false;
        if (dto.getGmail() != null && !dto.getGmail().trim().isEmpty()) {
            String newGmail = dto.getGmail().trim();
            if (!newGmail.equals(staff.getGmail())) {
                staff.setGmail(newGmail);
                contactChanged = true;
            }
        }

        if (dto.getPhoneNo() != null) {
            String newPhone = dto.getPhoneNo().trim();
            if (!newPhone.equals(staff.getPhoneNo())) {
                staff.setPhoneNo(newPhone);
                contactChanged = true;
            }
        }

        staffUsersRepo.save(staff);

        // Record in audit log
        String currentAdmin = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication() != null
                ? org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName()
                : "MasterAdmin";

        AuditLog auditLog = new AuditLog();
        auditLog.setEventType("STAFF_CREDENTIAL_UPDATE");
        auditLog.setPerformedBy(currentAdmin);
        auditLog.setPerformedByRole("ADMIN");
        auditLog.setTimestamp(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
        auditLog.setMessage(String.format("Admin changed credentials for: %s (ID: %d). Username: %s. Password: %s. Contact details: %s.",
                staff.getRole(), id,
                usernameChanged ? (oldUsername + " -> " + newUsername) : "Unchanged",
                passwordChanged ? "Changed" : "Unchanged",
                contactChanged ? "Updated" : "Unchanged"));
        auditLogRepo.save(auditLog);

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        response.put("message", "Staff credentials updated successfully");

        if (usernameChanged && oldUsername.equalsIgnoreCase(currentAdmin)) {
            String newToken = staffJwtUtil.generateToken(newUsername, staff.getRole());
            response.put("newToken", newToken);
            response.put("newUsername", newUsername);
        }

        return response;
    }

    private int getRoleOrder(Role role) {
        if (role == null) return 99;
        return switch (role) {
            case Warden -> 1;
            case DeputyWarden -> 2;
            case Office -> 3;
            case ADMIN -> 4;
        };
    }

    private StaffCredentialResponseDTO mapToStaffCredentialDTO(StaffUsers staff) {
        return new StaffCredentialResponseDTO(
                staff.getUserId(),
                staff.getRole(),
                staff.getUserName(),
                staff.getGender(),
                staff.getYear(),
                staff.getGmail(),
                staff.getPhoneNo()
        );
    }
}
