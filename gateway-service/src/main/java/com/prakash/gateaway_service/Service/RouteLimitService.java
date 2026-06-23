package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.RouteLimitDto;
import com.prakash.gateaway_service.DTO.RouteLimitResponse;
import com.prakash.gateaway_service.DTO.UpdateRouteLimitRequest;
import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Entity.RouteLimit;
import com.prakash.gateaway_service.Exception.InvalidRouteLimitException;
import com.prakash.gateaway_service.Exception.PlanNotFoundException;
import com.prakash.gateaway_service.Exception.RouteLimitExistException;
import com.prakash.gateaway_service.Exception.RouteLimitNotFoundException;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.RouteLimitRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class RouteLimitService {
    private static final Pattern NORMAL_PATH_SEGMENT =
            Pattern.compile("[A-Za-z0-9._~!$&'()+,;=:@%-]+");

    private RouteLimitRepository routeLimitRepository;
    private PlanRepository planRepository;
    RouteLimitService(RouteLimitRepository routeLimitRepository, PlanRepository planRepository) {
        this.routeLimitRepository = routeLimitRepository;
        this.planRepository = planRepository;
    }
    @Transactional
    public RouteLimitDto createRouteLimit(RouteLimitDto request) {
        if (request == null) {
            throw new InvalidRouteLimitException("Request body is required");
        }
        String routePattern = validateRoutePattern(request.routePattern());
        validateRequestsPerMinute(request.requestsPerMinute());

        Plan plan = planRepository.findById(request.planId())
                .orElseThrow(() ->
                        new PlanNotFoundException("Plan not found with id: " + request.planId()));
        boolean routeExist = routeLimitRepository.existsByPlanIdAndRoutePattern(request.planId(), routePattern);
        if (routeExist) {
            throw new RouteLimitExistException("Route Limit already exists");
        }
        RouteLimit routeLimit = new RouteLimit();
        routeLimit.setPlan(plan);
        routeLimit.setRoutePattern(routePattern);
        routeLimit.setRequestsPerMinute(request.requestsPerMinute());

        RouteLimit saved = routeLimitRepository.save(routeLimit);

        return new RouteLimitDto(saved.getPlan().getId(), saved.getRoutePattern(), saved.getRequestsPerMinute());
    }

    @Transactional
    public List<RouteLimitResponse> findAllRouteLimits() {
        return routeLimitRepository.findAll()
                .stream()
                .map(RouteLimitResponse::from)
                .toList();
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
        if (request == null) {
            throw new InvalidRouteLimitException("Request body is required");
        }
        String routePattern = validateRoutePattern(request.routePattern());
        validateRequestsPerMinute(request.requestPerMinute());

        RouteLimit routeLimit = routeLimitRepository.findById(routeLimitId)
                .orElseThrow(() ->
                        new RouteLimitNotFoundException(
                                "Route limit not found with id: " + routeLimitId));

        routeLimitRepository.findByPlanIdAndRoutePattern(routeLimit.getPlan().getId(), routePattern)
                .filter(existing -> !existing.getId().equals(routeLimitId))
                .ifPresent(existing -> {
                    throw new RouteLimitExistException("Route Limit already exists");
                });

        routeLimit.setRoutePattern(routePattern);
        routeLimit.setRequestsPerMinute(request.requestPerMinute());

        RouteLimit saved = routeLimitRepository.save(routeLimit);

        return RouteLimitResponse.from(saved);
    }

    private String validateRoutePattern(String routePattern) {
        if (routePattern == null || routePattern.isBlank()) {
            throw new InvalidRouteLimitException("Route pattern is required");
        }

        String normalized = routePattern.trim();
        if (!normalized.startsWith("/")) {
            throw new InvalidRouteLimitException("Route pattern must start with /");
        }
        if (normalized.length() == 1) {
            throw new InvalidRouteLimitException("Route pattern must include at least one path segment");
        }
        if (normalized.contains("//")) {
            throw new InvalidRouteLimitException("Route pattern must not contain empty path segments");
        }

        String[] segments = normalized.substring(1).split("/");
        boolean hasMultiSegmentWildcard = false;
        for (int i = 0; i < segments.length; i++) {
            String segment = segments[i];
            if ("**".equals(segment)) {
                if (i != segments.length - 1) {
                    throw new InvalidRouteLimitException("** wildcard may only appear at the end of a route pattern");
                }
                if (hasMultiSegmentWildcard) {
                    throw new InvalidRouteLimitException("Route pattern may contain only one ** wildcard");
                }
                hasMultiSegmentWildcard = true;
                continue;
            }
            if ("*".equals(segment)) {
                continue;
            }
            if (segment.contains("*")) {
                throw new InvalidRouteLimitException("* wildcards must be whole path segments");
            }
            if (!NORMAL_PATH_SEGMENT.matcher(segment).matches()) {
                throw new InvalidRouteLimitException("Route pattern contains unsupported path characters");
            }
        }

        return normalized;
    }

    private void validateRequestsPerMinute(Integer requestsPerMinute) {
        if (requestsPerMinute == null || requestsPerMinute <= 0) {
            throw new InvalidRouteLimitException("Requests per minute must be greater than zero");
        }
    }
}
