package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.Client;

public record ProvisionClientResponseDto(
        Long id,
        String clientName,
        String apiKey,
        String planName,
        Boolean active,
        String externalReference
) {
    public static ProvisionClientResponseDto from(Client client) {
        return new ProvisionClientResponseDto(
                client.getId(),
                client.getName(),
                client.getApiKey(),
                client.getPlan().getName(),
                client.getActive(),
                client.getExternalReference()
        );
    }
}
