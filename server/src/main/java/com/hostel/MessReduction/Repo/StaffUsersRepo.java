package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.Gender;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.StaffUsers;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StaffUsersRepo extends JpaRepository<StaffUsers, Long> {
    Optional<StaffUsers> findByUserName(String userName);
    boolean existsByUserName(String userName);
    Optional<StaffUsers> findByRoleAndGenderAndYear(Role role, Gender gender, Integer year);
    List<StaffUsers> findByRole(Role role);
}
