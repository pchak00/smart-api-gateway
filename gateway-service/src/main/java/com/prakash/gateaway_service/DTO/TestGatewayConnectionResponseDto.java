package com.prakash.gateaway_service.DTO;

public record TestGatewayConnectionResponseDto(
        boolean reachable,
        Integer statusCode,
        String checkedUrl,
        long responseTimeMs,
        String message
) {
}
