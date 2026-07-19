package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {
    Optional<PushSubscription> findByUsername(String username);
    
    @Transactional
    void deleteByUsername(String username);
    
    @Query(value = "SELECT * FROM push_subscriptions WHERE subscriptions_json LIKE CONCAT('%', :endpoint, '%')", nativeQuery = true)
    List<PushSubscription> findByEndpointLike(@Param("endpoint") String endpoint);
    
    boolean existsByUsername(String username);
}
