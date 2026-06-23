package com.prakash.gateaway_service.DTO;

public record CreateProvisioningTokenRequestDto(
        String name,
        String defaultPlanName
) {
}
