package com.prakash.gateaway_service.DTO;


public record PlanDto(String planName,
                      Integer requestsPerMinute,
                      Double price) {
}
