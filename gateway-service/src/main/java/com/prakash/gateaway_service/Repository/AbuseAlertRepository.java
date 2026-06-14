package com.prakash.gateaway_service.Repository;

import com.prakash.gateaway_service.Entity.AbuseAlert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AbuseAlertRepository extends JpaRepository<AbuseAlert, Long> {
    List<AbuseAlert> findByClientIdOrderByCreatedAtDesc(Long clientId);
    List<AbuseAlert> findAllByOrderByCreatedAtDesc();
    Optional<AbuseAlert> findTopByClientIdOrderByCreatedAtDesc(Long clientId);
}
