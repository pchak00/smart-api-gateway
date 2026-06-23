
package com.prakash.gateaway_service.Filter;

import com.prakash.gateaway_service.Entity.Client;
import com.prakash.gateaway_service.Repository.ClientRepository;
import com.prakash.gateaway_service.Service.AbuseDetectionService;
import com.prakash.gateaway_service.Service.GatewayUpstreamResolver;
import com.prakash.gateaway_service.Service.RateLimitResolverService;
import com.prakash.gateaway_service.Service.RateLimiterService;
import com.prakash.gateaway_service.Service.UsageLogService;
import org.jspecify.annotations.NonNull;
import org.springframework.cloud.gateway.server.mvc.common.MvcUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.function.HandlerFilterFunction;
import org.springframework.web.servlet.function.HandlerFunction;
import org.springframework.web.servlet.function.ServerRequest;
import org.springframework.web.servlet.function.ServerResponse;

import java.util.Optional;

@Component
public class ApiKeyFilter implements HandlerFilterFunction<ServerResponse, ServerResponse> {

    private final ClientRepository clientRepository;
    private final RateLimiterService rateLimiterService;
    private final UsageLogService usageLogService;
    private final RateLimitResolverService rateLimitResolverService;
    private final AbuseDetectionService abuseDetectionService;
    private final GatewayUpstreamResolver gatewayUpstreamResolver;

    public ApiKeyFilter(ClientRepository clientRepository, RateLimiterService rateLimiterService, UsageLogService usageLogService, RateLimitResolverService rateLimitResolverService, AbuseDetectionService abuseDetectionService, GatewayUpstreamResolver gatewayUpstreamResolver) {
        this.clientRepository = clientRepository;
        this.rateLimiterService = rateLimiterService;
        this.usageLogService = usageLogService;
        this.rateLimitResolverService = rateLimitResolverService;
        this.abuseDetectionService = abuseDetectionService;
        this.gatewayUpstreamResolver = gatewayUpstreamResolver;
    }

    @Override
    public ServerResponse filter(ServerRequest request, @NonNull HandlerFunction<ServerResponse> next) throws Exception {

        String apiKey = request.headers().firstHeader("X-API-Key");

        //  Check if header exists
        if (apiKey == null || apiKey.isEmpty()) {
            return ServerResponse.status(401).body("Missing API Key");
        }

        //  Find client
        Optional<Client> clientOpt = clientRepository.findByApiKey(apiKey);

        if (clientOpt.isEmpty()) {
            return ServerResponse.status(401).body("Invalid API Key");
        }

        //Check active
        Client client = clientOpt.get();
        String path = request.path();
        String method = request.method().name();

        if (!client.getActive()) {
            usageLogService.log(client, path, method, false, 403, "Client inactive");
            return ServerResponse.status(403).body("Client is inactive");
        }

        //check rate limit
        Integer limit = rateLimitResolverService.resolveLimit(client, path);
        boolean isAllowed = rateLimiterService.isAllowed(client.getApiKey(), path, limit);
        if (!isAllowed) {
            usageLogService.log(client, path, method, false, 429, "Rate limit exceeded");


            //ABUSE CHECK
            abuseDetectionService.checkAndCreateAlert(client);

            return ServerResponse.status(429).body("Rate limit exceeded");
        }

        //ABUSE CHECK
        abuseDetectionService.checkAndCreateAlert(client);

        // Continue request
        usageLogService.log(client, path, method, true, 200, "Client is allowed");
        MvcUtils.setRequestUrl(request, gatewayUpstreamResolver.resolveUpstreamBaseUri());
        return next.handle(request);
    }
}
