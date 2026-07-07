package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.RouteAnalyticsGroupBy;
import com.prakash.gateaway_service.Entity.RouteGroup;
import com.prakash.gateaway_service.Entity.RouteGroupMatchType;
import com.prakash.gateaway_service.Entity.RouteGroupRule;
import com.prakash.gateaway_service.Repository.RouteGroupRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RouteGroupingServiceTest {

    private RouteGroupRepository routeGroupRepository;
    private RouteGroupingService routeGroupingService;

    @BeforeEach
    void setUp() {
        routeGroupRepository = mock(RouteGroupRepository.class);
        routeGroupingService = new RouteGroupingService(routeGroupRepository);
    }

    @Test
    void normalizeRoutePatternReplacesIdsAndUuids() {
        assertEquals("/users/:id", routeGroupingService.normalizeRoutePattern("/users/123?include=orders"));
        assertEquals(
                "/clients/:uuid",
                routeGroupingService.normalizeRoutePattern("/clients/83364c91-75c7-4349-a8e0-77872c5ba218/")
        );
        assertEquals("/v1/images/generations", routeGroupingService.normalizeRoutePattern("/v1/images/generations"));
    }

    @Test
    void operationGroupingUsesHighestPriorityMatchingGroup() {
        RouteGroup lowPriority = group("Images", 10, rule("POST", "/v1/images/**", RouteGroupMatchType.GLOB));
        RouteGroup highPriority = group("Create image", 50, rule("POST", "/v1/images/generations", RouteGroupMatchType.EXACT));
        when(routeGroupRepository.findByActiveTrueOrderByPriorityDescNameAsc()).thenReturn(List.of(lowPriority, highPriority));

        RouteGroupingService.ResolvedRouteGroup resolved = routeGroupingService.resolve(
                RouteAnalyticsGroupBy.OPERATION,
                "post",
                "/v1/images/generations"
        );

        assertEquals("Create image", resolved.label());
    }

    @Test
    void methodMatchingIsCaseInsensitiveAndOptionalMeansAnyMethod() {
        RouteGroupRule postRule = rule("post", "/api/products", RouteGroupMatchType.EXACT);
        RouteGroupRule anyRule = rule(null, "/api/reports", RouteGroupMatchType.EXACT);

        assertTrue(routeGroupingService.matches(postRule, "POST", "/api/products"));
        assertFalse(routeGroupingService.matches(postRule, "GET", "/api/products"));
        assertTrue(routeGroupingService.matches(anyRule, "DELETE", "/api/reports"));
    }

    private RouteGroup group(String name, int priority, RouteGroupRule rule) {
        RouteGroup group = new RouteGroup();
        group.setName(name);
        group.setPriority(priority);
        group.setActive(true);
        group.addRule(rule);
        return group;
    }

    private RouteGroupRule rule(String method, String pattern, RouteGroupMatchType matchType) {
        RouteGroupRule rule = new RouteGroupRule();
        rule.setMethod(method);
        rule.setPattern(pattern);
        rule.setMatchType(matchType);
        return rule;
    }
}
