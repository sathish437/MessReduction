package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.AutoAcceptSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AutoAcceptSettingsRepo extends JpaRepository<AutoAcceptSettings, Long> {
    Optional<AutoAcceptSettings> findByUsername(String username);
}
