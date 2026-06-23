package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.RouteLimitDto;
import com.prakash.gateaway_service.DTO.RouteLimitResponse;
import com.prakash.gateaway_service.DTO.UpdateRouteLimitRequest;
import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Entity.RouteLimit;
import com.prakash.gateaway_service.Exception.InvalidRouteLimitException;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.RouteLimitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RouteLimitServiceTest {

    private RouteLimitRepository routeLimitRepository;
    private PlanRepository planRepository;
    private RouteLimitService routeLimitService;
    private Plan plan;

    @BeforeEach
    void setUp() {
        routeLimitRepository = mock(RouteLimitRepository.class);
        planRepository = mock(PlanRepository.class);
        routeLimitService = new RouteLimitService(routeLimitRepository, planRepository);
        plan = plan();
    }

    @Test
    void acceptsExactRoutePattern() {
        RouteLimitDto response = createValidRouteLimit("/api/products");

        assertEquals("/api/products", response.routePattern());
    }

    @Test
    void acceptsSingleSegmentWildcardRoutePattern() {
        RouteLimitDto response = createValidRouteLimit("/api/users/*");

        assertEquals("/api/users/*", response.routePattern());
    }

    @Test
    void acceptsEndingMultiSegmentWildcardRoutePattern() {
        RouteLimitDto response = createValidRouteLimit("/api/users/**");

        assertEquals("/api/users/**", response.routePattern());
    }

    @Test
    void updateAcceptsValidRoutePattern() {
        RouteLimit routeLimit = routeLimit("/api/products", 5);
        when(routeLimitRepository.findById(10L)).thenReturn(Optional.of(routeLimit));
        when(routeLimitRepository.findByPlanIdAndRoutePattern(1L, "/api/users/**")).thenReturn(Optional.empty());
        when(routeLimitRepository.save(routeLimit)).thenReturn(routeLimit);

        RouteLimitResponse response = routeLimitService.updateRouteLimit(
                10L,
                new UpdateRouteLimitRequest("/api/users/**", 8)
        );

        assertEquals("/api/users/**", response.routePattern());
        assertEquals(8, response.requestsPerMinute());
    }

    @Test
    void rejectsBlankRoutePattern() {
        assertInvalid(new RouteLimitDto(1L, " ", 5));
    }

    @Test
    void rejectsRoutePatternWithoutLeadingSlash() {
        assertInvalid(new RouteLimitDto(1L, "api/products", 5));
    }

    @Test
    void rejectsInlineWildcardSegment() {
        assertInvalid(new RouteLimitDto(1L, "/api/user*", 5));
    }

    @Test
    void rejectsMiddleMultiSegmentWildcard() {
        assertInvalid(new RouteLimitDto(1L, "/api/**/profile", 5));
    }

    @Test
    void rejectsEmptyPathSegments() {
        assertInvalid(new RouteLimitDto(1L, "/api//users", 5));
    }

    @Test
    void rejectsUnsupportedPathCharacters() {
        assertInvalid(new RouteLimitDto(1L, "/api/users/{id}", 5));
    }

    @Test
    void rejectsNonPositiveRequestsPerMinute() {
        assertInvalid(new RouteLimitDto(1L, "/api/users/**", 0));
    }

    private RouteLimitDto createValidRouteLimit(String routePattern) {
        when(planRepository.findById(1L)).thenReturn(Optional.of(plan));
        when(routeLimitRepository.existsByPlanIdAndRoutePattern(1L, routePattern)).thenReturn(false);
        when(routeLimitRepository.save(any(RouteLimit.class))).thenAnswer(invocation -> {
            RouteLimit routeLimit = invocation.getArgument(0);
            routeLimit.setId(10L);
            return routeLimit;
        });

        return routeLimitService.createRouteLimit(new RouteLimitDto(1L, routePattern, 5));
    }

    private void assertInvalid(RouteLimitDto request) {
        assertThrows(InvalidRouteLimitException.class, () -> routeLimitService.createRouteLimit(request));
        verify(routeLimitRepository, never()).save(any());
    }

    private Plan plan() {
        Plan plan = new Plan();
        plan.setId(1L);
        plan.setName("FREE");
        plan.setRequestsPerMinute(10);
        return plan;
    }

    private RouteLimit routeLimit(String routePattern, int requestsPerMinute) {
        RouteLimit routeLimit = new RouteLimit();
        routeLimit.setId(10L);
        routeLimit.setPlan(plan);
        routeLimit.setRoutePattern(routePattern);
        routeLimit.setRequestsPerMinute(requestsPerMinute);
        return routeLimit;
    }
}
