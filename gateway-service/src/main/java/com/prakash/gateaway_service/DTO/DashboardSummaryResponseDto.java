package com.prakash.gateaway_service.DTO;

public record DashboardSummaryResponseDto(
        long clientCount,
        long planCount,
        long routeLimitCount,
        long totalRequests,
        long allowedRequests,
        long blockedRequests,
        long openAlertCount
) {
}
