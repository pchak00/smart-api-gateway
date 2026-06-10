package com.prakash.gateaway_service.DTO;


public record ClientRequestDto(String name,
                               Long planId,
                               Boolean active) {
}
