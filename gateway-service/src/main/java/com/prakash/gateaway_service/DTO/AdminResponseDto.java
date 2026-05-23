package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.AdminUser;

public record AdminResponseDto(String username,
                               String role) {
    public static AdminResponseDto from(AdminUser adminUser) {
        return new AdminResponseDto(adminUser.getUsername(), adminUser.getPassword());

    }
}
