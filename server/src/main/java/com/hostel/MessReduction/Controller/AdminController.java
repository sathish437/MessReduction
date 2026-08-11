package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ReqDTO.StudentRequestDTO;
import com.hostel.MessReduction.DTO.ResDTO.PaginatedResponseDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentResponseDTO;
import com.hostel.MessReduction.Entity.Gender;
import com.hostel.MessReduction.Service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final com.hostel.MessReduction.Service.ExtraSubmissionService extraSubmissionService;

    @GetMapping("/students")
    public ResponseEntity<PaginatedResponseDTO<StudentResponseDTO>> getStudents(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "department", required = false) String department,
            @RequestParam(value = "gender", required = false) Gender gender,
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "studentId") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "desc") String sortDir
    ) {
        return ResponseEntity.ok(adminService.getStudents(search, department, gender, year, page, size, sortBy, sortDir));
    }

    @GetMapping("/students/{id}")
    public ResponseEntity<StudentResponseDTO> getStudentById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getStudentById(id));
    }

    @PostMapping("/students")
    public ResponseEntity<StudentResponseDTO> createStudent(@Valid @RequestBody StudentRequestDTO dto) {
        return ResponseEntity.ok(adminService.createStudent(dto));
    }

    @PutMapping("/students/{id}")
    public ResponseEntity<StudentResponseDTO> updateStudent(@PathVariable Long id, @Valid @RequestBody StudentRequestDTO dto) {
        return ResponseEntity.ok(adminService.updateStudent(id, dto));
    }

    @DeleteMapping("/students/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        adminService.deleteStudent(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/students/bulk-delete")
    public ResponseEntity<Void> bulkDeleteStudents(@RequestBody List<Long> ids) {
        adminService.bulkDeleteStudents(ids);
        return ResponseEntity.ok().build();
    }



    @PutMapping("/profile/password")
    public ResponseEntity<Void> updatePassword(@RequestBody java.util.Map<String, String> passwords) {
        adminService.updatePassword(passwords.get("oldPassword"), passwords.get("newPassword"));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/extra-submissions")
    public ResponseEntity<List<com.hostel.MessReduction.Entity.ExtraSubmissionRequest>> getPendingExtraSubmissions() {
        return ResponseEntity.ok(extraSubmissionService.getAllPendingRequests());
    }

    @PostMapping("/extra-submissions/{id}/approve")
    public ResponseEntity<Void> approveExtraSubmission(@PathVariable Long id) {
        // Mock admin username as MasterAdmin for now
        extraSubmissionService.approveRequest(id, "MasterAdmin");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/extra-submissions/{id}/reject")
    public ResponseEntity<Void> rejectExtraSubmission(@PathVariable Long id) {
        extraSubmissionService.rejectRequest(id, "MasterAdmin");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/extra-submissions/bulk-approve")
    public ResponseEntity<Void> bulkApproveExtraSubmissions(@RequestBody List<Long> ids) {
        extraSubmissionService.bulkApproveRequests(ids, "MasterAdmin");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/extra-submissions/bulk-reject")
    public ResponseEntity<Void> bulkRejectExtraSubmissions(@RequestBody List<Long> ids) {
        extraSubmissionService.bulkRejectRequests(ids, "MasterAdmin");
        return ResponseEntity.ok().build();
    }

    @GetMapping("/settings/reminder-offset")
    public ResponseEntity<java.util.Map<String, Object>> getReminderOffset() {
        return ResponseEntity.ok(java.util.Map.of("reminderDays", adminService.getReminderOffsetDays()));
    }

    @PutMapping("/settings/reminder-offset")
    public ResponseEntity<java.util.Map<String, Object>> updateReminderOffset(@RequestBody java.util.Map<String, Integer> payload) {
        Integer days = payload.get("reminderDays");
        if (days == null || days < 1) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Days must be a positive integer"));
        }
        int updated = adminService.updateReminderOffsetDays(days);
        return ResponseEntity.ok(java.util.Map.of("reminderDays", updated));
    }

    @GetMapping("/staff-credentials")
    public ResponseEntity<List<com.hostel.MessReduction.DTO.ResDTO.StaffCredentialResponseDTO>> getStaffCredentials() {
        return ResponseEntity.ok(adminService.getStaffCredentials());
    }

    @PutMapping("/staff-credentials/{id}")
    public ResponseEntity<java.util.Map<String, Object>> updateStaffCredential(
            @PathVariable Long id,
            @Valid @RequestBody com.hostel.MessReduction.DTO.ReqDTO.UpdateStaffCredentialReqDTO dto) {
        return ResponseEntity.ok(adminService.updateStaffCredential(id, dto));
    }
}
