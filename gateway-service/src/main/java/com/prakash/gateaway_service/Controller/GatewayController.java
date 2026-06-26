package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.DTO.*;
import com.prakash.gateaway_service.Service.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/clients")
public class GatewayController {

    private UsageLogService usageLogService;
    private ClientService clientService;
    private PlanService planService;
    private RouteLimitService routeLimitService;
    private AbuseDetectionService  abuseDetectionService;

    GatewayController(UsageLogService usageLogService, ClientService clientService, AbuseDetectionService abuseDetectionService,  RouteLimitService routeLimitService, PlanService planService) {
        this.usageLogService = usageLogService;
        this.clientService = clientService;
        this.planService = planService;
        this.routeLimitService = routeLimitService;
        this.abuseDetectionService = abuseDetectionService;
    }

    @PostMapping
    public ClientResponseDto createClient(@RequestBody ClientRequestDto clientRequest) {
        return clientService.addClient(clientRequest);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        clientService.deleteClient(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/rotate-api-key")
    public ResponseEntity<ClientApiKeyRotationResponseDto> rotateApiKey(@PathVariable Long id) {
        ClientApiKeyRotationResponseDto response = clientService.rotateApiKey(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/disable")
    public ResponseEntity<ClientMetadataResponseDto> disableClient(@PathVariable Long id) {
        ClientMetadataResponseDto response = clientService.disableClient(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/enable")
    public ResponseEntity<ClientMetadataResponseDto> enableClient(@PathVariable Long id) {
        ClientMetadataResponseDto response = clientService.enableClient(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public List<ClientResponseDto> showAllClient() {
        return clientService.showAllClients();
    }

    @GetMapping("{clientId}/usage")
    public List<UsageLogResponseDto> findByClientIdOrderByTimestampDesc(@PathVariable Long clientId) {
        return usageLogService.getUsageByClient(clientId);
    }

    @GetMapping("{clientId}/stats")
    public ClientStatsResponseDto findClientStats(@PathVariable Long clientId) {
        return clientService.getStats(clientId);
    }

    @GetMapping("{clientId}/abuse")
    public List<AbuseAlertResponseDto> findClientAbuse(@PathVariable Long clientId) {
        return abuseDetectionService.findClientAbuse(clientId);
    }

    @PatchMapping("/{id}/plan")
    public ResponseEntity<ClientResponseDto> updateClientPlan(
            @PathVariable Long id,
            @RequestBody UpdateClientPlanRequest request
    ) {
        ClientResponseDto response =
                clientService.updateClientPlan(id, request);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/plans")
    public PlanDto createPlan(@RequestBody PlanDto planDto) {
        return planService.createPlan(planDto);
    }

    @PatchMapping("/plans/{id}")
    public ResponseEntity<PlanResponseDto> updatePlan(
            @PathVariable Long id,
            @RequestBody PlanDto planDto
    ) {
        PlanResponseDto response = planService.updatePlan(id, planDto);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/plans/{id}")
    public ResponseEntity<Void> deletePlan(@PathVariable Long id) {
        planService.deletePlan(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/routeLimits")
    public RouteLimitDto createRouteLimit(@RequestBody RouteLimitDto routeLimitDto) {
        return routeLimitService.createRouteLimit(routeLimitDto);
    }

    @DeleteMapping("/route-limits/{id}")
    public ResponseEntity<Void> deleteRouteLimit(@PathVariable Long id) {
        routeLimitService.deleteRouteLimit(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/route-limits/{id}")
    public ResponseEntity<RouteLimitResponse> updateRouteLimit(
            @PathVariable Long id,
            @RequestBody UpdateRouteLimitRequest request
    ) {
        RouteLimitResponse response =
                routeLimitService.updateRouteLimit(id, request);

        return ResponseEntity.ok(response);
    }
}
