package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.RouteGroupMatchType;

public record RouteGroupRuleRequestDto(
        String method,
        String pattern,
        RouteGroupMatchType matchType
) {
}
