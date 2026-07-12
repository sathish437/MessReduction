package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {
    List<PushSubscription> findByUsername(String username);
    
    @Transactional
    void deleteByUsername(String username);
    
    Optional<PushSubscription> findByEndpoint(String endpoint);
    
    @Transactional
    void deleteByEndpoint(String endpoint);
    
    boolean existsByUsername(String username);
}

