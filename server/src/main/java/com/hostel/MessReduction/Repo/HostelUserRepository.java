package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.readonly.HostelUser;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface HostelUserRepository extends Repository<HostelUser, String> {
    Optional<HostelUser> findById(String id);
    Optional<HostelUser> findByIdIgnoreCase(String id);
    Optional<HostelUser> findByRollNumber(Long rollNumber);
    Optional<HostelUser> findByEmail(String email);
    Optional<HostelUser> findByEmailIgnoreCase(String email);
    boolean existsByRollNumber(Long rollNumber);
}
