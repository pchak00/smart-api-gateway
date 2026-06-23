package com.prakash.gateaway_service.DTO;

public record UpdateGatewaySettingsRequestDto(
        String upstreamBaseUrl,
        String healthCheckPath,
        Integer timeoutMs
) {
}
