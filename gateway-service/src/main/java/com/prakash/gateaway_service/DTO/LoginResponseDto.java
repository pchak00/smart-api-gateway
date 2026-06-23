package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.AdminRole;

public record LoginResponseDto(
        String token,
        String refreshToken,
        String username,
        AdminRole role,
        long expiresInMs
) {
}
