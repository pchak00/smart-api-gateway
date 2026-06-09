package com.prakash.gateaway_service.DTO;

public record UpdateRouteLimitRequest(
        String routePattern,
        Integer requestPerMinute
) {
}
