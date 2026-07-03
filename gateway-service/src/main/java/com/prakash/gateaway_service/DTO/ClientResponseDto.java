package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.Client;

import java.time.LocalDateTime;

public record ClientResponseDto(
        Long id,
        String clientName,
        String apiKey,
        Boolean active,
        String planName,
        LocalDateTime lastActiveAt
) {
    public static ClientResponseDto from(Client client) {
        return from(client, null);
    }

    public static ClientResponseDto from(Client client, LocalDateTime lastActiveAt) {
        return new ClientResponseDto(
                client.getId(),
                client.getName(),
                client.getApiKey(),
                client.getActive(),
                client.getPlan().getName(),
                lastActiveAt
        );
    }
}
