package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.RouteAnalyticsGroupBy;
import com.prakash.gateaway_service.Entity.RouteGroup;
import com.prakash.gateaway_service.Entity.RouteGroupMatchType;
import com.prakash.gateaway_service.Entity.RouteGroupRule;
import com.prakash.gateaway_service.Repository.RouteGroupRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class RouteGroupingService {

    private static final Pattern UUID_SEGMENT = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$"
    );
    private static final Pattern NUMERIC_SEGMENT = Pattern.compile("^\\d+$");

    private final RouteGroupRepository routeGroupRepository;

    public RouteGroupingService(RouteGroupRepository routeGroupRepository) {
        this.routeGroupRepository = routeGroupRepository;
    }

    public ResolvedRouteGroup resolve(RouteAnalyticsGroupBy groupBy, String method, String path) {
        RouteAnalyticsGroupBy normalizedGroupBy = groupBy == null ? RouteAnalyticsGroupBy.OPERATION : groupBy;
        String rawPath = normalizePathShape(path);

        if (normalizedGroupBy == RouteAnalyticsGroupBy.RAW_PATH) {
            return new ResolvedRouteGroup(rawPath, rawPath, rawPath, "RAW_PATH", 1);
        }

        if (normalizedGroupBy == RouteAnalyticsGroupBy.OPERATION) {
            return routeGroupRepository.findByActiveTrueOrderByPriorityDescNameAsc()
                    .stream()
                    .sorted(Comparator
                            .comparing((RouteGroup group) -> group.getPriority() == null ? 0 : group.getPriority())
                            .reversed()
                            .thenComparing(RouteGroup::getName, String.CASE_INSENSITIVE_ORDER))
                    .filter(group -> group.getRules().stream().anyMatch(rule -> matches(rule, method, rawPath)))
                    .findFirst()
                    .map(group -> new ResolvedRouteGroup(
                            "operation:" + group.getId(),
                            group.getName(),
                            group.getName(),
                            "OPERATION",
                            1
                    ))
                    .orElseGet(() -> patternGroup(rawPath));
        }

        return patternGroup(rawPath);
    }

    public String normalizeRoutePattern(String path) {
        String normalizedPath = normalizePathShape(path);
        if ("/".equals(normalizedPath)) {
            return normalizedPath;
        }

        String[] segments = normalizedPath.substring(1).split("/");
        for (int i = 0; i < segments.length; i++) {
            if (UUID_SEGMENT.matcher(segments[i]).matches()) {
                segments[i] = ":uuid";
            } else if (NUMERIC_SEGMENT.matcher(segments[i]).matches()) {
                segments[i] = ":id";
            }
        }

        return "/" + String.join("/", segments);
    }

    public boolean matches(RouteGroupRule rule, String method, String path) {
        if (rule == null || rule.getPattern() == null || rule.getMatchType() == null) {
            return false;
        }

        String ruleMethod = normalizeMethod(rule.getMethod());
        String requestMethod = normalizeMethod(method);
        if (ruleMethod != null && !ruleMethod.equals(requestMethod)) {
            return false;
        }

        String normalizedPath = normalizePathShape(path);
        String pattern = normalizePathShape(rule.getPattern());

        return switch (rule.getMatchType()) {
            case EXACT -> normalizedPath.equals(pattern);
            case PREFIX -> normalizedPath.equals(pattern) || normalizedPath.startsWith(pattern.endsWith("/") ? pattern : pattern + "/");
            case GLOB -> globMatches(pattern, normalizedPath);
        };
    }

    private ResolvedRouteGroup patternGroup(String rawPath) {
        String pattern = normalizeRoutePattern(rawPath);
        return new ResolvedRouteGroup(pattern, pattern, pattern, "PATTERN", 1);
    }

    private boolean globMatches(String pattern, String path) {
        if (pattern.equals(path)) {
            return true;
        }

        if (pattern.endsWith("/**")) {
            String prefix = pattern.substring(0, pattern.length() - 3);
            return path.equals(prefix) || path.startsWith(prefix + "/");
        }

        if (!pattern.contains("*")) {
            return false;
        }

        String[] patternSegments = pathSegments(pattern);
        String[] pathSegments = pathSegments(path);
        if (patternSegments.length != pathSegments.length) {
            return false;
        }

        for (int i = 0; i < patternSegments.length; i++) {
            if ("*".equals(patternSegments[i])) {
                continue;
            }
            if (!patternSegments[i].equals(pathSegments[i])) {
                return false;
            }
        }

        return true;
    }

    private String normalizePathShape(String path) {
        if (path == null || path.isBlank()) {
            return "/";
        }

        String normalized = path.trim();
        int queryIndex = normalized.indexOf('?');
        if (queryIndex >= 0) {
            normalized = normalized.substring(0, queryIndex);
        }
        int fragmentIndex = normalized.indexOf('#');
        if (fragmentIndex >= 0) {
            normalized = normalized.substring(0, fragmentIndex);
        }
        if (!normalized.startsWith("/")) {
            normalized = "/" + normalized;
        }
        while (normalized.length() > 1 && normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }

        return normalized;
    }

    private String normalizeMethod(String method) {
        if (method == null || method.isBlank()) {
            return null;
        }

        return method.trim().toUpperCase(Locale.ROOT);
    }

    private String[] pathSegments(String path) {
        if (path == null || path.isBlank() || "/".equals(path)) {
            return new String[0];
        }

        return path.substring(1).split("/");
    }

    public record ResolvedRouteGroup(
            String key,
            String label,
            String route,
            String groupBy,
            int endpointCount
    ) {
    }
}
