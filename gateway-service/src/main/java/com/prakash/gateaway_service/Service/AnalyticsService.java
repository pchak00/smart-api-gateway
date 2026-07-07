package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.ClientAnalyticsResponseDto;
import com.prakash.gateaway_service.DTO.DashboardSummaryResponseDto;
import com.prakash.gateaway_service.DTO.RouteAnalyticsResponseDto;
import com.prakash.gateaway_service.DTO.RouteTrafficAnalyticsResponseDto;
import com.prakash.gateaway_service.DTO.TrafficAnalyticsResponseDto;
import com.prakash.gateaway_service.Repository.AbuseAlertRepository;
import com.prakash.gateaway_service.Repository.ClientRepository;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.RouteLimitRepository;
import com.prakash.gateaway_service.Repository.UsageLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

    public List<RouteAnalyticsResponseDto> getRouteAnalytics(String planName, LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return mapRouteAnalytics(usageLogRepository.findRouteAnalytics(normalizePlanFilter(planName)));
        }

        DateWindow dateWindow = toDateWindow(startDate, endDate);

        return mapRouteAnalytics(usageLogRepository.findRouteAnalytics(
                        normalizePlanFilter(planName),
                        dateWindow.startInclusive(),
                        dateWindow.endExclusive()
                ));
    }

    public List<RouteAnalyticsResponseDto> getRouteAnalytics(String planName) {
        return getRouteAnalytics(planName, null, null);
    }

    public List<ClientAnalyticsResponseDto> getClientAnalytics(String planName, LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return mapClientAnalytics(usageLogRepository.findClientAnalytics(normalizePlanFilter(planName)));
        }

        DateWindow dateWindow = toDateWindow(startDate, endDate);

        return mapClientAnalytics(usageLogRepository.findClientAnalytics(
                        normalizePlanFilter(planName),
                        dateWindow.startInclusive(),
                        dateWindow.endExclusive()
                ));
    }

    public List<ClientAnalyticsResponseDto> getClientAnalytics(String planName) {
        return getClientAnalytics(planName, null, null);
    }

    public List<TrafficAnalyticsResponseDto> getTrafficAnalytics(LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return mapTrafficAnalytics(usageLogRepository.findDailyTrafficAnalytics());
        }

        DateWindow dateWindow = toDateWindow(startDate, endDate);

        return mapTrafficAnalytics(usageLogRepository.findDailyTrafficAnalytics(
                        dateWindow.startInclusive(),
                        dateWindow.endExclusive()
                ));
    }

    public List<TrafficAnalyticsResponseDto> getTrafficAnalytics() {
        return getTrafficAnalytics(null, null);
    }

    public List<RouteTrafficAnalyticsResponseDto> getRouteTrafficAnalytics(String planName, LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return mapRouteTrafficAnalytics(usageLogRepository.findDailyRouteTrafficAnalytics(normalizePlanFilter(planName)));
        }

        DateWindow dateWindow = toDateWindow(startDate, endDate);

        return mapRouteTrafficAnalytics(usageLogRepository.findDailyRouteTrafficAnalytics(
                        normalizePlanFilter(planName),
                        dateWindow.startInclusive(),
                        dateWindow.endExclusive()
                ));
    }

    public List<RouteTrafficAnalyticsResponseDto> getRouteTrafficAnalytics(String planName) {
        return getRouteTrafficAnalytics(planName, null, null);
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

    private String normalizePlanFilter(String planName) {
        if (planName == null || planName.isBlank()) {
            return null;
        }

        return planName.trim();
    }

    private List<RouteAnalyticsResponseDto> mapRouteAnalytics(List<Object[]> rows) {
        return rows.stream()
                .map(row -> new RouteAnalyticsResponseDto(
                        (String) row[0],
                        toLong(row[1]),
                        toLong(row[2]),
                        toLong(row[3])
                ))
                .toList();
    }

    private List<ClientAnalyticsResponseDto> mapClientAnalytics(List<Object[]> rows) {
        return rows.stream()
                .map(row -> new ClientAnalyticsResponseDto(
                        toLong(row[0]),
                        (String) row[1],
                        toLong(row[2]),
                        (String) row[3],
                        toLong(row[4]),
                        toLong(row[5]),
                        toLong(row[6])
                ))
                .toList();
    }

    private List<TrafficAnalyticsResponseDto> mapTrafficAnalytics(List<Object[]> rows) {
        return rows.stream()
                .map(row -> new TrafficAnalyticsResponseDto(
                        row[0].toString(),
                        toLong(row[1]),
                        toLong(row[2]),
                        toLong(row[3])
                ))
                .toList();
    }

    private List<RouteTrafficAnalyticsResponseDto> mapRouteTrafficAnalytics(List<Object[]> rows) {
        return rows.stream()
                .map(row -> new RouteTrafficAnalyticsResponseDto(
                        row[0].toString(),
                        (String) row[1],
                        toLong(row[2]),
                        toLong(row[3]),
                        toLong(row[4])
                ))
                .toList();
    }

    private DateWindow toDateWindow(LocalDate startDate, LocalDate endDate) {
        LocalDateTime startInclusive = startDate == null ? null : startDate.atStartOfDay();
        LocalDateTime endExclusive = endDate == null ? null : endDate.plusDays(1).atStartOfDay();

        return new DateWindow(startInclusive, endExclusive);
    }

    private record DateWindow(LocalDateTime startInclusive, LocalDateTime endExclusive) {
    }
}
