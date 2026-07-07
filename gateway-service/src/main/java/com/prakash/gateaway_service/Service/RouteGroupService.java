package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.RouteGroupRequestDto;
import com.prakash.gateaway_service.DTO.RouteGroupResponseDto;
import com.prakash.gateaway_service.DTO.RouteGroupRuleRequestDto;
import com.prakash.gateaway_service.Entity.RouteGroup;
import com.prakash.gateaway_service.Entity.RouteGroupMatchType;
import com.prakash.gateaway_service.Entity.RouteGroupRule;
import com.prakash.gateaway_service.Exception.DuplicateRouteGroupException;
import com.prakash.gateaway_service.Exception.InvalidRouteGroupException;
import com.prakash.gateaway_service.Exception.RouteGroupNotFoundException;
import com.prakash.gateaway_service.Repository.RouteGroupRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class RouteGroupService {

    private static final Pattern HTTP_METHOD = Pattern.compile("^[A-Za-z]+$");
    private static final Pattern NORMAL_PATH_SEGMENT =
            Pattern.compile("[A-Za-z0-9._~!$&'()+,;=:@%-]+|\\*|\\*\\*");

    private final RouteGroupRepository routeGroupRepository;

    public RouteGroupService(RouteGroupRepository routeGroupRepository) {
        this.routeGroupRepository = routeGroupRepository;
    }

    @Transactional
    public List<RouteGroupResponseDto> findAllRouteGroups() {
        return routeGroupRepository.findAllByOrderByPriorityDescNameAsc()
                .stream()
                .map(RouteGroupResponseDto::from)
                .toList();
    }

    @Transactional
    public RouteGroupResponseDto createRouteGroup(RouteGroupRequestDto request) {
        if (request == null) {
            throw new InvalidRouteGroupException("Request body is required");
        }

        String name = validateName(request.name());
        if (routeGroupRepository.existsByNameIgnoreCase(name)) {
            throw new DuplicateRouteGroupException("Route group name already exists");
        }

        RouteGroup routeGroup = new RouteGroup();
        apply(routeGroup, request, name);

        return RouteGroupResponseDto.from(routeGroupRepository.save(routeGroup));
    }

    @Transactional
    public RouteGroupResponseDto updateRouteGroup(Long id, RouteGroupRequestDto request) {
        if (request == null) {
            throw new InvalidRouteGroupException("Request body is required");
        }

        RouteGroup routeGroup = routeGroupRepository.findById(id)
                .orElseThrow(() -> new RouteGroupNotFoundException("Route group not found with id: " + id));
        String name = validateName(request.name());
        routeGroupRepository.findByNameIgnoreCase(name)
                .filter(existing -> !id.equals(existing.getId()))
                .ifPresent(existing -> {
                    throw new DuplicateRouteGroupException("Route group name already exists");
                });

        apply(routeGroup, request, name);

        return RouteGroupResponseDto.from(routeGroupRepository.save(routeGroup));
    }

    @Transactional
    public void deleteRouteGroup(Long id) {
        RouteGroup routeGroup = routeGroupRepository.findById(id)
                .orElseThrow(() -> new RouteGroupNotFoundException("Route group not found with id: " + id));

        routeGroupRepository.delete(routeGroup);
    }

    private void apply(RouteGroup routeGroup, RouteGroupRequestDto request, String name) {
        routeGroup.setName(name);
        routeGroup.setDescription(normalizeOptionalText(request.description()));
        routeGroup.setActive(request.active() == null || request.active());
        routeGroup.setPriority(request.priority() == null ? 0 : request.priority());
        routeGroup.setRules(validateRules(request.rules()));
    }

    private String validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new InvalidRouteGroupException("Route group name is required");
        }

        return name.trim();
    }

    private List<RouteGroupRule> validateRules(List<RouteGroupRuleRequestDto> rules) {
        if (rules == null || rules.isEmpty()) {
            throw new InvalidRouteGroupException("At least one route group rule is required");
        }

        return rules.stream()
                .map(this::validateRule)
                .toList();
    }

    private RouteGroupRule validateRule(RouteGroupRuleRequestDto request) {
        if (request == null) {
            throw new InvalidRouteGroupException("Route group rule is required");
        }

        RouteGroupRule rule = new RouteGroupRule();
        rule.setMethod(validateMethod(request.method()));
        rule.setPattern(validatePattern(request.pattern(), request.matchType()));
        rule.setMatchType(request.matchType() == null ? RouteGroupMatchType.EXACT : request.matchType());
        return rule;
    }

    private String validateMethod(String method) {
        if (method == null || method.isBlank()) {
            return null;
        }

        String normalized = method.trim().toUpperCase(Locale.ROOT);
        if (!HTTP_METHOD.matcher(normalized).matches()) {
            throw new InvalidRouteGroupException("Route group method is invalid");
        }

        return normalized;
    }

    private String validatePattern(String pattern, RouteGroupMatchType matchType) {
        if (pattern == null || pattern.isBlank()) {
            throw new InvalidRouteGroupException("Route group pattern is required");
        }

        String normalized = pattern.trim();
        if (!normalized.startsWith("/")) {
            throw new InvalidRouteGroupException("Route group pattern must start with /");
        }
        if (normalized.length() == 1) {
            throw new InvalidRouteGroupException("Route group pattern must include at least one path segment");
        }
        if (normalized.contains("//")) {
            throw new InvalidRouteGroupException("Route group pattern must not contain empty path segments");
        }
        if (matchType == null) {
            throw new InvalidRouteGroupException("Route group match type is required");
        }

        String[] segments = normalized.substring(1).split("/");
        for (int i = 0; i < segments.length; i++) {
            String segment = segments[i];
            if ("**".equals(segment) && i != segments.length - 1) {
                throw new InvalidRouteGroupException("** wildcard may only appear at the end of a route group pattern");
            }
            if (segment.contains("*") && !"*".equals(segment) && !"**".equals(segment)) {
                throw new InvalidRouteGroupException("* wildcards must be whole path segments");
            }
            if (!NORMAL_PATH_SEGMENT.matcher(segment).matches()) {
                throw new InvalidRouteGroupException("Route group pattern contains unsupported path characters");
            }
        }

        return normalized;
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
