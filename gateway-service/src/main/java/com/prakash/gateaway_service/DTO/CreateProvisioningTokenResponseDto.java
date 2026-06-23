package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.ProvisioningToken;

import java.time.LocalDateTime;

public record CreateProvisioningTokenResponseDto(
        Long id,
        String name,
        String token,
        String defaultPlanName,
        Boolean active,
        LocalDateTime createdAt,
        LocalDateTime lastUsedAt
) {
    public static CreateProvisioningTokenResponseDto from(ProvisioningToken provisioningToken, String rawToken) {
        return new CreateProvisioningTokenResponseDto(
                provisioningToken.getId(),
                provisioningToken.getName(),
                rawToken,
                provisioningToken.getDefaultPlanName(),
                provisioningToken.getActive(),
                provisioningToken.getCreatedAt(),
                provisioningToken.getLastUsedAt()
        );
    }
}
