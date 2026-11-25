package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.SystemSettings;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemSettingsRepo extends JpaRepository<SystemSettings, String> {

    @Override
    @Cacheable(value = "systemSettings", key = "#id")
    Optional<SystemSettings> findById(String id);

    @Override
    @CacheEvict(value = "systemSettings", allEntries = true)
    <S extends SystemSettings> S save(S entity);

    @Override
    @CacheEvict(value = "systemSettings", allEntries = true)
    void deleteById(String id);
}
