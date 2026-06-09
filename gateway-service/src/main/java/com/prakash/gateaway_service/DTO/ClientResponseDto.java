package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.AdminUser;
import com.prakash.gateaway_service.Entity.Client;
import com.prakash.gateaway_service.Entity.PlanName;

public record ClientResponseDto(
        String clientName,
        String apiKey,
        Boolean active,
        PlanName planName
) {
    public static ClientResponseDto from(Client client) {
        return new ClientResponseDto(client.getName(), client.getApiKey(), client.getActive(), client.getPlan().getName());
    }
}
