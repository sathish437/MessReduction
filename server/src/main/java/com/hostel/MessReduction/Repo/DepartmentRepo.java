package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepo extends JpaRepository<Department, Long>, JpaSpecificationExecutor<Department> {

    Optional<Department> findByDepartmentCodeIgnoreCase(String departmentCode);

    Optional<Department> findByDepartmentNameIgnoreCase(String departmentName);

    Boolean existsByDepartmentCodeIgnoreCase(String departmentCode);

    Boolean existsByDepartmentNameIgnoreCase(String departmentName);

    List<Department> findAllByIsActiveTrueOrderByDisplayOrderAscDepartmentNameAsc();

    List<Department> findAllByOrderByDisplayOrderAscDepartmentNameAsc();

    Page<Department> findByDepartmentNameContainingIgnoreCaseOrDepartmentCodeContainingIgnoreCaseOrShortNameContainingIgnoreCase(
            String name, String code, String shortName, Pageable pageable);
}
