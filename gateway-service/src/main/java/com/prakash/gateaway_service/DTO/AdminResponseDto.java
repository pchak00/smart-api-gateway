package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.AdminRole;
import com.prakash.gateaway_service.Entity.AdminUser;

public record AdminResponseDto(Long id,
                               String username,
                               AdminRole role) {
    public static AdminResponseDto from(AdminUser adminUser) {
        return new AdminResponseDto(adminUser.getId(), adminUser.getUsername(), adminUser.getRole());

    }
}
