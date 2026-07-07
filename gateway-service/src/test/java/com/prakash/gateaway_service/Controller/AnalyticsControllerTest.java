package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.Config.SecurityConfig;
import com.prakash.gateaway_service.DTO.ClientAnalyticsResponseDto;
import com.prakash.gateaway_service.DTO.RouteAnalyticsGroupBy;
import com.prakash.gateaway_service.DTO.RouteAnalyticsResponseDto;
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
        when(analyticsService.getRouteTrafficAnalytics(null, null, null, RouteAnalyticsGroupBy.OPERATION)).thenReturn(List.of(routeTraffic()));

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
        when(analyticsService.getRouteTrafficAnalytics(null, null, null, RouteAnalyticsGroupBy.OPERATION)).thenReturn(List.of(routeTraffic()));

        mockMvc.perform(get("/admin/analytics/route-traffic"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "READ_ONLY_ADMIN")
    void routeTrafficAnalyticsReturnsEmptyData() throws Exception {
        when(analyticsService.getRouteTrafficAnalytics(null, null, null, RouteAnalyticsGroupBy.OPERATION)).thenReturn(List.of());

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

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void routeAnalyticsPassesPlanFilter() throws Exception {
        when(analyticsService.getRouteAnalytics("Free", null, null, RouteAnalyticsGroupBy.OPERATION)).thenReturn(List.of(
                new RouteAnalyticsResponseDto("/api/products", 7, 5, 2)
        ));

        mockMvc.perform(get("/admin/analytics/routes").param("planName", "Free"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].route").value("/api/products"))
                .andExpect(jsonPath("$[0].totalRequests").value(7));
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void clientAnalyticsIncludesPlanInformation() throws Exception {
        when(analyticsService.getClientAnalytics("PRO")).thenReturn(List.of(
                new ClientAnalyticsResponseDto(2L, "Demo Pro Client", 2L, "PRO", 11, 10, 1)
        ));

        mockMvc.perform(get("/admin/analytics/clients").param("planName", "PRO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].clientName").value("Demo Pro Client"))
                .andExpect(jsonPath("$[0].planId").value(2))
                .andExpect(jsonPath("$[0].planName").value("PRO"))
                .andExpect(jsonPath("$[0].blockedRequests").value(1));
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void routeTrafficAnalyticsPassesPlanFilter() throws Exception {
        when(analyticsService.getRouteTrafficAnalytics("Enterprise", null, null, RouteAnalyticsGroupBy.OPERATION)).thenReturn(List.of(routeTraffic()));

        mockMvc.perform(get("/admin/analytics/route-traffic").param("planName", "Enterprise"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].route").value("/api/products"));
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
