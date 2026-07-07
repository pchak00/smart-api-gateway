package com.prakash.gateaway_service.DTO;

import java.util.List;

public record RouteTrafficAnalyticsResponseDto(
        String bucket,
        String route,
        String key,
        String label,
        String groupBy,
        long totalRequests,
        long allowedRequests,
        long blockedRequests,
        int endpointCount,
        List<String> rawRoutes
) {
    public RouteTrafficAnalyticsResponseDto(
            String bucket,
            String route,
            long totalRequests,
            long allowedRequests,
            long blockedRequests
    ) {
        this(
                bucket,
                route,
                route,
                route,
                RouteAnalyticsGroupBy.RAW_PATH.name(),
                totalRequests,
                allowedRequests,
                blockedRequests,
                1,
                List.of(route)
        );
    }
}
