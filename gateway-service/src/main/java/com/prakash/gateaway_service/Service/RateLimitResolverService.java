package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.Entity.Client;
import com.prakash.gateaway_service.Entity.RouteLimit;
import com.prakash.gateaway_service.Repository.RouteLimitRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;

@Service
public class RateLimitResolverService {

    private final RouteLimitRepository routeLimitRepository;

    public RateLimitResolverService(RouteLimitRepository routeLimitRepository) {
        this.routeLimitRepository = routeLimitRepository;
    }

    public int resolveLimit(Client client, String path) {
        return resolve(client, path).requestsPerMinute();
    }

    public ResolvedRateLimit resolve(Client client, String path) {
        return routeLimitRepository.findByPlanId(client.getPlan().getId())
                .stream()
                .map(routeLimit -> new RouteLimitMatch(routeLimit, matchScore(routeLimit.getRoutePattern(), path)))
                .filter(match -> match.score() > 0)
                .max(Comparator.comparingInt(RouteLimitMatch::score))
                .map(match -> routeLimit(client, match.routeLimit()))
                .orElseGet(() -> planLimit(client, path));
    }

    private ResolvedRateLimit routeLimit(Client client, RouteLimit routeLimit) {
        String routePattern = routeLimit.getRoutePattern();
        return new ResolvedRateLimit(
                routeLimit.getRequestsPerMinute(),
                "route:plan:" + client.getPlan().getId() + ":pattern:" + routePattern,
                "ROUTE",
                routePattern
        );
    }

    private ResolvedRateLimit planLimit(Client client, String path) {
        return new ResolvedRateLimit(
                client.getPlan().getRequestsPerMinute(),
                "plan:" + client.getPlan().getId() + ":path:" + path,
                "PLAN",
                null
        );
    }

    int matchScore(String routePattern, String path) {
        if (routePattern == null || path == null) {
            return 0;
        }

        String pattern = routePattern.trim();
        if (pattern.equals(path)) {
            return 3000 + literalSegmentCount(pattern);
        }

        if (pattern.endsWith("/**")) {
            String prefix = pattern.substring(0, pattern.length() - 3);
            if (path.equals(prefix) || path.startsWith(prefix + "/")) {
                return 1000 + literalSegmentCount(prefix);
            }
            return 0;
        }

        if (pattern.contains("*") && singleSegmentWildcardMatches(pattern, path)) {
            return 2000 + literalSegmentCount(pattern);
        }

        return 0;
    }

    private boolean singleSegmentWildcardMatches(String pattern, String path) {
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

    private int literalSegmentCount(String pattern) {
        int count = 0;
        for (String segment : pathSegments(pattern)) {
            if (!"*".equals(segment) && !"**".equals(segment)) {
                count++;
            }
        }
        return count;
    }

    private String[] pathSegments(String path) {
        if (path == null || path.isBlank() || "/".equals(path)) {
            return new String[0];
        }
        return path.substring(1).split("/");
    }

    private record RouteLimitMatch(RouteLimit routeLimit, int score) {
    }

    public record ResolvedRateLimit(
            int requestsPerMinute,
            String rateLimitBucket,
            String source,
            String matchedRoutePattern
    ) {
    }
}
