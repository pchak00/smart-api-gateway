package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.DTO.AbuseAlertResponseDto;
import com.prakash.gateaway_service.DTO.AdminResponseDto;
import com.prakash.gateaway_service.DTO.PlanResponseDto;
import com.prakash.gateaway_service.DTO.RouteLimitResponse;
import com.prakash.gateaway_service.Service.AbuseDetectionService;
import com.prakash.gateaway_service.Service.AdminService;
import com.prakash.gateaway_service.Service.PlanService;
import com.prakash.gateaway_service.Service.RouteLimitService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminReadController {

    private final PlanService planService;
    private final RouteLimitService routeLimitService;
    private final AbuseDetectionService abuseDetectionService;
    private final AdminService adminService;

    AdminReadController(
            PlanService planService,
            RouteLimitService routeLimitService,
            AbuseDetectionService abuseDetectionService,
            AdminService adminService
    ) {
        this.planService = planService;
        this.routeLimitService = routeLimitService;
        this.abuseDetectionService = abuseDetectionService;
        this.adminService = adminService;
    }

    @GetMapping("/plans")
    public List<PlanResponseDto> findAllPlans() {
        return planService.findAllPlans();
    }

    @GetMapping("/route-limits")
    public List<RouteLimitResponse> findAllRouteLimits() {
        return routeLimitService.findAllRouteLimits();
    }

    @GetMapping("/abuse-alerts")
    public List<AbuseAlertResponseDto> findAllAbuseAlerts(@RequestParam(required = false) String status) {
        return abuseDetectionService.findAllAbuseAlerts(status);
    }

    @PatchMapping("/abuse-alerts/{id}/acknowledge")
    public AbuseAlertResponseDto acknowledgeAbuseAlert(@PathVariable Long id, Principal principal) {
        return abuseDetectionService.acknowledgeAlert(id, principal == null ? null : principal.getName());
    }

    @PatchMapping("/abuse-alerts/{id}/resolve")
    public AbuseAlertResponseDto resolveAbuseAlert(@PathVariable Long id, Principal principal) {
        return abuseDetectionService.resolveAlert(id, principal == null ? null : principal.getName());
    }

    @GetMapping("/users")
    public List<AdminResponseDto> findAllAdmins() {
        return adminService.findAllAdmins();
    }
}
