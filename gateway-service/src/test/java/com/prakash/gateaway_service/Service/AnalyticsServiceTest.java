package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.DashboardSummaryResponseDto;
import com.prakash.gateaway_service.Repository.AbuseAlertRepository;
import com.prakash.gateaway_service.Repository.ClientRepository;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.RouteLimitRepository;
import com.prakash.gateaway_service.Repository.UsageLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

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
}
