package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.PlanName;

public record PlanDto(PlanName planName,
                      Integer requestsPerMinute,
                      Double price) {
}
