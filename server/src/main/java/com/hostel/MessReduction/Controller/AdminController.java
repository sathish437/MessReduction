package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ReqDTO.StudentRequestDTO;
import com.hostel.MessReduction.DTO.ResDTO.PaginatedResponseDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentResponseDTO;
import com.hostel.MessReduction.Entity.Department;
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
            @RequestParam(value = "department", required = false) Department department,
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

    @PostMapping("/students/import")
    public ResponseEntity<Void> importStudents(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        adminService.importStudents(file);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/students/export")
    public ResponseEntity<byte[]> exportStudents() {
        byte[] data = adminService.exportStudents();
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=students.xlsx");
        headers.setContentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        return ResponseEntity.ok().headers(headers).body(data);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<com.hostel.MessReduction.DTO.ResDTO.AdminDashboardStatsDTO> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/requests")
    public ResponseEntity<PaginatedResponseDTO<com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO>> getRequests(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "status", required = false) com.hostel.MessReduction.Entity.FormStatus status,
            @RequestParam(value = "department", required = false) Department department,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(adminService.getRequests(search, status, department, page, size));
    }

    @PostMapping("/requests/{id}/force-approve")
    public ResponseEntity<Void> forceApproveRequest(@PathVariable Long id) {
        adminService.forceApproveRequest(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/requests/{id}/force-reject")
    public ResponseEntity<Void> forceRejectRequest(@PathVariable Long id) {
        adminService.forceRejectRequest(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/settings")
    public ResponseEntity<java.util.Map<String, Object>> getSettings() {
        return ResponseEntity.ok(adminService.getSettings());
    }

    @PutMapping("/settings")
    public ResponseEntity<Void> updateSettings(@RequestBody java.util.Map<String, Object> settings) {
        adminService.updateSettings(settings);
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

    @GetMapping("/logs")
    public ResponseEntity<org.springframework.data.domain.Page<com.hostel.MessReduction.Entity.ActivityLog>> getActivityLogs(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                page, size, org.springframework.data.domain.Sort.by("timestamp").descending()
        );
        return ResponseEntity.ok(adminService.getActivityLogs(pageable));
    }
}
