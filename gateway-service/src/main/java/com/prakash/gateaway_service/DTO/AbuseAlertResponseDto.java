package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.AbuseAlert;

import java.time.LocalDateTime;

public record AbuseAlertResponseDto(
        Long id,
        Long clientId,
        String clientName,
        Integer blockedCount,
        String severity,
        String message,
        LocalDateTime windowStart,
        LocalDateTime createdAt
) {
    public static AbuseAlertResponseDto from(AbuseAlert alert) {
        return new AbuseAlertResponseDto(
                alert.getId(),
                alert.getClient().getId(),
                alert.getClient().getName(),
                alert.getBlockedRequestCount(),
                alert.getSeverity(),
                alert.getMessage(),
                alert.getWindowStart(),
                alert.getCreatedAt()
        );
    }
}
