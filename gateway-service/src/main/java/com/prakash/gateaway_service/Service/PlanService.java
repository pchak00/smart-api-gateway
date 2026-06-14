package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.PlanDto;
import com.prakash.gateaway_service.DTO.PlanResponseDto;
import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Exception.DuplicatePlanException;
import com.prakash.gateaway_service.Exception.InvalidPlanException;
import com.prakash.gateaway_service.Exception.PlanInUseException;
import com.prakash.gateaway_service.Exception.PlanNotFoundException;
import com.prakash.gateaway_service.Repository.ClientRepository;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.RouteLimitRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class PlanService {
    private static final int MAX_PLAN_NAME_LENGTH = 64;
    private static final Pattern SAFE_PLAN_NAME_PATTERN = Pattern.compile("[A-Za-z0-9 _-]+");

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
        String planName = validatePlanName(request.planName());
        validateRequestsPerMinute(request.requestsPerMinute());
        validatePrice(request.price());

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

    private String validatePlanName(String planName) {
        if (planName == null || planName.isBlank()) {
            throw new InvalidPlanException("Plan name is required");
        }

        String normalized = planName.trim();
        if (normalized.length() > MAX_PLAN_NAME_LENGTH) {
            throw new InvalidPlanException("Plan name must be " + MAX_PLAN_NAME_LENGTH + " characters or fewer");
        }

        if (!SAFE_PLAN_NAME_PATTERN.matcher(normalized).matches()) {
            throw new InvalidPlanException("Plan name may only contain letters, numbers, spaces, hyphens, and underscores");
        }

        return normalized;
    }

    private void validateRequestsPerMinute(Integer requestsPerMinute) {
        if (requestsPerMinute == null || requestsPerMinute <= 0) {
            throw new InvalidPlanException("Requests per minute must be greater than zero");
        }
    }

    private void validatePrice(Double price) {
        if (price == null || price.isNaN() || price.isInfinite() || price < 0) {
            throw new InvalidPlanException("Price must be zero or greater");
        }
    }
}
