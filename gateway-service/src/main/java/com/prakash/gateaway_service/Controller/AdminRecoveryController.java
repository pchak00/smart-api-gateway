package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.DTO.AdminRecoveryRequestDto;
import com.prakash.gateaway_service.DTO.AdminRecoveryResponseDto;
import com.prakash.gateaway_service.Service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/recovery")
public class AdminRecoveryController {

    private final AdminService adminService;

    public AdminRecoveryController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/owner")
    public ResponseEntity<AdminRecoveryResponseDto> recoverOwner(
            @RequestHeader(value = "X-Admin-Recovery-Token", required = false) String recoveryToken,
            @RequestBody(required = false) AdminRecoveryRequestDto request
    ) {
        return ResponseEntity.ok(adminService.recoverOwner(request, recoveryToken));
    }
}
