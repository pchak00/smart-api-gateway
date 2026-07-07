package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.DTO.ClientAnalyticsResponseDto;
import com.prakash.gateaway_service.DTO.DashboardSummaryResponseDto;
import com.prakash.gateaway_service.DTO.RouteAnalyticsGroupBy;
import com.prakash.gateaway_service.DTO.RouteAnalyticsResponseDto;
import com.prakash.gateaway_service.DTO.RouteTrafficAnalyticsResponseDto;
import com.prakash.gateaway_service.DTO.TrafficAnalyticsResponseDto;
import com.prakash.gateaway_service.Service.AnalyticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
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
    public List<RouteAnalyticsResponseDto> getRouteAnalytics(
            @RequestParam(required = false) String planName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "OPERATION") RouteAnalyticsGroupBy groupBy
    ) {
        if (startDate == null && endDate == null) {
            return analyticsService.getRouteAnalytics(planName, null, null, groupBy);
        }

        return analyticsService.getRouteAnalytics(planName, startDate, endDate, groupBy);
    }

    @GetMapping("/analytics/clients")
    public List<ClientAnalyticsResponseDto> getClientAnalytics(
            @RequestParam(required = false) String planName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        if (startDate == null && endDate == null) {
            return analyticsService.getClientAnalytics(planName);
        }

        return analyticsService.getClientAnalytics(planName, startDate, endDate);
    }

    @GetMapping("/analytics/traffic")
    public List<TrafficAnalyticsResponseDto> getTrafficAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        if (startDate == null && endDate == null) {
            return analyticsService.getTrafficAnalytics();
        }

        return analyticsService.getTrafficAnalytics(startDate, endDate);
    }

    @GetMapping("/analytics/route-traffic")
    public List<RouteTrafficAnalyticsResponseDto> getRouteTrafficAnalytics(
            @RequestParam(required = false) String planName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "OPERATION") RouteAnalyticsGroupBy groupBy
    ) {
        if (startDate == null && endDate == null) {
            return analyticsService.getRouteTrafficAnalytics(planName, null, null, groupBy);
        }

        return analyticsService.getRouteTrafficAnalytics(planName, startDate, endDate, groupBy);
    }
}
