package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.SystemSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemSettingsRepo extends JpaRepository<SystemSettings, String> {
}
