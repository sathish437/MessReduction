package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.readonly.HostelStudent;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface HostelStudentRepository extends Repository<HostelStudent, String> {
    Optional<HostelStudent> findById(String userId);
    Optional<HostelStudent> findByUserId(String userId);
}
