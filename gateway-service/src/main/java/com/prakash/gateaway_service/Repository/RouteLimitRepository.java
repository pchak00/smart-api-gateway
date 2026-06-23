package com.prakash.gateaway_service.Repository;

import com.prakash.gateaway_service.Entity.RouteLimit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RouteLimitRepository extends JpaRepository<RouteLimit, Long> {
    Optional<RouteLimit> findByPlanIdAndRoutePattern(Long planId, String routePattern);
    List<RouteLimit> findByPlanId(Long planId);
    boolean existsByPlanId(Long planId);
    boolean existsByPlanIdAndRoutePattern(Long planId, String routePattern);
}
