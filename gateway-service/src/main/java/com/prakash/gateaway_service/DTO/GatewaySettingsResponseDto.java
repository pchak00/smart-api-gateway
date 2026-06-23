package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.GatewaySettings;

import java.time.LocalDateTime;

public record GatewaySettingsResponseDto(
        String upstreamBaseUrl,
        String healthCheckPath,
        Integer timeoutMs,
        LocalDateTime updatedAt,
        String updatedBy
) {
    public static GatewaySettingsResponseDto from(GatewaySettings settings) {
        return new GatewaySettingsResponseDto(
                settings.getUpstreamBaseUrl(),
                settings.getHealthCheckPath(),
                settings.getTimeoutMs(),
                settings.getUpdatedAt(),
                settings.getUpdatedBy()
        );
    }
}
