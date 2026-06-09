package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.AdminRole;

public record AdminDto(String username,
                       String password,
                       AdminRole role) {
}
