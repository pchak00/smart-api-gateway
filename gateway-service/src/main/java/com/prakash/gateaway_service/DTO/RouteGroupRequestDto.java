package com.prakash.gateaway_service.DTO;

import java.util.List;

public record RouteGroupRequestDto(
        String name,
        String description,
        Boolean active,
        Integer priority,
        List<RouteGroupRuleRequestDto> rules
) {
}
