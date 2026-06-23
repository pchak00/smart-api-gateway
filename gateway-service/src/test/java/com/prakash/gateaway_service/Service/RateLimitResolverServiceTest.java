package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.Entity.Client;
import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Entity.RouteLimit;
import com.prakash.gateaway_service.Repository.RouteLimitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RateLimitResolverServiceTest {

    private RouteLimitRepository routeLimitRepository;
    private RateLimitResolverService rateLimitResolverService;
    private Client client;

    @BeforeEach
    void setUp() {
        routeLimitRepository = mock(RouteLimitRepository.class);
        rateLimitResolverService = new RateLimitResolverService(routeLimitRepository);
        client = client();
    }

    @Test
    void exactMatchUsesRouteLimit() {
        when(routeLimitRepository.findByPlanId(1L))
                .thenReturn(List.of(routeLimit("/api/products", 5)));

        int limit = rateLimitResolverService.resolveLimit(client, "/api/products");

        assertEquals(5, limit);
    }

    @Test
    void exactMatchDoesNotOvermatchNestedPath() {
        when(routeLimitRepository.findByPlanId(1L))
                .thenReturn(List.of(routeLimit("/api/products", 5)));

        int limit = rateLimitResolverService.resolveLimit(client, "/api/products/123");

        assertEquals(10, limit);
    }

    @Test
    void singleSegmentWildcardMatchesOnePathSegment() {
        when(routeLimitRepository.findByPlanId(1L))
                .thenReturn(List.of(routeLimit("/api/users/*", 7)));

        int limit = rateLimitResolverService.resolveLimit(client, "/api/users/123");

        assertEquals(7, limit);
    }

    @Test
    void singleSegmentWildcardDoesNotMatchNestedPath() {
        when(routeLimitRepository.findByPlanId(1L))
                .thenReturn(List.of(routeLimit("/api/users/*", 7)));

        int limit = rateLimitResolverService.resolveLimit(client, "/api/users/123/profile");

        assertEquals(10, limit);
    }

    @Test
    void multiSegmentWildcardMatchesBasePath() {
        when(routeLimitRepository.findByPlanId(1L))
                .thenReturn(List.of(routeLimit("/api/users/**", 20)));

        int limit = rateLimitResolverService.resolveLimit(client, "/api/users");

        assertEquals(20, limit);
    }

    @Test
    void multiSegmentWildcardMatchesOneNestedSegment() {
        when(routeLimitRepository.findByPlanId(1L))
                .thenReturn(List.of(routeLimit("/api/users/**", 20)));

        int limit = rateLimitResolverService.resolveLimit(client, "/api/users/123");

        assertEquals(20, limit);
    }

    @Test
    void multiSegmentWildcardMatchesDeepNestedPath() {
        when(routeLimitRepository.findByPlanId(1L))
                .thenReturn(List.of(routeLimit("/api/users/**", 20)));

        int limit = rateLimitResolverService.resolveLimit(client, "/api/users/123/profile");

        assertEquals(20, limit);
    }

    @Test
    void exactMatchBeatsWildcardMatch() {
        when(routeLimitRepository.findByPlanId(1L))
                .thenReturn(List.of(
                        routeLimit("/api/users/**", 20),
                        routeLimit("/api/users/profile", 5)
                ));

        int limit = rateLimitResolverService.resolveLimit(client, "/api/users/profile");

        assertEquals(5, limit);
    }

    @Test
    void singleSegmentWildcardBeatsMultiSegmentWildcardForOneSegmentPath() {
        when(routeLimitRepository.findByPlanId(1L))
                .thenReturn(List.of(
                        routeLimit("/api/users/*", 7),
                        routeLimit("/api/users/**", 20)
                ));

        int limit = rateLimitResolverService.resolveLimit(client, "/api/users/123");

        assertEquals(7, limit);
    }

    @Test
    void multiSegmentWildcardAppliesWhenSingleSegmentWildcardDoesNotMatch() {
        when(routeLimitRepository.findByPlanId(1L))
                .thenReturn(List.of(
                        routeLimit("/api/users/*", 7),
                        routeLimit("/api/users/**", 20)
                ));

        int limit = rateLimitResolverService.resolveLimit(client, "/api/users/123/profile");

        assertEquals(20, limit);
    }

    @Test
    void planDefaultAppliesWhenNoPatternMatches() {
        when(routeLimitRepository.findByPlanId(1L))
                .thenReturn(List.of(routeLimit("/api/reports/**", 2)));

        int limit = rateLimitResolverService.resolveLimit(client, "/api/products");

        assertEquals(10, limit);
    }

    private Client client() {
        Plan plan = new Plan();
        plan.setId(1L);
        plan.setName("FREE");
        plan.setRequestsPerMinute(10);

        Client client = new Client();
        client.setId(1L);
        client.setName("Demo Free Client");
        client.setApiKey("free-demo-api-key");
        client.setPlan(plan);
        client.setActive(true);
        return client;
    }

    private RouteLimit routeLimit(String routePattern, int requestsPerMinute) {
        RouteLimit routeLimit = new RouteLimit();
        routeLimit.setId((long) requestsPerMinute);
        routeLimit.setPlan(client.getPlan());
        routeLimit.setRoutePattern(routePattern);
        routeLimit.setRequestsPerMinute(requestsPerMinute);
        return routeLimit;
    }
}
