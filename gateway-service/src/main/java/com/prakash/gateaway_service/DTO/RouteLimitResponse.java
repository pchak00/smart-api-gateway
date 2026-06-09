package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.PlanName;
import com.prakash.gateaway_service.Entity.RouteLimit;

public record RouteLimitResponse(String path,
                                 Integer requestPerMinute,
                                 PlanName planName) {
    public static RouteLimitResponse from(RouteLimit routeLimit) {
        return new RouteLimitResponse(routeLimit.getRoutePattern(), routeLimit.getRequestsPerMinute(), routeLimit.getPlan().getName());
    }
}
