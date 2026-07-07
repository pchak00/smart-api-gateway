package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.RouteGroup;
import com.prakash.gateaway_service.Entity.RouteGroupRule;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

public record RouteGroupResponseDto(
        Long id,
        String name,
        String description,
        boolean active,
        int priority,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<RouteGroupRuleResponseDto> rules
) {
    public static RouteGroupResponseDto from(RouteGroup routeGroup) {
        return new RouteGroupResponseDto(
                routeGroup.getId(),
                routeGroup.getName(),
                routeGroup.getDescription(),
                routeGroup.isActive(),
                routeGroup.getPriority() == null ? 0 : routeGroup.getPriority(),
                routeGroup.getCreatedAt(),
                routeGroup.getUpdatedAt(),
                routeGroup.getRules()
                        .stream()
                        .sorted(Comparator.comparing(RouteGroupRule::getPattern))
                        .map(RouteGroupRuleResponseDto::from)
                        .toList()
        );
    }
}
