package com.prakash.gateaway_service.DTO;

public record TestGatewayConnectionRequestDto(
        String upstreamBaseUrl,
        String healthCheckPath,
        Integer timeoutMs
) {
}
