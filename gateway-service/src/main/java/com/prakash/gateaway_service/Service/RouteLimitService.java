package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.RouteLimitDto;
import com.prakash.gateaway_service.DTO.RouteLimitResponse;
import com.prakash.gateaway_service.DTO.UpdateRouteLimitRequest;
import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Entity.RouteLimit;
import com.prakash.gateaway_service.Exception.PlanNotFoundException;
import com.prakash.gateaway_service.Exception.RouteLimitExistException;
import com.prakash.gateaway_service.Exception.RouteLimitNotFoundException;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.RouteLimitRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class RouteLimitService {
    private RouteLimitRepository routeLimitRepository;
    private PlanRepository planRepository;
    RouteLimitService(RouteLimitRepository routeLimitRepository, PlanRepository planRepository) {
        this.routeLimitRepository = routeLimitRepository;
        this.planRepository = planRepository;
    }
    @Transactional
    public RouteLimitDto createRouteLimit(RouteLimitDto request) {
        Plan plan = planRepository.findById(request.planId())
                .orElseThrow(() ->
                        new PlanNotFoundException("Plan not found with id: " + request.planId()));
        boolean routeExist = routeLimitRepository.existsByPlanIdAndRoutePattern(request.planId(), request.routePattern());
        if (routeExist) {
            throw new RouteLimitExistException("Route Limit already exists");
        }
        RouteLimit routeLimit = new RouteLimit();
        routeLimit.setPlan(plan);
        routeLimit.setRoutePattern(request.routePattern());
        routeLimit.setRequestsPerMinute(request.requestsPerMinute());

        routeLimitRepository.save(routeLimit);

        return request;
    }

    @Transactional
    public void deleteRouteLimit(Long routeLimitId) {
        RouteLimit routeLimit = routeLimitRepository.findById(routeLimitId)
                .orElseThrow(() ->
                        new RouteLimitNotFoundException("Route limit not found with id: " + routeLimitId));

        routeLimitRepository.delete(routeLimit);
    }

    @Transactional
    public RouteLimitResponse updateRouteLimit(
            Long routeLimitId,
            UpdateRouteLimitRequest request
    ) {
        RouteLimit routeLimit = routeLimitRepository.findById(routeLimitId)
                .orElseThrow(() ->
                        new RouteLimitNotFoundException(
                                "Route limit not found with id: " + routeLimitId));

        routeLimit.setRoutePattern(request.routePattern());
        routeLimit.setRequestsPerMinute(request.requestPerMinute());

        RouteLimit saved = routeLimitRepository.save(routeLimit);

        return RouteLimitResponse.from(saved);
    }
}
