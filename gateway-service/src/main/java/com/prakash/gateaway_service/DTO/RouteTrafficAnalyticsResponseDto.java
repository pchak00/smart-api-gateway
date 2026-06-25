package com.prakash.gateaway_service.DTO;

public record RouteTrafficAnalyticsResponseDto(
        String bucket,
        String route,
        long totalRequests,
        long allowedRequests,
        long blockedRequests
) {
}
