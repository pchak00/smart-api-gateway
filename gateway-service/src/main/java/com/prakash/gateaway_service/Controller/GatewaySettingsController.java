package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.DTO.GatewaySettingsResponseDto;
import com.prakash.gateaway_service.DTO.TestGatewayConnectionRequestDto;
import com.prakash.gateaway_service.DTO.TestGatewayConnectionResponseDto;
import com.prakash.gateaway_service.DTO.UpdateGatewaySettingsRequestDto;
import com.prakash.gateaway_service.Service.GatewayConnectionTestService;
import com.prakash.gateaway_service.Service.GatewaySettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/settings/gateway")
public class GatewaySettingsController {

    private final GatewaySettingsService gatewaySettingsService;
    private final GatewayConnectionTestService gatewayConnectionTestService;

    public GatewaySettingsController(
            GatewaySettingsService gatewaySettingsService,
            GatewayConnectionTestService gatewayConnectionTestService
    ) {
        this.gatewaySettingsService = gatewaySettingsService;
        this.gatewayConnectionTestService = gatewayConnectionTestService;
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

    @PostMapping("/test-connection")
    public ResponseEntity<TestGatewayConnectionResponseDto> testGatewayConnection(
            @RequestBody(required = false) TestGatewayConnectionRequestDto request
    ) {
        TestGatewayConnectionResponseDto response = gatewayConnectionTestService.testConnection(request);
        return ResponseEntity.ok(response);
    }
}
