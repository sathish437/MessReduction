package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.DTO.ReqDTO.DepartmentReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.DepartmentResDTO;
import com.hostel.MessReduction.DTO.ResDTO.PaginatedResponseDTO;
import com.hostel.MessReduction.Entity.Department;
import com.hostel.MessReduction.Repo.DepartmentRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepo departmentRepo;

    @Cacheable(value = "activeDepartments", key = "'active_depts'")
    public List<DepartmentResDTO> getActiveDepartments() {
        return departmentRepo.findAllByIsActiveTrueOrderByDisplayOrderAscDepartmentNameAsc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<DepartmentResDTO> getAllDepartmentsList() {
        return departmentRepo.findAllByOrderByDisplayOrderAscDepartmentNameAsc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public PaginatedResponseDTO<DepartmentResDTO> getDepartmentsPaginated(
            String search, Boolean isActive, int page, int size, String sortBy, String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Department> deptPage;
        if (search != null && !search.trim().isEmpty()) {
            deptPage = departmentRepo.findByDepartmentNameContainingIgnoreCaseOrDepartmentCodeContainingIgnoreCaseOrShortNameContainingIgnoreCase(
                    search.trim(), search.trim(), search.trim(), pageable);
        } else {
            deptPage = departmentRepo.findAll(pageable);
        }

        List<DepartmentResDTO> content = deptPage.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return new PaginatedResponseDTO<>(
                content,
                deptPage.getNumber(),
                deptPage.getSize(),
                deptPage.getTotalElements(),
                deptPage.getTotalPages(),
                deptPage.isLast()
        );
    }

    public DepartmentResDTO getDepartmentById(Long id) {
        Department department = departmentRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found with ID: " + id));
        return mapToDTO(department);
    }

    public Department findEntityByCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            throw new IllegalArgumentException("Department code cannot be empty");
        }
        return departmentRepo.findByDepartmentCodeIgnoreCase(code.trim())
                .orElseGet(() -> departmentRepo.findByDepartmentNameIgnoreCase(code.trim())
                        .orElseThrow(() -> new IllegalArgumentException("Invalid Department: " + code)));
    }

    @Transactional
    @CacheEvict(value = "activeDepartments", allEntries = true)
    public DepartmentResDTO createDepartment(DepartmentReqDTO reqDTO) {
        String code = reqDTO.getDepartmentCode().trim().toUpperCase();
        String name = reqDTO.getDepartmentName().trim();

        if (departmentRepo.existsByDepartmentCodeIgnoreCase(code)) {
            throw new IllegalArgumentException("Department Code '" + code + "' already exists!");
        }

        if (departmentRepo.existsByDepartmentNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Department Name '" + name + "' already exists!");
        }

        Department department = Department.builder()
                .departmentCode(code)
                .departmentName(name)
                .shortName(reqDTO.getShortName() != null ? reqDTO.getShortName().trim() : code)
                .description(reqDTO.getDescription())
                .displayOrder(reqDTO.getDisplayOrder() != null ? reqDTO.getDisplayOrder() : 0)
                .isActive(reqDTO.getIsActive() != null ? reqDTO.getIsActive() : true)
                .build();

        Department saved = departmentRepo.save(department);
        return mapToDTO(saved);
    }

    @Transactional
    @CacheEvict(value = "activeDepartments", allEntries = true)
    public DepartmentResDTO updateDepartment(Long id, DepartmentReqDTO reqDTO) {
        Department department = departmentRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found with ID: " + id));

        String code = reqDTO.getDepartmentCode().trim().toUpperCase();
        String name = reqDTO.getDepartmentName().trim();

        if (!department.getDepartmentCode().equalsIgnoreCase(code) && departmentRepo.existsByDepartmentCodeIgnoreCase(code)) {
            throw new IllegalArgumentException("Department Code '" + code + "' already exists!");
        }

        if (!department.getDepartmentName().equalsIgnoreCase(name) && departmentRepo.existsByDepartmentNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Department Name '" + name + "' already exists!");
        }

        department.setDepartmentCode(code);
        department.setDepartmentName(name);
        if (reqDTO.getShortName() != null) department.setShortName(reqDTO.getShortName().trim());
        if (reqDTO.getDescription() != null) department.setDescription(reqDTO.getDescription());
        if (reqDTO.getDisplayOrder() != null) department.setDisplayOrder(reqDTO.getDisplayOrder());
        if (reqDTO.getIsActive() != null) department.setIsActive(reqDTO.getIsActive());

        Department saved = departmentRepo.save(department);
        return mapToDTO(saved);
    }

    @Transactional
    @CacheEvict(value = "activeDepartments", allEntries = true)
    public DepartmentResDTO toggleDepartmentStatus(Long id, Boolean isActive) {
        Department department = departmentRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found with ID: " + id));

        department.setIsActive(isActive);
        Department saved = departmentRepo.save(department);
        return mapToDTO(saved);
    }

    public DepartmentResDTO mapToDTO(Department department) {
        if (department == null) return null;
        return DepartmentResDTO.builder()
                .id(department.getId())
                .departmentCode(department.getDepartmentCode())
                .departmentName(department.getDepartmentName())
                .shortName(department.getShortName())
                .description(department.getDescription())
                .displayOrder(department.getDisplayOrder())
                .isActive(department.getIsActive())
                .createdAt(department.getCreatedAt())
                .updatedAt(department.getUpdatedAt())
                .build();
    }
}
