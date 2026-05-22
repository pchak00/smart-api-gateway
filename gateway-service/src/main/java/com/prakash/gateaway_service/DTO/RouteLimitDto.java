package com.prakash.gateaway_service.DTO;

public record RouteLimitDto(Long planId,
                            String routePattern,
                            Integer requestsPerMinute) {
}
