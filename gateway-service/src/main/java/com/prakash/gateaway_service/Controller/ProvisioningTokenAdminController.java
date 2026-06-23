package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.DTO.CreateProvisioningTokenRequestDto;
import com.prakash.gateaway_service.DTO.CreateProvisioningTokenResponseDto;
import com.prakash.gateaway_service.DTO.ProvisioningTokenResponseDto;
import com.prakash.gateaway_service.Service.ProvisioningService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/provisioning-tokens")
public class ProvisioningTokenAdminController {

    private final ProvisioningService provisioningService;

    public ProvisioningTokenAdminController(ProvisioningService provisioningService) {
        this.provisioningService = provisioningService;
    }

    @GetMapping
    public List<ProvisioningTokenResponseDto> findAllProvisioningTokens() {
        return provisioningService.findAllProvisioningTokens();
    }

    @PostMapping
    public ResponseEntity<CreateProvisioningTokenResponseDto> createProvisioningToken(
            @RequestBody CreateProvisioningTokenRequestDto request
    ) {
        CreateProvisioningTokenResponseDto response = provisioningService.createProvisioningToken(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}/disable")
    public ProvisioningTokenResponseDto disableProvisioningToken(@PathVariable Long id) {
        return provisioningService.disableProvisioningToken(id);
    }
}
