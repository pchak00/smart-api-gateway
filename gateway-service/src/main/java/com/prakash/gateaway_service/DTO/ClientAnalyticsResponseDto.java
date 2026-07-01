package com.prakash.gateaway_service.DTO;

public record ClientAnalyticsResponseDto(
        Long clientId,
        String clientName,
        Long planId,
        String planName,
        long totalRequests,
        long allowedRequests,
        long blockedRequests
) {
}
