package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ReqDTO.DepartmentReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.DepartmentResDTO;
import com.hostel.MessReduction.DTO.ResDTO.PaginatedResponseDTO;
import com.hostel.MessReduction.Service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping("/active")
    public ResponseEntity<List<DepartmentResDTO>> getActiveDepartments() {
        return ResponseEntity.ok(departmentService.getActiveDepartments());
    }

    @GetMapping
    public ResponseEntity<?> getDepartments(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(defaultValue = "displayOrder") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false, defaultValue = "false") boolean paged) {

        if (!paged && (search == null || search.trim().isEmpty())) {
            return ResponseEntity.ok(departmentService.getAllDepartmentsList());
        }

        PaginatedResponseDTO<DepartmentResDTO> result = departmentService.getDepartmentsPaginated(
                search, isActive, page, size, sortBy, sortDir);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DepartmentResDTO> getDepartmentById(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getDepartmentById(id));
    }

    @PostMapping
    public ResponseEntity<DepartmentResDTO> createDepartment(@Valid @RequestBody DepartmentReqDTO reqDTO) {
        DepartmentResDTO created = departmentService.createDepartment(reqDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DepartmentResDTO> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody DepartmentReqDTO reqDTO) {
        DepartmentResDTO updated = departmentService.updateDepartment(id, reqDTO);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<DepartmentResDTO> toggleDepartmentStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> statusMap) {
        Boolean isActive = statusMap.getOrDefault("isActive", true);
        DepartmentResDTO updated = departmentService.toggleDepartmentStatus(id, isActive);
        return ResponseEntity.ok(updated);
    }
}
