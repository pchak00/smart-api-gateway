package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.DTO.ClientAnalyticsResponseDto;
import com.prakash.gateaway_service.DTO.DashboardSummaryResponseDto;
import com.prakash.gateaway_service.DTO.RouteAnalyticsResponseDto;
import com.prakash.gateaway_service.DTO.RouteTrafficAnalyticsResponseDto;
import com.prakash.gateaway_service.DTO.TrafficAnalyticsResponseDto;
import com.prakash.gateaway_service.Service.AnalyticsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/dashboard/summary")
    public DashboardSummaryResponseDto getDashboardSummary() {
        return analyticsService.getDashboardSummary();
    }

    @GetMapping("/analytics/routes")
    public List<RouteAnalyticsResponseDto> getRouteAnalytics() {
        return analyticsService.getRouteAnalytics();
    }

    @GetMapping("/analytics/clients")
    public List<ClientAnalyticsResponseDto> getClientAnalytics() {
        return analyticsService.getClientAnalytics();
    }

    @GetMapping("/analytics/traffic")
    public List<TrafficAnalyticsResponseDto> getTrafficAnalytics() {
        return analyticsService.getTrafficAnalytics();
    }

    @GetMapping("/analytics/route-traffic")
    public List<RouteTrafficAnalyticsResponseDto> getRouteTrafficAnalytics() {
        return analyticsService.getRouteTrafficAnalytics();
    }
}
