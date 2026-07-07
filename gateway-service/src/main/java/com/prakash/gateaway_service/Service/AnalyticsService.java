package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.ClientAnalyticsResponseDto;
import com.prakash.gateaway_service.DTO.DashboardSummaryResponseDto;
import com.prakash.gateaway_service.DTO.RouteAnalyticsGroupBy;
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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

@Service
public class AnalyticsService {

    private final ClientRepository clientRepository;
    private final PlanRepository planRepository;
    private final RouteLimitRepository routeLimitRepository;
    private final UsageLogRepository usageLogRepository;
    private final AbuseAlertRepository abuseAlertRepository;
    private final RouteGroupingService routeGroupingService;

    public AnalyticsService(
            ClientRepository clientRepository,
            PlanRepository planRepository,
            RouteLimitRepository routeLimitRepository,
            UsageLogRepository usageLogRepository,
            AbuseAlertRepository abuseAlertRepository,
            RouteGroupingService routeGroupingService
    ) {
        this.clientRepository = clientRepository;
        this.planRepository = planRepository;
        this.routeLimitRepository = routeLimitRepository;
        this.usageLogRepository = usageLogRepository;
        this.abuseAlertRepository = abuseAlertRepository;
        this.routeGroupingService = routeGroupingService;
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
        return getRouteAnalytics(planName, startDate, endDate, RouteAnalyticsGroupBy.OPERATION);
    }

    public List<RouteAnalyticsResponseDto> getRouteAnalytics(
            String planName,
            LocalDate startDate,
            LocalDate endDate,
            RouteAnalyticsGroupBy groupBy
    ) {
        if (startDate == null && endDate == null) {
            return mapGroupedRouteAnalytics(
                    usageLogRepository.findRouteAnalyticsByMethodPath(normalizePlanFilter(planName)),
                    groupBy
            );
        }

        DateWindow dateWindow = toDateWindow(startDate, endDate);

        return mapGroupedRouteAnalytics(usageLogRepository.findRouteAnalyticsByMethodPathInDateRange(
                        normalizePlanFilter(planName),
                        dateWindow.startInclusive(),
                        dateWindow.endExclusive()
                ),
                groupBy
        );
    }

    public List<RouteAnalyticsResponseDto> getRouteAnalytics(String planName) {
        return getRouteAnalytics(planName, null, null);
    }

    public List<ClientAnalyticsResponseDto> getClientAnalytics(String planName, LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return mapClientAnalytics(usageLogRepository.findClientAnalytics(normalizePlanFilter(planName)));
        }

        DateWindow dateWindow = toDateWindow(startDate, endDate);

