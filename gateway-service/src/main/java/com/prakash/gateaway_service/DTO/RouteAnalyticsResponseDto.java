package com.prakash.gateaway_service.DTO;

import java.util.List;

public record RouteAnalyticsResponseDto(
        String route,
        String key,
        String label,
        String groupBy,
        long totalRequests,
        long allowedRequests,
        long blockedRequests,
        double blockRate,
        int endpointCount,
        List<String> rawRoutes
) {
    public RouteAnalyticsResponseDto(
            String route,
            long totalRequests,
            long allowedRequests,
            long blockedRequests
    ) {
        this(
                route,
                route,
                route,
                RouteAnalyticsGroupBy.RAW_PATH.name(),
                totalRequests,
                allowedRequests,
                blockedRequests,
                totalRequests <= 0 ? 0 : (double) blockedRequests / totalRequests,
                1,
                List.of(route)
        );
    }
}
