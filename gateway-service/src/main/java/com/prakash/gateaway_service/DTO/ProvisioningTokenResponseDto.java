package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.ProvisioningToken;

import java.time.LocalDateTime;

public record ProvisioningTokenResponseDto(
        Long id,
        String name,
        String defaultPlanName,
        Boolean active,
        LocalDateTime createdAt,
        LocalDateTime lastUsedAt
) {
    public static ProvisioningTokenResponseDto from(ProvisioningToken provisioningToken) {
        return new ProvisioningTokenResponseDto(
                provisioningToken.getId(),
                provisioningToken.getName(),
                provisioningToken.getDefaultPlanName(),
                provisioningToken.getActive(),
                provisioningToken.getCreatedAt(),
                provisioningToken.getLastUsedAt()
        );
    }
}
