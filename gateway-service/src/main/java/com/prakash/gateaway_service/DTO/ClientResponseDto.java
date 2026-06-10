package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.AdminUser;
import com.prakash.gateaway_service.Entity.Client;

public record ClientResponseDto(
        String clientName,
        String apiKey,
        Boolean active,
        String planName
) {
    public static ClientResponseDto from(Client client) {
        return new ClientResponseDto(client.getName(), client.getApiKey(), client.getActive(), client.getPlan().getName());
    }
}
