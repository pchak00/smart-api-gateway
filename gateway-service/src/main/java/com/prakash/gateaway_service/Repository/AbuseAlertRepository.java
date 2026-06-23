package com.prakash.gateaway_service.Repository;

import com.prakash.gateaway_service.Entity.AbuseAlert;
import com.prakash.gateaway_service.Entity.AbuseAlertStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AbuseAlertRepository extends JpaRepository<AbuseAlert, Long> {
    List<AbuseAlert> findByClientIdOrderByCreatedAtDesc(Long clientId);
    List<AbuseAlert> findAllByOrderByCreatedAtDesc();
    Optional<AbuseAlert> findTopByClientIdOrderByCreatedAtDesc(Long clientId);

    @Query("""
            SELECT a FROM AbuseAlert a
            WHERE a.status = :status OR (:status = com.prakash.gateaway_service.Entity.AbuseAlertStatus.OPEN AND a.status IS NULL)
            ORDER BY a.createdAt DESC
            """)
    List<AbuseAlert> findByStatusIncludingLegacyOpen(@Param("status") AbuseAlertStatus status);

    @Query("""
            SELECT COUNT(a) FROM AbuseAlert a
            WHERE a.status = com.prakash.gateaway_service.Entity.AbuseAlertStatus.OPEN OR a.status IS NULL
            """)
    long countOpenIncludingLegacy();

    @Query(value = """
            SELECT * FROM abuse_alert a
            WHERE a.client_id = :clientId
              AND (a.status IS NULL OR a.status IN ('OPEN', 'ACKNOWLEDGED'))
            ORDER BY a.created_at DESC
            LIMIT 1
            """, nativeQuery = true)
    Optional<AbuseAlert> findLatestActiveAlert(@Param("clientId") Long clientId);
}
