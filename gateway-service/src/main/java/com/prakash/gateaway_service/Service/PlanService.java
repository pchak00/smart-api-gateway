package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.PlanDto;
import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Exception.DuplicatePlanException;
import com.prakash.gateaway_service.Exception.PlanInUseException;
import com.prakash.gateaway_service.Exception.PlanNotFoundException;
import com.prakash.gateaway_service.Repository.ClientRepository;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.RouteLimitRepository;
import jakarta.transaction.Transactional;

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
        if (planRepository.existsByName(request.planName())) {
            throw new DuplicatePlanException("Plan already exists: " + request.planName());
        }

        Plan plan = new Plan();
        plan.setName(request.planName());
        plan.setRequestsPerMinute(request.requestsPerMinute());
        plan.setPrice(request.price());

        Plan savedPlan = planRepository.save(plan);

        return request;
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
}
