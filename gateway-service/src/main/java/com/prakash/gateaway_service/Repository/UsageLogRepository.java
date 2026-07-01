package com.prakash.gateaway_service.Repository;

import com.prakash.gateaway_service.Entity.UsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
@Repository
public interface UsageLogRepository extends JpaRepository<UsageLog, Long> {
    public List<UsageLog> findByClientIdOrderByTimestampDesc(Long clientId);


    long countByClientId(Long clientId);
    long countByClientIdAndAllowed(Long clientId, Boolean allowed);
    long countByAllowed(Boolean allowed);

    long countByClientIdAndAllowedFalseAndTimestampAfter(
            Long clientId,
            LocalDateTime time
    );

    @Query(value = """
            SELECT
                u.path AS route,
                COUNT(u.id) AS total_requests,
                SUM(CASE WHEN u.allowed = true THEN 1 ELSE 0 END) AS allowed_requests,
                SUM(CASE WHEN u.allowed = false THEN 1 ELSE 0 END) AS blocked_requests
            FROM usage_log u
            JOIN client c ON c.id = u.client_id
            JOIN plan p ON p.id = c.plan_id
            WHERE (:planName IS NULL OR LOWER(p.name) = LOWER(:planName))
            GROUP BY u.path
            ORDER BY COUNT(u.id) DESC
            """, nativeQuery = true)
    List<Object[]> findRouteAnalytics(@Param("planName") String planName);

    @Query(value = """
            SELECT
                c.id AS client_id,
                c.name AS client_name,
                p.id AS plan_id,
                p.name AS plan_name,
                COUNT(u.id) AS total_requests,
                SUM(CASE WHEN u.allowed = true THEN 1 ELSE 0 END) AS allowed_requests,
                SUM(CASE WHEN u.allowed = false THEN 1 ELSE 0 END) AS blocked_requests
            FROM client c
            JOIN plan p ON p.id = c.plan_id
            LEFT JOIN usage_log u ON u.client_id = c.id
            WHERE (:planName IS NULL OR LOWER(p.name) = LOWER(:planName))
            GROUP BY c.id, c.name, p.id, p.name
            ORDER BY COUNT(u.id) DESC
            """, nativeQuery = true)
    List<Object[]> findClientAnalytics(@Param("planName") String planName);

    @Query(value = """
            SELECT
                CAST(u.timestamp AS date) AS bucket,
                COUNT(u.id) AS total_requests,
                SUM(CASE WHEN u.allowed = true THEN 1 ELSE 0 END) AS allowed_requests,
                SUM(CASE WHEN u.allowed = false THEN 1 ELSE 0 END) AS blocked_requests
            FROM usage_log u
            GROUP BY CAST(u.timestamp AS date)
            ORDER BY CAST(u.timestamp AS date)
            """, nativeQuery = true)
    List<Object[]> findDailyTrafficAnalytics();

    @Query(value = """
            WITH top_routes AS (
                SELECT u.path
                FROM usage_log u
                JOIN client c ON c.id = u.client_id
                JOIN plan p ON p.id = c.plan_id
                WHERE (:planName IS NULL OR LOWER(p.name) = LOWER(:planName))
                GROUP BY u.path
                ORDER BY COUNT(u.id) DESC
                LIMIT 5
            )
            SELECT
                CAST(u.timestamp AS date) AS bucket,
                u.path AS route,
                COUNT(u.id) AS total_requests,
                SUM(CASE WHEN u.allowed = true THEN 1 ELSE 0 END) AS allowed_requests,
                SUM(CASE WHEN u.allowed = false THEN 1 ELSE 0 END) AS blocked_requests
            FROM usage_log u
            JOIN client c ON c.id = u.client_id
            JOIN plan p ON p.id = c.plan_id
            JOIN top_routes tr ON tr.path = u.path
            WHERE (:planName IS NULL OR LOWER(p.name) = LOWER(:planName))
            GROUP BY CAST(u.timestamp AS date), u.path
            ORDER BY CAST(u.timestamp AS date), u.path
            """, nativeQuery = true)
    List<Object[]> findDailyRouteTrafficAnalytics(@Param("planName") String planName);
}
