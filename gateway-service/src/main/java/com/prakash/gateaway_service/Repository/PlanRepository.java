package com.prakash.gateaway_service.Repository;

import com.prakash.gateaway_service.Entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlanRepository extends JpaRepository<Plan, Long> {
    public Optional<Plan> findPlanByName(String name);
    boolean existsByName(String name);
    //public Optional<Plan> findPlanById(Long id);
}
