package com.prakash.gateaway_service.DTO;

public record AdminRecoveryResponseDto(
        String username,
        String role,
        String message
) {
}
