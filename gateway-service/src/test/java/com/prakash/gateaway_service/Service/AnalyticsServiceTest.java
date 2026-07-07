package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.DashboardSummaryResponseDto;
import com.prakash.gateaway_service.DTO.ClientAnalyticsResponseDto;
import com.prakash.gateaway_service.DTO.RouteAnalyticsResponseDto;
import com.prakash.gateaway_service.DTO.RouteTrafficAnalyticsResponseDto;
import com.prakash.gateaway_service.Repository.AbuseAlertRepository;
import com.prakash.gateaway_service.Repository.ClientRepository;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.RouteLimitRepository;
import com.prakash.gateaway_service.Repository.UsageLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AnalyticsServiceTest {

    private ClientRepository clientRepository;
    private PlanRepository planRepository;
    private RouteLimitRepository routeLimitRepository;
    private UsageLogRepository usageLogRepository;
    private AbuseAlertRepository abuseAlertRepository;
    private AnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        clientRepository = mock(ClientRepository.class);
        planRepository = mock(PlanRepository.class);
        routeLimitRepository = mock(RouteLimitRepository.class);
        usageLogRepository = mock(UsageLogRepository.class);
        abuseAlertRepository = mock(AbuseAlertRepository.class);
        analyticsService = new AnalyticsService(
                clientRepository,
                planRepository,
                routeLimitRepository,
                usageLogRepository,
                abuseAlertRepository
        );
    }

    @Test
    void dashboardOpenAlertCountCountsOnlyOpenAlerts() {
        when(clientRepository.count()).thenReturn(2L);
        when(planRepository.count()).thenReturn(3L);
        when(routeLimitRepository.count()).thenReturn(4L);
        when(usageLogRepository.count()).thenReturn(20L);
        when(usageLogRepository.countByAllowed(true)).thenReturn(15L);
        when(usageLogRepository.countByAllowed(false)).thenReturn(5L);
        when(abuseAlertRepository.countOpenIncludingLegacy()).thenReturn(1L);

        DashboardSummaryResponseDto summary = analyticsService.getDashboardSummary();

        assertEquals(1, summary.openAlertCount());
    }

    @Test
    void routeAnalyticsWithoutPlanFilterPreservesAllPlanResults() {
        when(usageLogRepository.findRouteAnalytics(null)).thenReturn(List.of(
                new Object[] { "/api/products", 12L, 8L, 4L },
                new Object[] { "/api/reports", 5L, 3L, 2L }
        ));

        List<RouteAnalyticsResponseDto> routes = analyticsService.getRouteAnalytics(null);

        assertEquals(2, routes.size());
        assertEquals("/api/products", routes.get(0).route());
        assertEquals(12, routes.get(0).totalRequests());
        verify(usageLogRepository).findRouteAnalytics(null);
    }

    @Test
    void routeAnalyticsFiltersByPlanName() {
        when(usageLogRepository.findRouteAnalytics("Free")).thenReturn(List.<Object[]>of(
                new Object[] { "/api/products", 4L, 3L, 1L }
        ));

        List<RouteAnalyticsResponseDto> routes = analyticsService.getRouteAnalytics(" Free ");

        assertEquals(1, routes.size());
        assertEquals("/api/products", routes.get(0).route());
        assertEquals(4, routes.get(0).totalRequests());
        verify(usageLogRepository).findRouteAnalytics("Free");
    }

    @Test
    void routeAnalyticsUnknownPlanReturnsEmptyRows() {
        when(usageLogRepository.findRouteAnalytics("Unknown")).thenReturn(List.of());

        assertEquals(0, analyticsService.getRouteAnalytics("Unknown").size());
    }

    @Test
    void clientAnalyticsIncludesPlanInformation() {
        when(usageLogRepository.findClientAnalytics(null)).thenReturn(List.<Object[]>of(
                new Object[] { 7L, "Demo Free Client", 1L, "FREE", 10L, 8L, 2L }
        ));

        List<ClientAnalyticsResponseDto> clients = analyticsService.getClientAnalytics(null);

        assertEquals(1, clients.size());
        assertEquals(7L, clients.get(0).clientId());
        assertEquals("Demo Free Client", clients.get(0).clientName());
        assertEquals(1L, clients.get(0).planId());
        assertEquals("FREE", clients.get(0).planName());
        assertEquals(10, clients.get(0).totalRequests());
    }

    @Test
    void clientAnalyticsFiltersByPlanName() {
        when(usageLogRepository.findClientAnalytics("PRO")).thenReturn(List.<Object[]>of(
                new Object[] { 8L, "Demo Pro Client", 2L, "PRO", 12L, 12L, 0L }
        ));

        List<ClientAnalyticsResponseDto> clients = analyticsService.getClientAnalytics("PRO");

        assertEquals(1, clients.size());
        assertEquals("PRO", clients.get(0).planName());
        verify(usageLogRepository).findClientAnalytics("PRO");
    }

    @Test
    void clientAnalyticsUnknownPlanReturnsEmptyRows() {
        when(usageLogRepository.findClientAnalytics("Unknown")).thenReturn(List.of());

        assertEquals(0, analyticsService.getClientAnalytics("Unknown").size());
    }

    @Test
    void routeTrafficAnalyticsMapsDailyRouteRows() {
        when(usageLogRepository.findDailyRouteTrafficAnalytics(null)).thenReturn(List.of(
                new Object[] { LocalDate.of(2026, 6, 18), "/api/products", 12L, 8L, 4L },
                new Object[] { LocalDate.of(2026, 6, 18), "/api/reports", 5L, 3L, 2L }
        ));

        List<RouteTrafficAnalyticsResponseDto> trends = analyticsService.getRouteTrafficAnalytics(null);

        assertEquals(2, trends.size());
        assertEquals("2026-06-18", trends.get(0).bucket());
        assertEquals("/api/products", trends.get(0).route());
        assertEquals(12, trends.get(0).totalRequests());
        assertEquals(8, trends.get(0).allowedRequests());
        assertEquals(4, trends.get(0).blockedRequests());
    }

    @Test
    void routeTrafficAnalyticsHandlesEmptyRows() {
        when(usageLogRepository.findDailyRouteTrafficAnalytics(null)).thenReturn(List.of());

        assertEquals(0, analyticsService.getRouteTrafficAnalytics(null).size());
    }

    @Test
    void routeTrafficAnalyticsFiltersByPlanName() {
        when(usageLogRepository.findDailyRouteTrafficAnalytics("Enterprise")).thenReturn(List.<Object[]>of(
                new Object[] { LocalDate.of(2026, 6, 19), "/api/admin", 3L, 2L, 1L }
        ));

        List<RouteTrafficAnalyticsResponseDto> trends = analyticsService.getRouteTrafficAnalytics(" Enterprise ");

        assertEquals(1, trends.size());
        assertEquals("/api/admin", trends.get(0).route());
        verify(usageLogRepository).findDailyRouteTrafficAnalytics("Enterprise");
    }

    @Test
    void trafficAnalyticsDateRangeUsesConcreteBounds() {
        LocalDate startDate = LocalDate.of(2026, 7, 1);
        LocalDate endDate = LocalDate.of(2026, 7, 7);
        when(usageLogRepository.findDailyTrafficAnalyticsInDateRange(
                LocalDateTime.of(2026, 7, 1, 0, 0),
                LocalDateTime.of(2026, 7, 8, 0, 0)
        )).thenReturn(List.<Object[]>of(
                new Object[] { LocalDate.of(2026, 7, 7), 3L, 2L, 1L }
        ));

        List<com.prakash.gateaway_service.DTO.TrafficAnalyticsResponseDto> traffic =
                analyticsService.getTrafficAnalytics(startDate, endDate);

        assertEquals(1, traffic.size());
        assertEquals("2026-07-07", traffic.get(0).bucket());
        verify(usageLogRepository).findDailyTrafficAnalyticsInDateRange(
                LocalDateTime.of(2026, 7, 1, 0, 0),
                LocalDateTime.of(2026, 7, 8, 0, 0)
        );
    }
}
