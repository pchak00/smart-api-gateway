package com.prakash.gateaway_service.DTO;

public record AdminRecoveryRequestDto(
        String username,
        String newPassword,
        String confirmPassword
) {
}
