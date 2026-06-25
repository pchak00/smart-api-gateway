package com.prakash.gateaway_service.Repository;

import com.prakash.gateaway_service.Entity.UsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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
            GROUP BY u.path
            ORDER BY COUNT(u.id) DESC
            """, nativeQuery = true)
    List<Object[]> findRouteAnalytics();

    @Query(value = """
            SELECT
                c.id AS client_id,
                c.name AS client_name,
                COUNT(u.id) AS total_requests,
                SUM(CASE WHEN u.allowed = true THEN 1 ELSE 0 END) AS allowed_requests,
                SUM(CASE WHEN u.allowed = false THEN 1 ELSE 0 END) AS blocked_requests
            FROM client c
            LEFT JOIN usage_log u ON u.client_id = c.id
            GROUP BY c.id, c.name
            ORDER BY COUNT(u.id) DESC
            """, nativeQuery = true)
    List<Object[]> findClientAnalytics();

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
            JOIN top_routes tr ON tr.path = u.path
            GROUP BY CAST(u.timestamp AS date), u.path
            ORDER BY CAST(u.timestamp AS date), u.path
            """, nativeQuery = true)
    List<Object[]> findDailyRouteTrafficAnalytics();
}
