package com.prakash.gateaway_service.Service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RateLimiterServiceTest {

    private static final long NOW = 1_700_000_000_000L;

    private StringRedisTemplate redisTemplate;
    private RateLimiterService rateLimiterService;

    @BeforeEach
    void setUp() {
        redisTemplate = mock(StringRedisTemplate.class);
        rateLimiterService = new RateLimiterService(
                redisTemplate,
                Clock.fixed(Instant.ofEpochMilli(NOW), ZoneOffset.UTC)
        );
    }

    @Test
    void slidingWindowAllowsRequestsBelowLimit() {
        when(redisTemplate.execute(
                any(RedisScript.class),
                anyList(),
                anyString(),
                anyString(),
                anyString(),
                anyString(),
                anyString()
        )).thenReturn(List.of(1L, 2L, NOW + 60_000L));

        RateLimiterService.RateLimitDecision decision =
                rateLimiterService.checkAllowed("client-key", "plan:1:path:/api/products", 10);

        assertTrue(decision.allowed());
        assertEquals(10, decision.limit());
        assertEquals(2, decision.currentCount());
        assertEquals(8, decision.remainingRequests());
        assertEquals(0, decision.retryAfterMillis());
        assertEquals(NOW + 60_000L, decision.resetAtEpochMillis());
        verify(redisTemplate).execute(
                any(RedisScript.class),
                eq(List.of("rate_limit:sliding:client-key:plan:1:path:/api/products")),
                eq(String.valueOf(NOW)),
                eq("60000"),
                eq("10"),
                anyString(),
                eq("65000")
        );
    }

    @Test
    void slidingWindowBlocksWhenLimitIsReached() {
        when(redisTemplate.execute(
                any(RedisScript.class),
                anyList(),
                anyString(),
                anyString(),
                anyString(),
                anyString(),
                anyString()
        )).thenReturn(List.of(0L, 10L, NOW + 12_500L));

        RateLimiterService.RateLimitDecision decision =
                rateLimiterService.checkAllowed("client-key", "route:plan:1:pattern:/api/products", 10);

        assertFalse(decision.allowed());
        assertEquals(10, decision.currentCount());
        assertEquals(0, decision.remainingRequests());
        assertEquals(12_500, decision.retryAfterMillis());
        assertEquals(NOW + 12_500L, decision.resetAtEpochMillis());
    }

    @Test
    void missingRedisScriptResultFailsClosed() {
        when(redisTemplate.execute(
                any(RedisScript.class),
                anyList(),
                anyString(),
                anyString(),
                anyString(),
                anyString(),
                anyString()
        )).thenReturn(null);

        RateLimiterService.RateLimitDecision decision =
                rateLimiterService.checkAllowed("client-key", "plan:1:path:/api/products", 10);

        assertFalse(decision.allowed());
        assertEquals(10, decision.limit());
        assertEquals(0, decision.currentCount());
    }

    @Test
    void redisKeyIsIsolatedByApiKeyAndResolvedBucket() {
        assertEquals(
                "rate_limit:sliding:first-key:plan:1:path:/api/products",
                rateLimiterService.redisKey("first-key", "plan:1:path:/api/products")
        );
        assertEquals(
                "rate_limit:sliding:second-key:route:plan:1:pattern:/api/products",
                rateLimiterService.redisKey("second-key", "route:plan:1:pattern:/api/products")
        );
    }

    @Test
    void uniqueMembersAvoidSameMillisecondCollisions() {
        String first = rateLimiterService.uniqueMember(NOW);
        String second = rateLimiterService.uniqueMember(NOW);

        assertTrue(first.startsWith(NOW + ":"));
        assertTrue(second.startsWith(NOW + ":"));
        assertNotEquals(first, second);
    }

    @Test
    void luaScriptUsesSlidingWindowSortedSetOperations() {
        String script = RateLimiterService.SLIDING_WINDOW_SCRIPT;

        assertTrue(script.contains("ZREMRANGEBYSCORE"));
        assertTrue(script.contains("ZCARD"));
        assertTrue(script.contains("ZADD"));
        assertTrue(script.contains("PEXPIRE"));
        assertTrue(script.contains("now - window"));
    }
}
