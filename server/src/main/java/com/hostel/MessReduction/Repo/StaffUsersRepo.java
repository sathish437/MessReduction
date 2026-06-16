package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.Gender;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StaffUsersRepo extends JpaRepository<StaffUsers, Long> {
    Optional<StaffUsers> findByUserName(String userName);
    boolean existsByUserName(String userName);
<<<<<<< HEAD
    Optional<StaffUsers> findByRoleAndGenderAndYear(Role role, Gender gender, Integer year);
=======
    List<StaffUsers> findByRole(Role role);
<<<<<<< HEAD
    Optional<StaffUsers> findByRoleAndGenderAndYear(Role role, Gender gender, Integer year);
=======
>>>>>>> bb9c4d792e906e1356c5dbb9294dd97a1e3fcdaf
>>>>>>> 211ddc4f6dbeb17dc1364e051d1e03c746b11015
}
