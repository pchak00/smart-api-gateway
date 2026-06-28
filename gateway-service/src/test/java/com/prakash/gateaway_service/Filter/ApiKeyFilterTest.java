package com.prakash.gateaway_service.Filter;

import com.prakash.gateaway_service.Entity.Client;
import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Repository.ClientRepository;
import com.prakash.gateaway_service.Service.AbuseDetectionService;
import com.prakash.gateaway_service.Service.GatewayUpstreamResolver;
import com.prakash.gateaway_service.Service.RateLimitResolverService;
import com.prakash.gateaway_service.Service.RateLimitResolverService.ResolvedRateLimit;
import com.prakash.gateaway_service.Service.RateLimiterService;
import com.prakash.gateaway_service.Service.UsageLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.server.mvc.common.MvcUtils;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.servlet.function.HandlerFunction;
import org.springframework.web.servlet.function.ServerRequest;
import org.springframework.web.servlet.function.ServerResponse;

import java.net.URI;
import java.util.HashMap;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ApiKeyFilterTest {

    private ClientRepository clientRepository;
    private RateLimiterService rateLimiterService;
    private UsageLogService usageLogService;
    private RateLimitResolverService rateLimitResolverService;
    private AbuseDetectionService abuseDetectionService;
    private GatewayUpstreamResolver gatewayUpstreamResolver;
    private ApiKeyFilter apiKeyFilter;

    @BeforeEach
    void setUp() {
        clientRepository = mock(ClientRepository.class);
        rateLimiterService = mock(RateLimiterService.class);
        usageLogService = mock(UsageLogService.class);
        rateLimitResolverService = mock(RateLimitResolverService.class);
        abuseDetectionService = mock(AbuseDetectionService.class);
        gatewayUpstreamResolver = mock(GatewayUpstreamResolver.class);
        apiKeyFilter = new ApiKeyFilter(
                clientRepository,
                rateLimiterService,
                usageLogService,
                rateLimitResolverService,
                abuseDetectionService,
                gatewayUpstreamResolver
        );
    }

    @Test
    void doesNotResolveUpstreamWhenApiKeyIsMissing() throws Exception {
        ServerRequest request = request(null);
        HandlerFunction<ServerResponse> next = mock(HandlerFunction.class);

        ServerResponse response = apiKeyFilter.filter(request, next);

        assertEquals(401, response.statusCode().value());
        verify(rateLimiterService, never()).isAllowed(anyString(), anyString(), anyInt());
        verify(gatewayUpstreamResolver, never()).resolveUpstreamBaseUri();
        verify(next, never()).handle(request);
    }

    @Test
    void doesNotResolveUpstreamWhenRateLimitIsExceeded() throws Exception {
        Client client = activeClient();
        ServerRequest request = request("free-demo-api-key");
        HandlerFunction<ServerResponse> next = mock(HandlerFunction.class);
        when(clientRepository.findByApiKey("free-demo-api-key")).thenReturn(Optional.of(client));
        when(rateLimitResolverService.resolve(client, "/api/products"))
                .thenReturn(planLimit("/api/products", 10));
        when(rateLimiterService.isAllowed("free-demo-api-key", "plan:1:path:/api/products", 10)).thenReturn(false);

        ServerResponse response = apiKeyFilter.filter(request, next);

        assertEquals(429, response.statusCode().value());
        verify(usageLogService).log(client, "/api/products", "GET", false, 429, "Rate limit exceeded");
        verify(abuseDetectionService).checkAndCreateAlert(client);
        verify(gatewayUpstreamResolver, never()).resolveUpstreamBaseUri();
        verify(next, never()).handle(request);
    }

    @Test
    void oldApiKeyNoLongerAuthorizesAfterRotationAndNewApiKeyUsesRateLimit() throws Exception {
        Client client = activeClient();
        client.setApiKey("new-api-key");
        ServerRequest oldKeyRequest = request("old-api-key");
        ServerRequest newKeyRequest = request("new-api-key");
        HandlerFunction<ServerResponse> next = mock(HandlerFunction.class);
        URI upstreamUri = URI.create("http://dynamic-backend:9000");
        when(clientRepository.findByApiKey("old-api-key")).thenReturn(Optional.empty());
        when(clientRepository.findByApiKey("new-api-key")).thenReturn(Optional.of(client));
        when(rateLimitResolverService.resolve(client, "/api/products"))
                .thenReturn(planLimit("/api/products", 10));
        when(rateLimiterService.isAllowed("new-api-key", "plan:1:path:/api/products", 10)).thenReturn(true);
        when(gatewayUpstreamResolver.resolveUpstreamBaseUri()).thenReturn(upstreamUri);
        when(next.handle(newKeyRequest)).thenReturn(ServerResponse.ok().build());

        ServerResponse oldKeyResponse = apiKeyFilter.filter(oldKeyRequest, next);
        ServerResponse newKeyResponse = apiKeyFilter.filter(newKeyRequest, next);

        assertEquals(401, oldKeyResponse.statusCode().value());
        assertEquals(200, newKeyResponse.statusCode().value());
        verify(rateLimiterService).isAllowed("new-api-key", "plan:1:path:/api/products", 10);
        verify(next, never()).handle(oldKeyRequest);
        verify(next).handle(newKeyRequest);
    }

    @Test
    void disabledClientCannotCallProtectedGatewayRoute() throws Exception {
        Client client = activeClient();
        client.setActive(false);
        ServerRequest request = request("free-demo-api-key");
        HandlerFunction<ServerResponse> next = mock(HandlerFunction.class);
        when(clientRepository.findByApiKey("free-demo-api-key")).thenReturn(Optional.of(client));

        ServerResponse response = apiKeyFilter.filter(request, next);

        assertEquals(403, response.statusCode().value());
        verify(usageLogService).log(client, "/api/products", "GET", false, 403, "Client inactive");
        verify(rateLimiterService, never()).isAllowed(anyString(), anyString(), anyInt());
        verify(next, never()).handle(request);
    }

    @Test
    void resolvesUpstreamAndSetsGatewayRequestUrlForAllowedRequest() throws Exception {
        Client client = activeClient();
        ServerRequest request = request("free-demo-api-key");
        HandlerFunction<ServerResponse> next = mock(HandlerFunction.class);
        URI upstreamUri = URI.create("http://dynamic-backend:9000");
        when(clientRepository.findByApiKey("free-demo-api-key")).thenReturn(Optional.of(client));
        when(rateLimitResolverService.resolve(client, "/api/products"))
                .thenReturn(planLimit("/api/products", 10));
        when(rateLimiterService.isAllowed("free-demo-api-key", "plan:1:path:/api/products", 10)).thenReturn(true);
        when(gatewayUpstreamResolver.resolveUpstreamBaseUri()).thenReturn(upstreamUri);
        when(next.handle(request)).thenReturn(ServerResponse.ok().build());

        ServerResponse response = apiKeyFilter.filter(request, next);

        assertEquals(200, response.statusCode().value());
        assertEquals(upstreamUri, request.attributes().get(MvcUtils.GATEWAY_REQUEST_URL_ATTR));
        verify(gatewayUpstreamResolver).resolveUpstreamBaseUri();
        verify(next).handle(request);
        verify(usageLogService).log(client, "/api/products", "GET", true, 200, "Client is allowed");
        verify(abuseDetectionService, never()).checkAndCreateAlert(client);
    }

    private ServerRequest request(String apiKey) {
        ServerRequest request = mock(ServerRequest.class);
        ServerRequest.Headers headers = mock(ServerRequest.Headers.class);
        MockHttpServletRequest servletRequest = new MockHttpServletRequest("GET", "/api/products");
        when(request.headers()).thenReturn(headers);
        when(headers.firstHeader("X-API-Key")).thenReturn(apiKey);
        when(request.path()).thenReturn("/api/products");
        when(request.method()).thenReturn(HttpMethod.GET);
        when(request.attributes()).thenReturn(new HashMap<>());
        when(request.servletRequest()).thenReturn(servletRequest);
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

    private ResolvedRateLimit planLimit(String path, int requestsPerMinute) {
        return new ResolvedRateLimit(
                requestsPerMinute,
                "plan:1:path:" + path,
                "PLAN",
                null
        );
    }
}
