package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.RouteGroupRequestDto;
import com.prakash.gateaway_service.DTO.RouteGroupRuleRequestDto;
import com.prakash.gateaway_service.Entity.RouteGroup;
import com.prakash.gateaway_service.Entity.RouteGroupMatchType;
import com.prakash.gateaway_service.Exception.DuplicateRouteGroupException;
import com.prakash.gateaway_service.Exception.InvalidRouteGroupException;
import com.prakash.gateaway_service.Repository.RouteGroupRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RouteGroupServiceTest {

    private RouteGroupRepository routeGroupRepository;
    private RouteGroupService routeGroupService;

    @BeforeEach
    void setUp() {
        routeGroupRepository = mock(RouteGroupRepository.class);
        routeGroupService = new RouteGroupService(routeGroupRepository);
    }

    @Test
    void createRouteGroupValidatesDuplicateNameCaseInsensitively() {
        when(routeGroupRepository.existsByNameIgnoreCase("Create image")).thenReturn(true);

        assertThrows(DuplicateRouteGroupException.class, () -> routeGroupService.createRouteGroup(request("Create image")));
    }

    @Test
    void createRouteGroupRejectsInvalidPattern() {
        RouteGroupRequestDto request = new RouteGroupRequestDto(
                "Create image",
                null,
                true,
                10,
                List.of(new RouteGroupRuleRequestDto(null, "api/images", RouteGroupMatchType.EXACT))
        );

        assertThrows(InvalidRouteGroupException.class, () -> routeGroupService.createRouteGroup(request));
    }

    @Test
    void createRouteGroupNormalizesMethodAndReturnsRules() {
        when(routeGroupRepository.existsByNameIgnoreCase("Create image")).thenReturn(false);
        when(routeGroupRepository.save(any(RouteGroup.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = routeGroupService.createRouteGroup(request("Create image"));

        assertEquals("Create image", response.name());
        assertEquals("POST", response.rules().get(0).method());
        assertEquals(RouteGroupMatchType.EXACT, response.rules().get(0).matchType());
    }

    @Test
    void updateRouteGroupRejectsDuplicateNameOnAnotherGroup() {
        RouteGroup existing = new RouteGroup();
        existing.setName("Existing");
        RouteGroup other = new RouteGroup();
        other.setName("Other");
        when(routeGroupRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(routeGroupRepository.findByNameIgnoreCase("Create image")).thenReturn(Optional.of(other));

        assertThrows(DuplicateRouteGroupException.class, () -> routeGroupService.updateRouteGroup(1L, request("Create image")));
    }

    private RouteGroupRequestDto request(String name) {
        return new RouteGroupRequestDto(
                name,
                null,
                true,
                10,
                List.of(new RouteGroupRuleRequestDto("post", "/v1/images/generations", RouteGroupMatchType.EXACT))
        );
    }
}
