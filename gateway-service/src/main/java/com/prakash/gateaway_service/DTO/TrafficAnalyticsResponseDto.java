package com.prakash.gateaway_service.DTO;

public record TrafficAnalyticsResponseDto(
        String bucket,
        long totalRequests,
        long allowedRequests,
        long blockedRequests
) {
}
