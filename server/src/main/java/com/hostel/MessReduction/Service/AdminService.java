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
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final StudentDetailsRepo studentDetailsRepo;
    private final com.hostel.MessReduction.Repo.ReductionFormRepo reductionFormRepo;
    private final com.hostel.MessReduction.Repo.StaffUsersRepo staffUsersRepo;
    private final com.hostel.MessReduction.Repo.ReductionFormHistoryRepo reductionFormHistoryRepo;
    private final com.hostel.MessReduction.Repo.ActivityLogRepository activityLogRepository;
    private final com.hostel.MessReduction.Repo.SystemSettingsRepo systemSettingsRepo;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public PaginatedResponseDTO<StudentResponseDTO> getStudents(
            String search, Department department, Gender gender, 
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

            if (department != null) {
                predicates.add(cb.equal(root.get("department"), department));
            }

            if (gender != null) {
                predicates.add(cb.equal(root.get("gender"), gender));
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
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return mapToDTO(student);
    }

    public StudentResponseDTO createStudent(StudentRequestDTO dto) {
        if (studentDetailsRepo.findByRegisterNo(dto.getRegisterNo()).isPresent()) {
            throw new RuntimeException("Register number already exists");
        }
        if (studentDetailsRepo.findByRollNo(dto.getRollNo()).isPresent()) {
            throw new RuntimeException("Roll number already exists");
        }
        if (studentDetailsRepo.existsByEmailId(dto.getEmailId())) {
            throw new RuntimeException("Email already exists");
        }

        StudentDetails student = new StudentDetails();
        updateEntity(student, dto);
        student = studentDetailsRepo.save(student);
        return mapToDTO(student);
    }

    public StudentResponseDTO updateStudent(Long id, StudentRequestDTO dto) {
        StudentDetails student = studentDetailsRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (!student.getRegisterNo().equals(dto.getRegisterNo()) && studentDetailsRepo.findByRegisterNo(dto.getRegisterNo()).isPresent()) {
            throw new RuntimeException("Register number already exists");
        }
        if (!student.getRollNo().equals(dto.getRollNo()) && studentDetailsRepo.findByRollNo(dto.getRollNo()).isPresent()) {
            throw new RuntimeException("Roll number already exists");
        }
        if (!student.getEmailId().equals(dto.getEmailId()) && studentDetailsRepo.existsByEmailId(dto.getEmailId())) {
            throw new RuntimeException("Email already exists");
        }

        updateEntity(student, dto);
        student = studentDetailsRepo.save(student);
        return mapToDTO(student);
    }

    public void deleteStudent(Long id) {
        StudentDetails student = studentDetailsRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        studentDetailsRepo.delete(student);
    }

    public void bulkDeleteStudents(List<Long> ids) {
        List<StudentDetails> students = studentDetailsRepo.findAllById(ids);
        studentDetailsRepo.deleteAll(students);
    }

    private void updateEntity(StudentDetails student, StudentRequestDTO dto) {
        student.setName(dto.getName());
        student.setRegisterNo(dto.getRegisterNo());
        student.setRollNo(dto.getRollNo());
        student.setDepartment(dto.getDepartment());
        student.setGender(dto.getGender());
        student.setDob(dto.getDob());
        student.setEmailId(dto.getEmailId());
        student.setPhoneNo(dto.getPhoneNo());
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
                student.getPhoneNo()
        );
    }


    public com.hostel.MessReduction.DTO.ResDTO.AdminDashboardStatsDTO getDashboardStats() {
        com.hostel.MessReduction.DTO.ResDTO.AdminDashboardStatsDTO stats = new com.hostel.MessReduction.DTO.ResDTO.AdminDashboardStatsDTO();
        
        java.time.LocalDateTime startOfDay = java.time.LocalDate.now().atStartOfDay();
        java.time.LocalDateTime endOfDay = java.time.LocalDate.now().atTime(23, 59, 59);

        stats.setTodaysRegistrations(studentDetailsRepo.countByCreatedAtBetween(startOfDay, endOfDay) != null ? studentDetailsRepo.countByCreatedAtBetween(startOfDay, endOfDay) : 0);
        stats.setTodaysRequests(reductionFormRepo.countBySubmittedAtBetween(startOfDay, endOfDay) != null ? reductionFormRepo.countBySubmittedAtBetween(startOfDay, endOfDay) : 0);
        
        stats.setPendingAtDeputyWarden(reductionFormRepo.countByCurrentStatus(com.hostel.MessReduction.Entity.FormStatus.PendingDeputyWarden));
        stats.setPendingAtWarden(reductionFormRepo.countByCurrentStatus(com.hostel.MessReduction.Entity.FormStatus.PendingWarden));
        stats.setPendingAtOffice(reductionFormRepo.countByCurrentStatus(com.hostel.MessReduction.Entity.FormStatus.PendingOffice));
        
        stats.setApprovedToday(reductionFormHistoryRepo.countByToStatusAndEventTimestampBetween(com.hostel.MessReduction.Entity.FormStatus.Approved, startOfDay, endOfDay) != null ? reductionFormHistoryRepo.countByToStatusAndEventTimestampBetween(com.hostel.MessReduction.Entity.FormStatus.Approved, startOfDay, endOfDay) : 0);
        stats.setRejectedToday(reductionFormHistoryRepo.countByToStatusAndEventTimestampBetween(com.hostel.MessReduction.Entity.FormStatus.RejectedOffice, startOfDay, endOfDay) != null ? reductionFormHistoryRepo.countByToStatusAndEventTimestampBetween(com.hostel.MessReduction.Entity.FormStatus.RejectedOffice, startOfDay, endOfDay) : 0);
        
        stats.setTotalStaff(staffUsersRepo.count());
        stats.setTotalNotifications(0); // Optional implementation later

        // Process Departments
        java.util.Map<String, Long> studentDeptMap = new java.util.HashMap<>();
        List<Object[]> studentCounts = studentDetailsRepo.countStudentsByDepartment();
        for (Object[] result : studentCounts) {
            if (result[0] != null) {
                studentDeptMap.put(result[0].toString(), (Long) result[1]);
            }
        }
        stats.setStudentsByDepartment(studentDeptMap);

        java.util.Map<String, Long> requestDeptMap = new java.util.HashMap<>();
        List<Object[]> requestCounts = reductionFormRepo.countRequestsByDepartment();
        for (Object[] result : requestCounts) {
            if (result[0] != null) {
                requestDeptMap.put(result[0].toString(), (Long) result[1]);
            }
        }
        stats.setRequestsByDepartment(requestDeptMap);

        stats.setMonthlyRequests(new java.util.HashMap<>());
        stats.setMonthlyApprovals(new java.util.HashMap<>());
        stats.setDailyRegistrations(new java.util.HashMap<>());

        stats.setApprovalSuccessRate(0.0);
        stats.setAverageApprovalTime("0 hrs");

        return stats;
    }

    public PaginatedResponseDTO<com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO> getRequests(String search, com.hostel.MessReduction.Entity.FormStatus status, Department department, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("formId").descending());

        Specification<com.hostel.MessReduction.Entity.ReductionForm> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.join("studentDetails", jakarta.persistence.criteria.JoinType.LEFT).get("name")), searchPattern),
                        cb.like(cb.lower(root.join("studentDetails", jakarta.persistence.criteria.JoinType.LEFT).get("registerNo")), searchPattern)
                ));
            }

            if (Long.class != query.getResultType() && long.class != query.getResultType()) {
                root.fetch("studentDetails", jakarta.persistence.criteria.JoinType.LEFT);
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("currentStatus"), status));
            }

            if (department != null) {
                predicates.add(cb.equal(root.join("studentDetails").get("department"), department));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<com.hostel.MessReduction.Entity.ReductionForm> formPage = reductionFormRepo.findAll(spec, pageable);
        List<com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO> content = formPage.getContent().stream()
                .map(com.hostel.MessReduction.MappingDTO.ReductionFormMapper::mapToReductionFormResDTO)
                .collect(Collectors.toList());

        return new PaginatedResponseDTO<>(
                content, formPage.getNumber(), formPage.getSize(),
                formPage.getTotalElements(), formPage.getTotalPages(), formPage.isLast()
        );
    }

    public void forceApproveRequest(Long id) {
        com.hostel.MessReduction.Entity.ReductionForm form = reductionFormRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Form not found"));
        form.setCurrentStatus(com.hostel.MessReduction.Entity.FormStatus.Approved);
        reductionFormRepo.save(form);
    }

    public void forceRejectRequest(Long id) {
        com.hostel.MessReduction.Entity.ReductionForm form = reductionFormRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Form not found"));
        form.setCurrentStatus(com.hostel.MessReduction.Entity.FormStatus.RejectedOffice); // Generic reject
        form.setRejectReason("Force rejected by Admin");
        reductionFormRepo.save(form);
    }

    public java.util.Map<String, Object> getSettings() {
        java.util.Map<String, Object> defaultSettings = new java.util.HashMap<>();
        defaultSettings.put("systemActive", true);
        defaultSettings.put("whatsappEnabled", true);
        defaultSettings.put("pushEnabled", false);
        defaultSettings.put("cutOffTime", "17:00");
        defaultSettings.put("maxLeaveDays", 14);
        defaultSettings.put("adminEmail", "admin@gces.edu");

        List<com.hostel.MessReduction.Entity.SystemSettings> dbSettings = systemSettingsRepo.findAll();
        for (com.hostel.MessReduction.Entity.SystemSettings setting : dbSettings) {
            String val = setting.getSettingValue();
            if (val == null) continue;
            
            if (val.equalsIgnoreCase("true") || val.equalsIgnoreCase("false")) {
                defaultSettings.put(setting.getSettingKey(), Boolean.parseBoolean(val));
            } else if (val.matches("-?\\d+")) {
                defaultSettings.put(setting.getSettingKey(), Integer.parseInt(val));
            } else {
                defaultSettings.put(setting.getSettingKey(), val);
            }
        }
        return defaultSettings;
    }

    public void updateSettings(java.util.Map<String, Object> settings) {
        for (java.util.Map.Entry<String, Object> entry : settings.entrySet()) {
            if (entry.getValue() != null) {
                com.hostel.MessReduction.Entity.SystemSettings sysSetting = systemSettingsRepo.findById(entry.getKey())
                        .orElse(new com.hostel.MessReduction.Entity.SystemSettings(entry.getKey(), ""));
                sysSetting.setSettingValue(String.valueOf(entry.getValue()));
                systemSettingsRepo.save(sysSetting);
            }
        }
    }

    public void updatePassword(String oldPassword, String newPassword) {
        String currentUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        com.hostel.MessReduction.Entity.StaffUsers adminUser = staffUsersRepo.findByUserName(currentUsername)
                .orElseThrow(() -> new RuntimeException("Admin user not found"));

        if (adminUser.getPassword().startsWith("{noop}")) {
            String plainOld = adminUser.getPassword().substring(6);
            if (!plainOld.equals(oldPassword)) {
                throw new RuntimeException("Incorrect old password");
            }
        } else if (!passwordEncoder.matches(oldPassword, adminUser.getPassword())) {
            throw new RuntimeException("Incorrect old password");
        }

        adminUser.setPassword(passwordEncoder.encode(newPassword));
        staffUsersRepo.save(adminUser);
    }

    public org.springframework.data.domain.Page<com.hostel.MessReduction.Entity.ActivityLog> getActivityLogs(org.springframework.data.domain.Pageable pageable) {
        return activityLogRepository.findAll(pageable);
    }

    public byte[] exportStudents() {
        List<StudentDetails> students = studentDetailsRepo.findAll();
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Students");
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Name", "Register No", "Roll No", "Department", "Gender", "DOB (YYYY-MM-DD)", "Email ID", "Phone No"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }
            int rowIdx = 1;
            for (StudentDetails student : students) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(student.getName());
                row.createCell(1).setCellValue(student.getRegisterNo());
                row.createCell(2).setCellValue(student.getRollNo());
                row.createCell(3).setCellValue(student.getDepartment() != null ? student.getDepartment().name() : "");
                row.createCell(4).setCellValue(student.getGender() != null ? student.getGender().name() : "");
                row.createCell(5).setCellValue(student.getDob() != null ? student.getDob().toString() : "");
                row.createCell(6).setCellValue(student.getEmailId());
                row.createCell(7).setCellValue(student.getPhoneNo());
            }
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to export data to Excel file: " + e.getMessage());
        }
    }

    public void importStudents(MultipartFile file) {
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue; // Skip header
                String registerNo = getCellValueAsString(row.getCell(1));
                if (registerNo.isEmpty()) continue;

                StudentDetails student = studentDetailsRepo.findByRegisterNo(registerNo).orElse(new StudentDetails());
                
                String name = getCellValueAsString(row.getCell(0));
                if (!name.isEmpty()) student.setName(name);
                student.setRegisterNo(registerNo);
                
                String rollNo = getCellValueAsString(row.getCell(2));
                if (!rollNo.isEmpty()) student.setRollNo(rollNo);
                
                String deptStr = getCellValueAsString(row.getCell(3));
                if (!deptStr.isEmpty()) {
                    try { student.setDepartment(Department.valueOf(deptStr.toUpperCase())); } catch (Exception ignored) {}
                }
                
                String genderStr = getCellValueAsString(row.getCell(4));
                if (!genderStr.isEmpty()) {
                    try { student.setGender(Gender.valueOf(genderStr.toUpperCase())); } catch (Exception ignored) {}
                }
                
                String dobStr = getCellValueAsString(row.getCell(5));
                if (!dobStr.isEmpty()) {
                    try { student.setDob(LocalDate.parse(dobStr)); } catch (Exception ignored) {}
                }
                
                String email = getCellValueAsString(row.getCell(6));
                if (!email.isEmpty()) student.setEmailId(email);
                
                String phone = getCellValueAsString(row.getCell(7));
                if (!phone.isEmpty()) student.setPhoneNo(phone);

                // If it's a new student, ensure defaults don't violate null constraints
                if (student.getStudentId() == null) {
                    if (student.getName() == null) student.setName("Unknown");
                    if (student.getRollNo() == null) student.setRollNo(registerNo);
                    if (student.getEmailId() == null) student.setEmailId(registerNo + "@student.com");
                    if (student.getPhoneNo() == null) student.setPhoneNo("0000000000");
                    if (student.getDepartment() == null) student.setDepartment(Department.CSE);
                    if (student.getDob() == null) student.setDob(LocalDate.now());
                }

                studentDetailsRepo.save(student);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Excel file: " + e.getMessage());
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.STRING) {
            return cell.getStringCellValue().trim();
        } else if (cell.getCellType() == CellType.NUMERIC) {
            if (DateUtil.isCellDateFormatted(cell)) {
                return cell.getLocalDateTimeCellValue().toLocalDate().toString();
            }
            return String.valueOf((long) cell.getNumericCellValue());
        }
        return "";
    }
}
