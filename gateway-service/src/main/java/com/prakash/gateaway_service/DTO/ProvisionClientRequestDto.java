package com.prakash.gateaway_service.DTO;

public record ProvisionClientRequestDto(
        String clientName,
        String planName,
        String externalReference
) {
}
