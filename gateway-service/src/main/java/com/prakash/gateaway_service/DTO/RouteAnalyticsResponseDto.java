package com.prakash.gateaway_service.DTO;

public record RouteAnalyticsResponseDto(
        String route,
        long totalRequests,
        long allowedRequests,
        long blockedRequests
) {
}
