package com.prakash.gateaway_service.Repository;

import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Entity.PlanName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlanRepository extends JpaRepository<Plan, Long> {
    public Optional<Plan> findPlanByName(PlanName name);
    boolean existsByName(PlanName name);
}
