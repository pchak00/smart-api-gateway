package com.prakash.gateaway_service.DTO;

public record AdminPasswordResetRequestDto(
        String newPassword,
        String confirmPassword
) {
}
