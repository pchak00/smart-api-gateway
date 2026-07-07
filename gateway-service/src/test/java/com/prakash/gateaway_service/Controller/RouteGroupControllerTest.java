package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.Config.SecurityConfig;
import com.prakash.gateaway_service.DTO.RouteGroupResponseDto;
import com.prakash.gateaway_service.DTO.RouteGroupRuleResponseDto;
import com.prakash.gateaway_service.Entity.RouteGroupMatchType;
import com.prakash.gateaway_service.Filter.JwtAuthenticationFilter;
import com.prakash.gateaway_service.Repository.AdminUserRepository;
import com.prakash.gateaway_service.Service.JwtService;
import com.prakash.gateaway_service.Service.RouteGroupService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RouteGroupController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class RouteGroupControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RouteGroupService routeGroupService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private AdminUserRepository adminUserRepository;

    @Test
    @WithMockUser(roles = "READ_ONLY_ADMIN")
    void readOnlyAdminCanListRouteGroups() throws Exception {
        when(routeGroupService.findAllRouteGroups()).thenReturn(List.of(routeGroup()));

        mockMvc.perform(get("/admin/route-groups"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Create image"))
                .andExpect(jsonPath("$[0].rules[0].pattern").value("/v1/images/**"));
    }

    @Test
    @WithMockUser(roles = "READ_ONLY_ADMIN")
    void readOnlyAdminCannotCreateRouteGroups() throws Exception {
        mockMvc.perform(post("/admin/route-groups")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(routeGroupJson()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void superAdminCanCreateRouteGroup() throws Exception {
        when(routeGroupService.createRouteGroup(any())).thenReturn(routeGroup());

        mockMvc.perform(post("/admin/route-groups")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(routeGroupJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Create image"));
    }

    private RouteGroupResponseDto routeGroup() {
        return new RouteGroupResponseDto(
                1L,
                "Create image",
                null,
                true,
                100,
                null,
                null,
                List.of(new RouteGroupRuleResponseDto(
                        10L,
                        "POST",
                        "/v1/images/**",
                        RouteGroupMatchType.GLOB,
                        null,
                        null
                ))
        );
    }

    private String routeGroupJson() {
        return """
                {
                  "name": "Create image",
                  "active": true,
                  "priority": 100,
                  "rules": [
                    {
                      "method": "POST",
                      "pattern": "/v1/images/**",
                      "matchType": "GLOB"
                    }
                  ]
                }
                """;
    }
}
