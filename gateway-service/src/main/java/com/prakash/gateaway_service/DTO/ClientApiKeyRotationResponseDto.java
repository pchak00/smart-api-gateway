package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.Client;

import java.time.LocalDateTime;

public record ClientApiKeyRotationResponseDto(
        Long id,
        String clientName,
        String apiKey,
        String planName,
        Boolean active,
        LocalDateTime rotatedAt
) {
    public static ClientApiKeyRotationResponseDto from(Client client, LocalDateTime rotatedAt) {
        return new ClientApiKeyRotationResponseDto(
                client.getId(),
                client.getName(),
                client.getApiKey(),
                client.getPlan().getName(),
                client.getActive(),
                rotatedAt
        );
    }
}
