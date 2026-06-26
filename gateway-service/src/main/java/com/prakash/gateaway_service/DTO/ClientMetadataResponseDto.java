package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.Client;

public record ClientMetadataResponseDto(
        Long id,
        String clientName,
        Boolean active,
        String planName
) {
    public static ClientMetadataResponseDto from(Client client) {
        return new ClientMetadataResponseDto(
                client.getId(),
                client.getName(),
                client.getActive(),
                client.getPlan().getName()
        );
    }
}
