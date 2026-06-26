package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.DTO.*;
import com.prakash.gateaway_service.Service.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private AdminService adminService;


    AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/users")
    public ResponseEntity<AdminResponseDto> createAdmin(@RequestBody AdminDto request, Authentication authentication) {
        AdminResponseDto response = adminService.createAdmin(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteAdmin(@PathVariable Long id, Authentication authentication) {
        adminService.deleteAdmin(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<AdminResponseDto> updateAdminRole(
            @PathVariable Long id,
            @RequestBody UpdateAdminRoleDto request,
            Authentication authentication
    ) {
        AdminResponseDto response = adminService.updateAdminRole(id, request, authentication.getName());
        return ResponseEntity.ok(response);

    }
}
