package com.prakash.gateaway_service.Repository;

import com.prakash.gateaway_service.Entity.RouteGroupRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RouteGroupRuleRepository extends JpaRepository<RouteGroupRule, Long> {
}