        return mapClientAnalytics(usageLogRepository.findClientAnalyticsInDateRange(
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

        return mapTrafficAnalytics(usageLogRepository.findDailyTrafficAnalyticsInDateRange(
                        dateWindow.startInclusive(),
                        dateWindow.endExclusive()
                ));
    }

    public List<TrafficAnalyticsResponseDto> getTrafficAnalytics() {
        return getTrafficAnalytics(null, null);
    }

    public List<RouteTrafficAnalyticsResponseDto> getRouteTrafficAnalytics(String planName, LocalDate startDate, LocalDate endDate) {
        return getRouteTrafficAnalytics(planName, startDate, endDate, RouteAnalyticsGroupBy.OPERATION);
    }

    public List<RouteTrafficAnalyticsResponseDto> getRouteTrafficAnalytics(
            String planName,
            LocalDate startDate,
            LocalDate endDate,
            RouteAnalyticsGroupBy groupBy
    ) {
        if (startDate == null && endDate == null) {
            return mapGroupedRouteTrafficAnalytics(
                    usageLogRepository.findDailyRouteTrafficAnalyticsByMethodPath(normalizePlanFilter(planName)),
                    groupBy
            );
        }

        DateWindow dateWindow = toDateWindow(startDate, endDate);

        return mapGroupedRouteTrafficAnalytics(usageLogRepository.findDailyRouteTrafficAnalyticsByMethodPathInDateRange(
                        normalizePlanFilter(planName),
                        dateWindow.startInclusive(),
                        dateWindow.endExclusive()
                ),
                groupBy
        );
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

    private List<RouteAnalyticsResponseDto> mapGroupedRouteAnalytics(
            List<Object[]> rows,
            RouteAnalyticsGroupBy groupBy
    ) {
        Map<String, RouteAggregate> aggregates = new LinkedHashMap<>();

        for (Object[] row : rows) {
            String method = toStringValue(row[0]);
            String rawPath = toStringValue(row[1]);
            RouteGroupingService.ResolvedRouteGroup resolved = routeGroupingService.resolve(groupBy, method, rawPath);
            RouteAggregate aggregate = aggregates.computeIfAbsent(resolved.key(), key -> new RouteAggregate(resolved));
            aggregate.add(method, rawPath, toLong(row[2]), toLong(row[3]), toLong(row[4]));
        }

        return aggregates.values()
                .stream()
                .sorted((first, second) -> {
                    int totalDifference = Long.compare(second.totalRequests, first.totalRequests);
                    if (totalDifference != 0) {
                        return totalDifference;
                    }
                    return first.resolved.label().compareToIgnoreCase(second.resolved.label());
                })
                .map(RouteAggregate::toResponse)
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

    private List<RouteTrafficAnalyticsResponseDto> mapGroupedRouteTrafficAnalytics(
            List<Object[]> rows,
            RouteAnalyticsGroupBy groupBy
    ) {
        Map<String, RouteTrafficAggregate> aggregates = new LinkedHashMap<>();

        for (Object[] row : rows) {
            String bucket = row[0].toString();
            String method = toStringValue(row[1]);
            String rawPath = toStringValue(row[2]);
            RouteGroupingService.ResolvedRouteGroup resolved = routeGroupingService.resolve(groupBy, method, rawPath);
            String key = bucket + "|" + resolved.key();
            RouteTrafficAggregate aggregate = aggregates.computeIfAbsent(key, ignored -> new RouteTrafficAggregate(bucket, resolved));
            aggregate.add(method, rawPath, toLong(row[3]), toLong(row[4]), toLong(row[5]));
        }

        return aggregates.values()
                .stream()
                .sorted((first, second) -> {
                    int bucketDifference = first.bucket.compareTo(second.bucket);
                    if (bucketDifference != 0) {
                        return bucketDifference;
                    }
                    return first.resolved.label().compareToIgnoreCase(second.resolved.label());
                })
                .map(RouteTrafficAggregate::toResponse)
                .toList();
    }

    private String toStringValue(Object value) {
        if (value == null) {
            return "";
        }

        return value.toString();
    }

    private DateWindow toDateWindow(LocalDate startDate, LocalDate endDate) {
        LocalDate normalizedStartDate = startDate == null ? LocalDate.of(1970, 1, 1) : startDate;
        LocalDate normalizedEndDate = endDate == null ? LocalDate.of(3000, 1, 1) : endDate;
        if (normalizedEndDate.isBefore(normalizedStartDate)) {
            normalizedEndDate = normalizedStartDate.minusDays(1);
        }

        LocalDateTime startInclusive = normalizedStartDate.atStartOfDay();
        LocalDateTime endExclusive = normalizedEndDate.plusDays(1).atStartOfDay();

        return new DateWindow(startInclusive, endExclusive);
    }

    private record DateWindow(LocalDateTime startInclusive, LocalDateTime endExclusive) {
    }

    private static class RouteAggregate {
        private final RouteGroupingService.ResolvedRouteGroup resolved;
        private final TreeSet<String> rawRoutes = new TreeSet<>();
        private long totalRequests;
        private long allowedRequests;
        private long blockedRequests;

        private RouteAggregate(RouteGroupingService.ResolvedRouteGroup resolved) {
            this.resolved = resolved;
        }

        private void add(String method, String rawPath, long total, long allowed, long blocked) {
            rawRoutes.add(formatRawRoute(method, rawPath));
            totalRequests += total;
            allowedRequests += allowed;
            blockedRequests += blocked;
        }

        private RouteAnalyticsResponseDto toResponse() {
            return new RouteAnalyticsResponseDto(
                    resolved.route(),
                    resolved.key(),
                    resolved.label(),
                    resolved.groupBy(),
                    totalRequests,
                    allowedRequests,
                    blockedRequests,
                    totalRequests <= 0 ? 0 : (double) blockedRequests / totalRequests,
                    rawRoutes.size(),
                    new ArrayList<>(rawRoutes)
            );
        }
    }

    private static class RouteTrafficAggregate {
        private final String bucket;
        private final RouteGroupingService.ResolvedRouteGroup resolved;
        private final TreeSet<String> rawRoutes = new TreeSet<>();
        private long totalRequests;
        private long allowedRequests;
        private long blockedRequests;

        private RouteTrafficAggregate(String bucket, RouteGroupingService.ResolvedRouteGroup resolved) {
            this.bucket = bucket;
            this.resolved = resolved;
        }

        private void add(String method, String rawPath, long total, long allowed, long blocked) {
            rawRoutes.add(formatRawRoute(method, rawPath));
            totalRequests += total;
            allowedRequests += allowed;
            blockedRequests += blocked;
        }

        private RouteTrafficAnalyticsResponseDto toResponse() {
            return new RouteTrafficAnalyticsResponseDto(
                    bucket,
                    resolved.route(),
                    resolved.key(),
                    resolved.label(),
                    resolved.groupBy(),
                    totalRequests,
                    allowedRequests,
                    blockedRequests,
                    rawRoutes.size(),
                    new ArrayList<>(rawRoutes)
            );
        }
    }

    private static String formatRawRoute(String method, String rawPath) {
        if (method == null || method.isBlank()) {
            return rawPath;
        }

        return method.trim().toUpperCase() + " " + rawPath;
    }
}
