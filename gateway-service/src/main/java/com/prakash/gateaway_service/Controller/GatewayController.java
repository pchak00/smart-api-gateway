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
    private AdminService adminService;
    private AbuseDetectionService  abuseDetectionService;

    GatewayController(UsageLogService usageLogService, ClientService clientService, AbuseDetectionService abuseDetectionService,  RouteLimitService routeLimitService, PlanService planService, AdminService adminService) {
        this.usageLogService = usageLogService;
        this.clientService = clientService;
        this.planService = planService;
        this.routeLimitService = routeLimitService;
        this.adminService = adminService;
        this.abuseDetectionService = abuseDetectionService;
    }

    @PostMapping
    public ClientResponseDto createClient(@RequestBody ClientRequestDto clientRequest) {
        return clientService.addClient(clientRequest);
    }

    @DeleteMapping("/admin/clients/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        clientService.deleteClient(id);
        return ResponseEntity.noContent().build();
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

    @PostMapping("/admin/plans")
    public PlanDto createPlan(@RequestBody PlanDto planDto) {
        return planService.createPlan(planDto);
    }

    @DeleteMapping("/admin/plans")
    public void deletePlan(@RequestBody Long planId) {
        planService.deletePlan(planId);
    }

    @PostMapping("/admin/routeLimits")
    public RouteLimitDto createRouteLimit(@RequestBody RouteLimitDto routeLimitDto) {
        return routeLimitService.createRouteLimit(routeLimitDto);
    }

    @DeleteMapping("admin/routeLimits")
    public void deleteRouteLimit(@RequestBody Long routeLimitId) {
        routeLimitService.deleteRouteLimit(routeLimitId);
    }

    @PostMapping("/admin/users")
    public ResponseEntity<AdminResponseDto> createAdmin(@RequestBody AdminDto request) {
        AdminResponseDto response = adminService.createAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/admin/users/{id}")
    public ResponseEntity<Void> deleteAdmin(@PathVariable Long id) {
        adminService.deleteAdmin(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/admin/users/{id}/role")
    public ResponseEntity<AdminResponseDto> updateAdminRole(
            @PathVariable Long id,
            @RequestBody UpdateAdminRoleDto request
    ) {
        AdminResponseDto response = adminService.updateAdminRole(id, request);
        return ResponseEntity.ok(response);
    }
    @PatchMapping("/admin/clients/{id}/plan")
    public ResponseEntity<ClientResponseDto> updateClientPlan(
            @PathVariable Long id,
            @RequestBody UpdateClientPlanRequest request
    ) {
        ClientResponseDto response =
                clientService.updateClientPlan(id, request);

        return ResponseEntity.ok(response);
    }
}
