package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.Config.SecurityConfig;
import com.prakash.gateaway_service.Exception.InvalidRouteLimitException;
import com.prakash.gateaway_service.Filter.JwtAuthenticationFilter;
import com.prakash.gateaway_service.Repository.AdminUserRepository;
import com.prakash.gateaway_service.Service.AbuseDetectionService;
import com.prakash.gateaway_service.Service.ClientService;
import com.prakash.gateaway_service.Service.JwtService;
import com.prakash.gateaway_service.Service.PlanService;
import com.prakash.gateaway_service.Service.RouteLimitService;
import com.prakash.gateaway_service.Service.UsageLogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(GatewayController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class RouteLimitControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UsageLogService usageLogService;

    @MockitoBean
    private ClientService clientService;

    @MockitoBean
    private PlanService planService;

    @MockitoBean
    private RouteLimitService routeLimitService;

    @MockitoBean
    private AbuseDetectionService abuseDetectionService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private AdminUserRepository adminUserRepository;

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void invalidRoutePatternReturnsBadRequest() throws Exception {
        when(routeLimitService.createRouteLimit(any()))
                .thenThrow(new InvalidRouteLimitException("* wildcards must be whole path segments"));

        mockMvc.perform(post("/admin/clients/routeLimits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "planId": 1,
                                  "routePattern": "/api/user*",
                                  "requestsPerMinute": 5
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("* wildcards must be whole path segments"));
    }
}
