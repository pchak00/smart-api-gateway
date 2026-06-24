package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.PlanDto;
import com.prakash.gateaway_service.DTO.PlanResponseDto;
import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Exception.DuplicatePlanException;
import com.prakash.gateaway_service.Repository.ClientRepository;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.RouteLimitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PlanServiceTest {

    private PlanRepository planRepository;
    private PlanService planService;

    @BeforeEach
    void setUp() {
        planRepository = mock(PlanRepository.class);
        ClientRepository clientRepository = mock(ClientRepository.class);
        RouteLimitRepository routeLimitRepository = mock(RouteLimitRepository.class);
        planService = new PlanService(planRepository, clientRepository, routeLimitRepository);
    }

    @Test
    void updatePlanChangesSupportedFields() {
        Plan plan = plan(1L, "FREE", 10, 0.0);
        when(planRepository.findById(1L)).thenReturn(Optional.of(plan));
        when(planRepository.findPlanByName("FREE PLUS")).thenReturn(Optional.empty());
        when(planRepository.save(plan)).thenReturn(plan);

        PlanResponseDto response = planService.updatePlan(
                1L,
                new PlanDto("FREE PLUS", 25, 4.99)
        );

        assertEquals(1L, response.id());
        assertEquals("FREE PLUS", response.planName());
        assertEquals(25, response.requestsPerMinute());
        assertEquals(4.99, response.price());
    }

    @Test
    void updatePlanRejectsDuplicatePlanName() {
        Plan plan = plan(1L, "FREE", 10, 0.0);
        Plan existingPlan = plan(2L, "PRO", 100, 29.0);
        when(planRepository.findById(1L)).thenReturn(Optional.of(plan));
        when(planRepository.findPlanByName("PRO")).thenReturn(Optional.of(existingPlan));

        assertThrows(
                DuplicatePlanException.class,
                () -> planService.updatePlan(1L, new PlanDto("PRO", 25, 4.99))
        );

        verify(planRepository, never()).save(plan);
    }

    private Plan plan(Long id, String name, Integer requestsPerMinute, Double price) {
        Plan plan = new Plan();
        plan.setId(id);
        plan.setName(name);
        plan.setRequestsPerMinute(requestsPerMinute);
        plan.setPrice(price);
        return plan;
    }
}
