package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.RouteGroupMatchType;
import com.prakash.gateaway_service.Entity.RouteGroupRule;

import java.time.LocalDateTime;

public record RouteGroupRuleResponseDto(
        Long id,
        String method,
        String pattern,
        RouteGroupMatchType matchType,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static RouteGroupRuleResponseDto from(RouteGroupRule rule) {
        return new RouteGroupRuleResponseDto(
                rule.getId(),
                rule.getMethod(),
                rule.getPattern(),
                rule.getMatchType(),
                rule.getCreatedAt(),
                rule.getUpdatedAt()
        );
    }
}
