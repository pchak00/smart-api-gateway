package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.ClientAnalyticsResponseDto;
import com.prakash.gateaway_service.DTO.DashboardSummaryResponseDto;
import com.prakash.gateaway_service.DTO.RouteAnalyticsResponseDto;
import com.prakash.gateaway_service.DTO.TrafficAnalyticsResponseDto;
import com.prakash.gateaway_service.Repository.AbuseAlertRepository;
import com.prakash.gateaway_service.Repository.ClientRepository;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.RouteLimitRepository;
import com.prakash.gateaway_service.Repository.UsageLogRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnalyticsService {

    private final ClientRepository clientRepository;
    private final PlanRepository planRepository;
    private final RouteLimitRepository routeLimitRepository;
    private final UsageLogRepository usageLogRepository;
    private final AbuseAlertRepository abuseAlertRepository;

    public AnalyticsService(
            ClientRepository clientRepository,
            PlanRepository planRepository,
            RouteLimitRepository routeLimitRepository,
            UsageLogRepository usageLogRepository,
            AbuseAlertRepository abuseAlertRepository
    ) {
        this.clientRepository = clientRepository;
        this.planRepository = planRepository;
        this.routeLimitRepository = routeLimitRepository;
        this.usageLogRepository = usageLogRepository;
        this.abuseAlertRepository = abuseAlertRepository;
    }

    public DashboardSummaryResponseDto getDashboardSummary() {
        return new DashboardSummaryResponseDto(
                clientRepository.count(),
                planRepository.count(),
                routeLimitRepository.count(),
                usageLogRepository.count(),
                usageLogRepository.countByAllowed(true),
                usageLogRepository.countByAllowed(false),
                countOpenAlerts()
        );
    }

    public List<RouteAnalyticsResponseDto> getRouteAnalytics() {
        return usageLogRepository.findRouteAnalytics()
                .stream()
                .map(row -> new RouteAnalyticsResponseDto(
                        (String) row[0],
                        toLong(row[1]),
                        toLong(row[2]),
                        toLong(row[3])
                ))
                .toList();
    }

    public List<ClientAnalyticsResponseDto> getClientAnalytics() {
        return usageLogRepository.findClientAnalytics()
                .stream()
                .map(row -> new ClientAnalyticsResponseDto(
                        toLong(row[0]),
                        (String) row[1],
                        toLong(row[2]),
                        toLong(row[3]),
                        toLong(row[4])
                ))
                .toList();
    }

    public List<TrafficAnalyticsResponseDto> getTrafficAnalytics() {
        return usageLogRepository.findDailyTrafficAnalytics()
                .stream()
                .map(row -> new TrafficAnalyticsResponseDto(
                        row[0].toString(),
                        toLong(row[1]),
                        toLong(row[2]),
                        toLong(row[3])
                ))
                .toList();
    }

    private long countOpenAlerts() {
        return abuseAlertRepository.countOpenIncludingLegacy();
    }

    private long toLong(Object value) {
        if (value == null) {
            return 0;
        }

        return ((Number) value).longValue();
    }
}
