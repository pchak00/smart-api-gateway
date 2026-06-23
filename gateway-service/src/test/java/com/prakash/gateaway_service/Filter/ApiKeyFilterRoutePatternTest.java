package com.prakash.gateaway_service.Filter;

import com.prakash.gateaway_service.Entity.Client;
import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Entity.RouteLimit;
import com.prakash.gateaway_service.Repository.ClientRepository;
import com.prakash.gateaway_service.Repository.RouteLimitRepository;
import com.prakash.gateaway_service.Service.AbuseDetectionService;
import com.prakash.gateaway_service.Service.GatewayUpstreamResolver;
import com.prakash.gateaway_service.Service.RateLimitResolverService;
import com.prakash.gateaway_service.Service.RateLimiterService;
import com.prakash.gateaway_service.Service.UsageLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.web.servlet.function.HandlerFunction;
import org.springframework.web.servlet.function.ServerRequest;
import org.springframework.web.servlet.function.ServerResponse;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ApiKeyFilterRoutePatternTest {

    private ClientRepository clientRepository;
    private RouteLimitRepository routeLimitRepository;
    private RateLimiterService rateLimiterService;
    private UsageLogService usageLogService;
    private AbuseDetectionService abuseDetectionService;
    private GatewayUpstreamResolver gatewayUpstreamResolver;
    private ApiKeyFilter apiKeyFilter;
    private Client client;

    @BeforeEach
    void setUp() {
        clientRepository = mock(ClientRepository.class);
        routeLimitRepository = mock(RouteLimitRepository.class);
        rateLimiterService = mock(RateLimiterService.class);
        usageLogService = mock(UsageLogService.class);
        abuseDetectionService = mock(AbuseDetectionService.class);
        gatewayUpstreamResolver = mock(GatewayUpstreamResolver.class);
        client = activeClient();
        apiKeyFilter = new ApiKeyFilter(
                clientRepository,
                rateLimiterService,
                usageLogService,
                new RateLimitResolverService(routeLimitRepository),
                abuseDetectionService,
                gatewayUpstreamResolver
        );
    }

    @Test
    void matchingRoutePatternLimitIsUsedByGatewayFilter() throws Exception {
        ServerRequest request = request("/api/reports/daily");
        HandlerFunction<ServerResponse> next = mock(HandlerFunction.class);
        when(clientRepository.findByApiKey("free-demo-api-key")).thenReturn(Optional.of(client));
        when(routeLimitRepository.findByPlanId(1L)).thenReturn(List.of(routeLimit("/api/reports/**", 2)));
        when(rateLimiterService.isAllowed("free-demo-api-key", "/api/reports/daily", 2)).thenReturn(false);

        ServerResponse response = apiKeyFilter.filter(request, next);

        assertEquals(429, response.statusCode().value());
        verify(rateLimiterService).isAllowed("free-demo-api-key", "/api/reports/daily", 2);
        verify(usageLogService).log(client, "/api/reports/daily", "GET", false, 429, "Rate limit exceeded");
        verify(abuseDetectionService).checkAndCreateAlert(client);
        verify(gatewayUpstreamResolver, never()).resolveUpstreamBaseUri();
        verify(next, never()).handle(request);
    }

    private ServerRequest request(String path) {
        ServerRequest request = mock(ServerRequest.class);
        ServerRequest.Headers headers = mock(ServerRequest.Headers.class);
        when(request.headers()).thenReturn(headers);
        when(headers.firstHeader("X-API-Key")).thenReturn("free-demo-api-key");
        when(request.path()).thenReturn(path);
        when(request.method()).thenReturn(HttpMethod.GET);
        when(request.attributes()).thenReturn(new HashMap<>());
        return request;
    }

    private Client activeClient() {
        Plan plan = new Plan();
        plan.setId(1L);
        plan.setName("FREE");
        plan.setRequestsPerMinute(10);

        Client client = new Client();
        client.setId(1L);
        client.setName("Demo Free Client");
        client.setApiKey("free-demo-api-key");
        client.setPlan(plan);
        client.setActive(true);
        return client;
    }

    private RouteLimit routeLimit(String routePattern, int requestsPerMinute) {
        RouteLimit routeLimit = new RouteLimit();
        routeLimit.setId((long) requestsPerMinute);
        routeLimit.setPlan(client.getPlan());
        routeLimit.setRoutePattern(routePattern);
        routeLimit.setRequestsPerMinute(requestsPerMinute);
        return routeLimit;
    }
}
