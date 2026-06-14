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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    public List<AbuseAlertResponseDto> findAllAbuseAlerts() {
        return abuseDetectionService.findAllAbuseAlerts();
    }

    @GetMapping("/users")
    public List<AdminResponseDto> findAllAdmins() {
        return adminService.findAllAdmins();
    }
}
