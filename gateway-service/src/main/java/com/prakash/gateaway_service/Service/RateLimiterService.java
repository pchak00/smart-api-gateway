package com.prakash.gateaway_service.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class RateLimiterService {

    static final Duration WINDOW = Duration.ofSeconds(60);
    static final Duration TTL_BUFFER = Duration.ofSeconds(5);
    static final String SLIDING_WINDOW_SCRIPT = """
            local key = KEYS[1]
            local now = tonumber(ARGV[1])
            local window = tonumber(ARGV[2])
            local limit = tonumber(ARGV[3])
            local member = ARGV[4]
            local ttl = tonumber(ARGV[5])
            local cutoff = now - window

            redis.call('ZREMRANGEBYSCORE', key, 0, cutoff)
            local count = redis.call('ZCARD', key)

            if count >= limit then
                local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
                local resetAt = now + window
                if oldest[2] then
                    resetAt = tonumber(oldest[2]) + window
                end
                redis.call('PEXPIRE', key, ttl)
                return {0, count, resetAt}
            end

            redis.call('ZADD', key, now, member)
            count = count + 1
            redis.call('PEXPIRE', key, ttl)

            local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
            local resetAt = now + window
            if oldest[2] then
                resetAt = tonumber(oldest[2]) + window
            end

            return {1, count, resetAt}
            """;

    private final StringRedisTemplate redisTemplate;
    private final RedisScript<List> slidingWindowScript;
    private final Clock clock;

    @Autowired
    public RateLimiterService(StringRedisTemplate redisTemplate) {
        this(redisTemplate, Clock.systemUTC());
    }

    RateLimiterService(StringRedisTemplate redisTemplate, Clock clock) {
        this.redisTemplate = redisTemplate;
        this.clock = clock;
        DefaultRedisScript<List> script = new DefaultRedisScript<>();
        script.setScriptText(SLIDING_WINDOW_SCRIPT);
        script.setResultType(List.class);
        this.slidingWindowScript = script;
    }

    public boolean isAllowed(String apiKey, String rateLimitBucket, Integer limit) {
        return checkAllowed(apiKey, rateLimitBucket, limit).allowed();
    }

    public RateLimitDecision checkAllowed(String apiKey, String rateLimitBucket, Integer limit) {
        if (limit == null || limit <= 0) {
            return new RateLimitDecision(false, limit == null ? 0 : limit, 0, 0, 0, nowMillis());
        }

        long now = nowMillis();
        long windowMs = WINDOW.toMillis();
        long ttlMs = windowMs + TTL_BUFFER.toMillis();
        List result = redisTemplate.execute(
                slidingWindowScript,
                List.of(redisKey(apiKey, rateLimitBucket)),
                String.valueOf(now),
                String.valueOf(windowMs),
                String.valueOf(limit),
                uniqueMember(now),
                String.valueOf(ttlMs)
        );

        if (result == null || result.size() < 3) {
            return new RateLimitDecision(false, limit, 0, 0, 0, now);
        }

        boolean allowed = numberAt(result, 0) == 1;
        long currentCount = numberAt(result, 1);
        long resetAt = numberAt(result, 2);
        long remaining = allowed ? Math.max(limit - currentCount, 0) : 0;
        long retryAfterMs = allowed ? 0 : Math.max(resetAt - now, 0);

        return new RateLimitDecision(allowed, limit, currentCount, remaining, retryAfterMs, resetAt);
    }

    String redisKey(String apiKey, String rateLimitBucket) {
        return "rate_limit:sliding:" + apiKey + ":" + rateLimitBucket;
    }

    String uniqueMember(long now) {
        return now + ":" + UUID.randomUUID();
    }

    private long nowMillis() {
        return Instant.now(clock).toEpochMilli();
    }

    private long numberAt(List result, int index) {
        return ((Number) result.get(index)).longValue();
    }

    public record RateLimitDecision(
            boolean allowed,
            int limit,
            long currentCount,
            long remainingRequests,
            long retryAfterMillis,
            long resetAtEpochMillis
    ) {
    }
}
