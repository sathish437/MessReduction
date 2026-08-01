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
    private final DepartmentService departmentService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

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
                predicates.add(cb.or(
                        cb.equal(cb.lower(root.get("department").get("departmentCode")), d),
                        cb.equal(cb.lower(root.get("department").get("shortName")), d),
                        cb.equal(cb.lower(root.get("department").get("departmentName")), d)
                ));
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
                .orElseThrow(() -> new RuntimeException("Student not found"));
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
                .orElseThrow(() -> new RuntimeException("Student not found"));

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
}
