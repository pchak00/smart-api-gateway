package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.DashboardSummaryResponseDto;
import com.prakash.gateaway_service.DTO.RouteTrafficAnalyticsResponseDto;
import com.prakash.gateaway_service.Repository.AbuseAlertRepository;
import com.prakash.gateaway_service.Repository.ClientRepository;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.RouteLimitRepository;
import com.prakash.gateaway_service.Repository.UsageLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
    void routeTrafficAnalyticsMapsDailyRouteRows() {
        when(usageLogRepository.findDailyRouteTrafficAnalytics()).thenReturn(List.of(
                new Object[] { LocalDate.of(2026, 6, 18), "/api/products", 12L, 8L, 4L },
                new Object[] { LocalDate.of(2026, 6, 18), "/api/reports", 5L, 3L, 2L }
        ));

        List<RouteTrafficAnalyticsResponseDto> trends = analyticsService.getRouteTrafficAnalytics();

        assertEquals(2, trends.size());
        assertEquals("2026-06-18", trends.get(0).bucket());
        assertEquals("/api/products", trends.get(0).route());
        assertEquals(12, trends.get(0).totalRequests());
        assertEquals(8, trends.get(0).allowedRequests());
        assertEquals(4, trends.get(0).blockedRequests());
    }

    @Test
    void routeTrafficAnalyticsHandlesEmptyRows() {
        when(usageLogRepository.findDailyRouteTrafficAnalytics()).thenReturn(List.of());

        assertEquals(0, analyticsService.getRouteTrafficAnalytics().size());
    }
}
