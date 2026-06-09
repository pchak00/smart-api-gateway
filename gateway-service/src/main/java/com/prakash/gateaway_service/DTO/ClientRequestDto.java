package com.prakash.gateaway_service.DTO;

import com.prakash.gateaway_service.Entity.PlanName;

public record ClientRequestDto(String name,
                               PlanName planName,
                               Boolean active) {
}
