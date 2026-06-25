package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.Config.SecurityConfig;
import com.prakash.gateaway_service.DTO.RouteTrafficAnalyticsResponseDto;
import com.prakash.gateaway_service.Filter.JwtAuthenticationFilter;
import com.prakash.gateaway_service.Repository.AdminUserRepository;
import com.prakash.gateaway_service.Service.AnalyticsService;
import com.prakash.gateaway_service.Service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnalyticsController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AnalyticsService analyticsService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private AdminUserRepository adminUserRepository;

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void routeTrafficAnalyticsAsSuperAdmin() throws Exception {
        when(analyticsService.getRouteTrafficAnalytics()).thenReturn(List.of(routeTraffic()));

        mockMvc.perform(get("/admin/analytics/route-traffic"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].bucket").value("2026-06-18"))
                .andExpect(jsonPath("$[0].route").value("/api/products"))
                .andExpect(jsonPath("$[0].totalRequests").value(12))
                .andExpect(jsonPath("$[0].allowedRequests").value(8))
                .andExpect(jsonPath("$[0].blockedRequests").value(4));
    }

    @Test
    @WithMockUser(roles = "READ_ONLY_ADMIN")
    void routeTrafficAnalyticsAsReadOnlyAdmin() throws Exception {
        when(analyticsService.getRouteTrafficAnalytics()).thenReturn(List.of(routeTraffic()));

        mockMvc.perform(get("/admin/analytics/route-traffic"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "READ_ONLY_ADMIN")
    void routeTrafficAnalyticsReturnsEmptyData() throws Exception {
        when(analyticsService.getRouteTrafficAnalytics()).thenReturn(List.of());

        mockMvc.perform(get("/admin/analytics/route-traffic"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void unauthenticatedRouteTrafficAnalyticsDenied() throws Exception {
        mockMvc.perform(get("/admin/analytics/route-traffic"))
                .andExpect(status().isForbidden());
    }

    private RouteTrafficAnalyticsResponseDto routeTraffic() {
        return new RouteTrafficAnalyticsResponseDto(
                "2026-06-18",
                "/api/products",
                12,
                8,
                4
        );
    }
}
