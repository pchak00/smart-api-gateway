package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.AbuseAlert;
import com.prakash.gateaway_service.Entity.AbuseAlertStatus;

import java.time.LocalDateTime;

public record AbuseAlertResponseDto(
        Long id,
        Long clientId,
        String clientName,
        Integer blockedCount,
        String severity,
        String message,
        AbuseAlertStatus status,
        LocalDateTime windowStart,
        LocalDateTime createdAt,
        LocalDateTime acknowledgedAt,
        String acknowledgedBy,
        LocalDateTime resolvedAt,
        String resolvedBy,
        LocalDateTime lastStatusChangedAt
) {
    public static AbuseAlertResponseDto from(AbuseAlert alert) {
        return new AbuseAlertResponseDto(
                alert.getId(),
                alert.getClient().getId(),
                alert.getClient().getName(),
                alert.getBlockedRequestCount(),
                alert.getSeverity(),
                alert.getMessage(),
                alert.getStatus() == null ? AbuseAlertStatus.OPEN : alert.getStatus(),
                alert.getWindowStart(),
                alert.getCreatedAt(),
                alert.getAcknowledgedAt(),
                alert.getAcknowledgedBy(),
                alert.getResolvedAt(),
                alert.getResolvedBy(),
                alert.getLastStatusChangedAt()
        );
    }
}
