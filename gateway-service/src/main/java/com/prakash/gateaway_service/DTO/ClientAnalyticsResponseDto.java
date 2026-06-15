package com.prakash.gateaway_service.DTO;

public record ClientAnalyticsResponseDto(
        Long clientId,
        String clientName,
        long totalRequests,
        long allowedRequests,
        long blockedRequests
) {
}
