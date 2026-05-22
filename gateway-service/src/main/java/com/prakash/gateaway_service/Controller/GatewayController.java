package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.DTO.*;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/clients")
public class GatewayController {

    private UsageLogService usageLogService;
    private ClientService clientService;
    private AbuseDetectionService abuseDetectionService;
    private PlanRepository planRepository;
    private PlanService planService;
    private RouteLimitService routeLimitService;

    GatewayController(UsageLogService usageLogService, ClientService clientService, AbuseDetectionService abuseDetectionService, PlanRepository planRepository,  RouteLimitService routeLimitService, PlanService planService) {
        this.usageLogService = usageLogService;
        this.clientService = clientService;
        this.abuseDetectionService = abuseDetectionService;
        this.planRepository = planRepository;
        this.planService = planService;
        this.routeLimitService = routeLimitService;
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

}
