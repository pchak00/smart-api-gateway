package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.DTO.*;
import com.prakash.gateaway_service.Service.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private AdminService adminService;


    AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/users")
    public ResponseEntity<AdminResponseDto> createAdmin(@RequestBody AdminDto request) {
        AdminResponseDto response = adminService.createAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteAdmin(@PathVariable Long id) {
        adminService.deleteAdmin(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<AdminResponseDto> updateAdminRole(
            @PathVariable Long id,
            @RequestBody UpdateAdminRoleDto request
    ) {
        AdminResponseDto response = adminService.updateAdminRole(id, request);
        return ResponseEntity.ok(response);

    }
}
