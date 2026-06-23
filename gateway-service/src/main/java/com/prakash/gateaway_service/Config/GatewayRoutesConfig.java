package com.prakash.gateaway_service.Config;

import com.prakash.gateaway_service.Filter.ApiKeyFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions.http;

@Configuration
public class GatewayRoutesConfig {

    @Bean
    public RouterFunction<ServerResponse> backendRoute(ApiKeyFilter apiKeyFilter) {
        return route("backend-service-route")
                .GET("/api/**", http())
                .filter(apiKeyFilter)
                .build();
    }
}
