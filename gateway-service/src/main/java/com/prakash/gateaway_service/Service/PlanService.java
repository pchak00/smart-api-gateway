package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.AllowedPlanName;
import com.prakash.gateaway_service.DTO.PlanDto;
import com.prakash.gateaway_service.DTO.PlanResponseDto;
import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Exception.DuplicatePlanException;
import com.prakash.gateaway_service.Exception.InvalidPlanNameException;
import com.prakash.gateaway_service.Exception.PlanInUseException;
import com.prakash.gateaway_service.Exception.PlanNotFoundException;
import com.prakash.gateaway_service.Repository.ClientRepository;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.RouteLimitRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlanService {
    private PlanRepository planRepository;
    private ClientRepository  clientRepository;
    private RouteLimitRepository routeLimitRepository;
    public PlanService(PlanRepository planRepository, ClientRepository clientRepository, RouteLimitRepository routeLimitRepository) {
        this.planRepository = planRepository;
        this.clientRepository = clientRepository;
        this.routeLimitRepository = routeLimitRepository;
    }
    @Transactional
    public PlanDto createPlan(PlanDto request) {
        String planName = normalizePlanName(request.planName());

        if (planRepository.existsByName(planName)) {
            throw new DuplicatePlanException("Plan already exists: " + planName);
        }

        Plan plan = new Plan();
        plan.setName(planName);
        plan.setRequestsPerMinute(request.requestsPerMinute());
        plan.setPrice(request.price());

        planRepository.save(plan);

        return new PlanDto(planName, request.requestsPerMinute(), request.price());
    }

    public List<PlanResponseDto> findAllPlans() {
        return planRepository.findAll()
                .stream()
                .map(PlanResponseDto::from)
                .toList();
    }

    @Transactional
    public void deletePlan(Long planId) {

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() ->
                        new PlanNotFoundException("Plan not found with id: " + planId));

        if (clientRepository.existsByPlanId(planId)) {
            throw new PlanInUseException(
                    "Cannot delete plan because clients are assigned to it");
        }

        if (routeLimitRepository.existsByPlanId(planId)) {
            throw new PlanInUseException(
                    "Cannot delete plan because route limits are using it");
        }

        planRepository.delete(plan);
    }

    private String normalizePlanName(String planName) {
        if (planName == null || planName.isBlank()) {
            throw new InvalidPlanNameException("Plan name is required");
        }

        String normalized = planName.trim().toUpperCase();
        try {
            AllowedPlanName.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            throw new InvalidPlanNameException("Unsupported plan name: " + planName);
        }

        return normalized;
    }
}
