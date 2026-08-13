package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.FcmToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FcmTokenRepository extends JpaRepository<FcmToken, Long> {

    Optional<FcmToken> findByToken(String token);

    List<FcmToken> findByUsernameAndActiveTrue(String username);

    List<FcmToken> findByUsernameInAndActiveTrue(List<String> usernames);

    List<FcmToken> findByUsername(String username);

    @org.springframework.transaction.annotation.Transactional
    void deleteByToken(String token);

    @org.springframework.transaction.annotation.Transactional
    void deleteByUsername(String username);

    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("UPDATE FcmToken f SET f.active = false WHERE f.token = :token")
    void deactivateToken(@Param("token") String token);

    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("UPDATE FcmToken f SET f.active = false WHERE f.username = :username AND f.token = :token")
    void deactivateUserToken(@Param("username") String username, @Param("token") String token);
}
