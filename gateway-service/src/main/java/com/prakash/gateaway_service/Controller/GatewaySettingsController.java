package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.DTO.GatewaySettingsResponseDto;
import com.prakash.gateaway_service.DTO.UpdateGatewaySettingsRequestDto;
import com.prakash.gateaway_service.Service.GatewaySettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/settings/gateway")
public class GatewaySettingsController {

    private final GatewaySettingsService gatewaySettingsService;

    public GatewaySettingsController(GatewaySettingsService gatewaySettingsService) {
        this.gatewaySettingsService = gatewaySettingsService;
    }

    @GetMapping
    public GatewaySettingsResponseDto getGatewaySettings() {
        return gatewaySettingsService.getGatewaySettings();
    }

    @PutMapping
    public ResponseEntity<GatewaySettingsResponseDto> updateGatewaySettings(
            @RequestBody UpdateGatewaySettingsRequestDto request
    ) {
        GatewaySettingsResponseDto response = gatewaySettingsService.updateGatewaySettings(request);
        return ResponseEntity.ok(response);
    }
}
