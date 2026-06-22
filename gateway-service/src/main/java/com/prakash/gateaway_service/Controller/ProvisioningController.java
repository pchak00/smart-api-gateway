package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.DTO.ProvisionClientRequestDto;
import com.prakash.gateaway_service.DTO.ProvisionClientResponseDto;
import com.prakash.gateaway_service.Service.ProvisioningService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/provisioning")
public class ProvisioningController {

    private final ProvisioningService provisioningService;

    public ProvisioningController(ProvisioningService provisioningService) {
        this.provisioningService = provisioningService;
    }

    @PostMapping("/clients")
    public ResponseEntity<ProvisionClientResponseDto> provisionClient(
            @RequestHeader(value = "X-Provisioning-Token", required = false) String provisioningToken,
            @RequestBody(required = false) ProvisionClientRequestDto request
    ) {
        ProvisionClientResponseDto response = provisioningService.provisionClient(provisioningToken, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
