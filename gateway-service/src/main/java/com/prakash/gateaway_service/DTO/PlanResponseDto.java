package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.Plan;

public record PlanResponseDto(
        Long id,
        String planName,
        Integer requestsPerMinute,
        Double price
) {
    public static PlanResponseDto from(Plan plan) {
        return new PlanResponseDto(plan.getId(), plan.getName(), plan.getRequestsPerMinute(), plan.getPrice());
    }
}
