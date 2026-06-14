package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.RouteLimit;

public record RouteLimitResponse(
        Long id,
        String routePattern,
        String path,
        Integer requestsPerMinute,
        Integer requestPerMinute,
        Long planId,
        String planName
) {
    public static RouteLimitResponse from(RouteLimit routeLimit) {
        return new RouteLimitResponse(
                routeLimit.getId(),
                routeLimit.getRoutePattern(),
                routeLimit.getRoutePattern(),
                routeLimit.getRequestsPerMinute(),
                routeLimit.getRequestsPerMinute(),
                routeLimit.getPlan().getId(),
                routeLimit.getPlan().getName()
        );
    }
}
