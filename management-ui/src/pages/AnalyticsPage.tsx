import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowDown, ArrowUp, BarChart3, Minus, Route, Search, Users, X } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { api } from '../api/client';
import {
  ClientAnalyticsDto,
  RouteAnalyticsDto,
  RouteTrafficAnalyticsDto,
  TrafficAnalyticsDto
} from '../types';
import { EmptyState, PageHeader, Panel } from '../components/PageShell';
import { AppDropdown, DropdownOption } from '../components/AppDropdown';
import { InfoTooltip } from '../components/InfoTooltip';
import { formatBucket, formatNumber, getPlanLabel } from '../utils/display';
import { useToast } from '../hooks/useToast';

type RouteTrendMetric = 'totalRequests' | 'allowedRequests' | 'blockedRequests';
type RouteTrendDisplayMode = 'top5' | 'top10' | 'custom';
type NumericAnalyticsSortField = 'totalRequests' | 'allowedRequests' | 'blockedRequests' | 'blockRate';
type RouteAnalyticsSortField = NumericAnalyticsSortField | 'name';
type ClientAnalyticsSortField = NumericAnalyticsSortField | 'name' | 'planName';
type AnalyticsSortField = RouteAnalyticsSortField | ClientAnalyticsSortField;
type AnalyticsSortDirection = 'asc' | 'desc';

interface AnalyticsSortSelection {
  field: AnalyticsSortField;
  direction: AnalyticsSortDirection;
}

type RouteTrendChartPoint = {
  bucketLabel: string;
  [key: string]: string | number;
};

type RouteTrendRouteTotals = {
  route: string;
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
};

type RouteTrendRoute = {
  key: string;
  route: string;
  color: string;
  strokeDasharray?: string;
  strokeWidth: number;
  opacity: number;
};

const safeCount = (value: number | null | undefined) => (
  typeof value === 'number' && !Number.isNaN(value) ? value : 0
);

const safePositiveCount = (value: number | null | undefined) => Math.max(safeCount(value), 0);

const getBlockRate = (totalRequests: number | null | undefined, blockedRequests: number | null | undefined) => {
  const total = safeCount(totalRequests);
  if (total <= 0) return 0;

  return safeCount(blockedRequests) / total;
};

const getRouteName = (route: string | null | undefined) => {
  const routeName = route?.trim();
  return routeName || 'Unknown route';
};

const getClientName = (client: ClientAnalyticsDto, index: number) => (
  client.clientName || `Client #${client.clientId ?? index + 1}`
);

const routeTrendMetricOptions: Array<{ key: RouteTrendMetric; label: string }> = [
  { key: 'totalRequests', label: 'Total' },
  { key: 'allowedRequests', label: 'Allowed' },
  { key: 'blockedRequests', label: 'Blocked' }
];

const routeTrendDisplayOptions: Array<{ key: RouteTrendDisplayMode; label: string }> = [
  { key: 'top5', label: 'Top 5' },
  { key: 'top10', label: 'Top 10' },
  { key: 'custom', label: 'Custom' }
];

const routeAnalyticsSortDropdownOptions: DropdownOption[] = [
  { value: 'totalRequests', label: 'Total requests' },
  { value: 'allowedRequests', label: 'Allowed requests' },
  { value: 'blockedRequests', label: 'Blocked requests' },
  { value: 'blockRate', label: 'Block rate' },
  { value: 'name', label: 'Name' }
];

const clientAnalyticsSortDropdownOptions: DropdownOption[] = [
  { value: 'totalRequests', label: 'Total requests' },
  { value: 'allowedRequests', label: 'Allowed requests' },
  { value: 'blockedRequests', label: 'Blocked requests' },
  { value: 'blockRate', label: 'Block rate' },
  { value: 'name', label: 'Client name' },
  { value: 'planName', label: 'Plan name' }
];

const getTopRouteLimit = (mode: RouteTrendDisplayMode) => (
  mode === 'top10' ? 10 : 5
);

const routeTrendColors = [
  '#93c5fd',
  '#67e8f9',
  '#5eead4',
  '#818cf8',
  '#94a3b8',
  '#38bdf8',
  '#2dd4bf',
  '#60a5fa',
  '#a5b4fc',
  '#cbd5e1'
];

const routeTrendLineStyles: Array<Pick<RouteTrendRoute, 'strokeDasharray' | 'strokeWidth' | 'opacity'>> = [
  { strokeWidth: 2.6, opacity: 1 },
  { strokeWidth: 2.1, opacity: 0.95 },
  { strokeWidth: 2, strokeDasharray: '6 4', opacity: 0.9 },
  { strokeWidth: 2, strokeDasharray: '2 4', opacity: 0.88 },
  { strokeWidth: 2, opacity: 0.72 },
  { strokeWidth: 1.8, strokeDasharray: '10 5', opacity: 0.78 },
  { strokeWidth: 1.8, strokeDasharray: '4 5', opacity: 0.76 },
  { strokeWidth: 1.8, strokeDasharray: '1 5', opacity: 0.74 },
  { strokeWidth: 1.7, opacity: 0.7 },
  { strokeWidth: 1.7, strokeDasharray: '7 6', opacity: 0.68 }
];

const getRouteTrendStyle = (index: number) => routeTrendLineStyles[index % routeTrendLineStyles.length];

const formatBlockRate = (totalRequests: number | null | undefined, blockedRequests: number | null | undefined) => (
  `${(getBlockRate(totalRequests, blockedRequests) * 100).toFixed(1)}%`
);

const getAnalyticsWindowLabel = (buckets: Array<string | undefined>) => {
  const sortedBuckets = [...new Set(buckets.filter((bucket): bucket is string => Boolean(bucket)))]
    .sort((first, second) => first.localeCompare(second));

  if (sortedBuckets.length === 0) return 'Current analytics window';
  if (sortedBuckets.length === 1) return formatBucket(sortedBuckets[0]);

  return `${formatBucket(sortedBuckets[0])} - ${formatBucket(sortedBuckets[sortedBuckets.length - 1])}`;
};

type TrendDirection = 'up' | 'down' | 'flat' | 'none';
type TrendTone = 'traffic' | 'neutral';

interface TrendDelta {
  direction: TrendDirection;
  valueLabel: string;
}

interface SummaryTrend {
  points: TrafficAnalyticsDto[];
  totalRequests: number;
  totalAllowed: number;
  totalBlocked: number;
  requestDelta: TrendDelta;
  allowedDelta: TrendDelta;
  blockedDelta: TrendDelta;
}

const noComparisonDelta: TrendDelta = {
  direction: 'none',
  valueLabel: 'No comparison yet'
};

const formatTrendPercent = (value: number) => {
  const absolute = Math.abs(value);
  const formatted = absolute >= 10
    ? Math.round(absolute).toString()
    : absolute.toFixed(1).replace(/\.0$/, '');

  return `${formatted}%`;
};

const getCountDelta = (current: number | null | undefined, previous: number | null | undefined): TrendDelta => {
  if (typeof previous !== 'number') return noComparisonDelta;

  const currentValue = safePositiveCount(current);
  const previousValue = safePositiveCount(previous);

  if (currentValue === 0 && previousValue === 0) {
    return { direction: 'flat', valueLabel: 'No change' };
  }

  if (previousValue === 0) {
    return { direction: 'none', valueLabel: 'New activity' };
  }

  const delta = ((currentValue - previousValue) / previousValue) * 100;

  if (delta === 0) {
    return { direction: 'flat', valueLabel: '0%' };
  }

  return {
    direction: delta > 0 ? 'up' : 'down',
    valueLabel: formatTrendPercent(delta)
  };
};

const sortedTrafficBuckets = (traffic: TrafficAnalyticsDto[]) => {
  const buckets = new Map<string, TrafficAnalyticsDto>();

  traffic.forEach((point) => {
    if (!point.bucket) return;

    const existing = buckets.get(point.bucket) ?? {
      bucket: point.bucket,
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0
    };

    buckets.set(point.bucket, {
      bucket: point.bucket,
      totalRequests: safePositiveCount(existing.totalRequests) + safePositiveCount(point.totalRequests),
      allowedRequests: safePositiveCount(existing.allowedRequests) + safePositiveCount(point.allowedRequests),
      blockedRequests: safePositiveCount(existing.blockedRequests) + safePositiveCount(point.blockedRequests)
    });
  });

  return [...buckets.values()]
    .sort((first, second) => String(first.bucket).localeCompare(String(second.bucket)));
};

const getSummaryTrend = (traffic: TrafficAnalyticsDto[]): SummaryTrend => {
  const points = sortedTrafficBuckets(traffic);
  const currentBucket = points.length >= 2 ? points[points.length - 1] : null;
  const previousBucket = points.length >= 2 ? points[points.length - 2] : null;

  return {
    points,
    totalRequests: points.reduce((sum, point) => sum + safePositiveCount(point.totalRequests), 0),
    totalAllowed: points.reduce((sum, point) => sum + safePositiveCount(point.allowedRequests), 0),
    totalBlocked: points.reduce((sum, point) => sum + safePositiveCount(point.blockedRequests), 0),
    requestDelta: getCountDelta(currentBucket?.totalRequests, previousBucket?.totalRequests),
    allowedDelta: getCountDelta(currentBucket?.allowedRequests, previousBucket?.allowedRequests),
    blockedDelta: getCountDelta(currentBucket?.blockedRequests, previousBucket?.blockedRequests)
  };
};

const trendToneClass: Record<TrendTone, Record<TrendDirection, string>> = {
  traffic: {
    up: 'text-emerald-300/85',
    down: 'text-red-300/80',
    flat: 'text-slate-400',
    none: 'text-slate-500'
  },
  neutral: {
    up: 'text-slate-400',
    down: 'text-slate-400',
    flat: 'text-slate-400',
    none: 'text-slate-500'
  }
};

const trendIcon: Partial<Record<TrendDirection, React.ElementType>> = {
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus
};

const TrendIndicator: React.FC<{ delta: TrendDelta; tone?: TrendTone }> = ({
  delta,
  tone = 'neutral'
}) => {
  const Icon = trendIcon[delta.direction];

  return (
    <span className={`inline-flex min-w-0 max-w-full items-center gap-1 text-xs font-medium ${trendToneClass[tone][delta.direction]}`}>
      {Icon && <Icon size={12} strokeWidth={2.2} aria-hidden="true" />}
      <span className="truncate">{delta.valueLabel}</span>
    </span>
  );
};

const getRouteTrendCountLabel = (
  mode: RouteTrendDisplayMode,
  visibleCount: number,
  totalCount: number
) => {
  if (mode === 'custom') {
    return `Comparing ${visibleCount} ${visibleCount === 1 ? 'route' : 'routes'}`;
  }

  const limit = getTopRouteLimit(mode);
  if (totalCount <= limit) return `Showing ${visibleCount} of ${totalCount} routes`;

  return `Showing top ${limit} routes`;
};

const compareMetric = (first: number, second: number, direction: AnalyticsSortDirection) => {
  const difference = direction === 'desc' ? second - first : first - second;
  return difference === 0 ? 0 : difference;
};

const compareText = (
  first: string | null | undefined,
  second: string | null | undefined,
  direction: AnalyticsSortDirection
) => {
  const firstText = first?.trim() ?? '';
  const secondText = second?.trim() ?? '';
  const isFirstMissing = firstText.length === 0;
  const isSecondMissing = secondText.length === 0;

  if (isFirstMissing && isSecondMissing) return 0;
  if (isFirstMissing) return 1;
  if (isSecondMissing) return -1;

  return direction === 'asc'
    ? firstText.localeCompare(secondText)
    : secondText.localeCompare(firstText);
};

const getRouteMetricSortValue = (route: RouteAnalyticsDto, field: NumericAnalyticsSortField) => (
  field === 'blockRate'
    ? getBlockRate(route.totalRequests, route.blockedRequests)
    : safeCount(route[field])
);

const getClientMetricSortValue = (client: ClientAnalyticsDto, field: NumericAnalyticsSortField) => (
  field === 'blockRate'
    ? getBlockRate(client.totalRequests, client.blockedRequests)
    : safeCount(client[field])
);

const getClientSortName = (client: ClientAnalyticsDto) => {
  const clientName = client.clientName?.trim();
  if (clientName) return clientName;

  return client.clientId === undefined ? '' : `Client #${client.clientId}`;
};

const isTextSortField = (field: AnalyticsSortField) => field === 'name' || field === 'planName';

const getSortDirectionLabel = (field: AnalyticsSortField, direction: AnalyticsSortDirection) => {
  if (isTextSortField(field)) {
    return direction === 'asc' ? 'Sort A to Z' : 'Sort Z to A';
  }

  return direction === 'desc' ? 'Sort high to low' : 'Sort low to high';
};

const sortRouteAnalytics = (routes: RouteAnalyticsDto[], sort: AnalyticsSortSelection) => (
  [...routes].sort((first, second) => {
    const { field, direction } = sort;

    if (field === 'name') {
      return compareText(first.route, second.route, direction);
    }

    const metricDifference = compareMetric(
      getRouteMetricSortValue(first, field as NumericAnalyticsSortField),
      getRouteMetricSortValue(second, field as NumericAnalyticsSortField),
      direction
    );

    return metricDifference || compareText(first.route, second.route, 'asc');
  })
);

const sortClientAnalytics = (clients: ClientAnalyticsDto[], sort: AnalyticsSortSelection) => (
  [...clients].sort((first, second) => {
    const { field, direction } = sort;

    if (field === 'name') {
      return compareText(getClientSortName(first), getClientSortName(second), direction);
    }

    if (field === 'planName') {
      return compareText(
        first.planName ? getPlanLabel(first.planName) : '',
        second.planName ? getPlanLabel(second.planName) : '',
        direction
      )
        || compareText(getClientSortName(first), getClientSortName(second), 'asc');
    }

    const metricDifference = compareMetric(
      getClientMetricSortValue(first, field),
      getClientMetricSortValue(second, field),
      direction
    );

    return metricDifference || compareText(getClientSortName(first), getClientSortName(second), 'asc');
  })
);

interface SortDirectionButtonProps {
  field: AnalyticsSortField;
  direction: AnalyticsSortDirection;
  onToggle: () => void;
}

const SortDirectionButton: React.FC<SortDirectionButtonProps> = ({ field, direction, onToggle }) => {
  const Icon = direction === 'desc' ? ArrowDown : ArrowUp;
  const label = getSortDirectionLabel(field, direction);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-900/35 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
    >
      <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
};

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [routeAnalytics, setRouteAnalytics] = useState<RouteAnalyticsDto[]>([]);
  const [routeTrafficAnalytics, setRouteTrafficAnalytics] = useState<RouteTrafficAnalyticsDto[]>([]);
  const [clientAnalytics, setClientAnalytics] = useState<ClientAnalyticsDto[]>([]);
  const [trafficAnalytics, setTrafficAnalytics] = useState<TrafficAnalyticsDto[]>([]);
  const [selectedRouteMetric, setSelectedRouteMetric] = useState<RouteTrendMetric>('totalRequests');
  const [routeTrendMode, setRouteTrendMode] = useState<RouteTrendDisplayMode>('top5');
  const [routeAnalyticsSortField, setRouteAnalyticsSortField] = useState<RouteAnalyticsSortField>('totalRequests');
  const [routeAnalyticsSortDirection, setRouteAnalyticsSortDirection] = useState<AnalyticsSortDirection>('desc');
  const [clientAnalyticsSortField, setClientAnalyticsSortField] = useState<ClientAnalyticsSortField>('totalRequests');
  const [clientAnalyticsSortDirection, setClientAnalyticsSortDirection] = useState<AnalyticsSortDirection>('desc');
  const [clientPlanFilter, setClientPlanFilter] = useState('');
  const [routeSearch, setRouteSearch] = useState('');
  const [selectedCustomRoutes, setSelectedCustomRoutes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);

      try {
        const [routes, routeTraffic, clients, traffic] = await Promise.all([
          api.getRouteAnalytics(),
          api.getRouteTrafficAnalytics(),
          api.getClientAnalytics(),
          api.getTrafficAnalytics()
        ]);

        setRouteAnalytics(Array.isArray(routes) ? routes : []);
        setRouteTrafficAnalytics(Array.isArray(routeTraffic) ? routeTraffic : []);
        setClientAnalytics(Array.isArray(clients) ? clients : []);
        setTrafficAnalytics(Array.isArray(traffic) ? traffic : []);
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to load analytics:', error);
        setRouteAnalytics([]);
        setRouteTrafficAnalytics([]);
        setClientAnalytics([]);
        setTrafficAnalytics([]);
        setErrorMessage('Backend analytics are unavailable right now.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const routeTrendRouteOptions = useMemo<RouteTrendRouteTotals[]>(() => {
    const totals = new Map<string, RouteTrendRouteTotals>();

    routeTrafficAnalytics.forEach((point) => {
      const route = getRouteName(point.route);
      const current = totals.get(route) ?? {
        route,
        totalRequests: 0,
        allowedRequests: 0,
        blockedRequests: 0
      };

      totals.set(route, {
        route,
        totalRequests: current.totalRequests + safeCount(point.totalRequests),
        allowedRequests: current.allowedRequests + safeCount(point.allowedRequests),
        blockedRequests: current.blockedRequests + safeCount(point.blockedRequests)
      });
    });

    return [...totals.values()]
      .sort((first, second) => {
        const totalDifference = second.totalRequests - first.totalRequests;
        if (totalDifference !== 0) return totalDifference;

        return first.route.localeCompare(second.route);
      });
  }, [routeTrafficAnalytics]);

  const routeTrendRoutes = useMemo<RouteTrendRoute[]>(() => {
    const routeOptionByName = new Map(routeTrendRouteOptions.map((option) => [option.route, option]));
    const routeNames = routeTrendMode === 'custom'
      ? selectedCustomRoutes.filter((route) => routeOptionByName.has(route))
      : [...routeTrendRouteOptions]
          .sort((first, second) => {
            const selectedDifference = second[selectedRouteMetric] - first[selectedRouteMetric];
            if (selectedDifference !== 0) return selectedDifference;

            const totalDifference = second.totalRequests - first.totalRequests;
            if (totalDifference !== 0) return totalDifference;

            return first.route.localeCompare(second.route);
          })
          .slice(0, getTopRouteLimit(routeTrendMode))
          .map((option) => option.route);

    return routeNames.map((route, index) => ({
      key: `route_${index}`,
      route,
      color: routeTrendColors[index % routeTrendColors.length],
      ...getRouteTrendStyle(index)
    }));
  }, [routeTrendMode, routeTrendRouteOptions, selectedCustomRoutes, selectedRouteMetric]);

  const routeTrendRouteCount = routeTrendRouteOptions.length;
  const analyticsWindowLabel = useMemo(() => getAnalyticsWindowLabel([
    ...trafficAnalytics.map((point) => point.bucket),
    ...routeTrafficAnalytics.map((point) => point.bucket)
  ]), [routeTrafficAnalytics, trafficAnalytics]);

  const routeSearchResults = useMemo(() => {
    const query = routeSearch.trim().toLowerCase();
    if (!query) return routeTrendRouteOptions.slice(0, 6);

    return routeTrendRouteOptions
      .filter((option) => option.route.toLowerCase().includes(query))
      .slice(0, 6);
  }, [routeSearch, routeTrendRouteOptions]);

  const handleSelectCustomRoute = (route: string) => {
    if (selectedCustomRoutes.includes(route)) return;

    if (selectedCustomRoutes.length >= 5) {
      showToast({ message: 'Compare up to 5 routes at a time.', type: 'error' });
      return;
    }

    setSelectedCustomRoutes((routes) => [...routes, route]);
    setRouteSearch('');
  };

  const handleRemoveCustomRoute = (route: string) => {
    setSelectedCustomRoutes((routes) => routes.filter((selectedRoute) => selectedRoute !== route));
  };

  const routeTrendData = useMemo<RouteTrendChartPoint[]>(() => {
    const buckets = new Map<string, RouteTrendChartPoint>();
    const routeKeyByName = new Map(routeTrendRoutes.map((route) => [route.route, route.key]));

    routeTrafficAnalytics.forEach((point) => {
      const bucket = point.bucket ?? 'Unknown date';
      const route = getRouteName(point.route);
      const routeKey = routeKeyByName.get(route);

      if (!routeKey) return;

      const existing = buckets.get(bucket) ?? {
        bucket,
        bucketLabel: formatBucket(bucket)
      };

      existing[routeKey] = safeCount(typeof existing[routeKey] === 'number' ? existing[routeKey] : undefined) +
        safeCount(point[selectedRouteMetric]);
      buckets.set(bucket, existing);
    });

    return [...buckets.entries()]
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([, point]) => {
        routeTrendRoutes.forEach((route) => {
          if (typeof point[route.key] !== 'number') {
            point[route.key] = 0;
          }
        });

        return point;
      });
  }, [routeTrafficAnalytics, routeTrendRoutes, selectedRouteMetric]);

  const summaryTrend = useMemo(() => getSummaryTrend(trafficAnalytics), [trafficAnalytics]);
  const routeAnalyticsSort = useMemo<AnalyticsSortSelection>(() => ({
    field: routeAnalyticsSortField,
    direction: routeAnalyticsSortDirection
  }), [routeAnalyticsSortDirection, routeAnalyticsSortField]);
  const sortedRouteAnalytics = useMemo(
    () => sortRouteAnalytics(routeAnalytics, routeAnalyticsSort),
    [routeAnalytics, routeAnalyticsSort]
  );
  const clientPlanFilterOptions = useMemo<DropdownOption[]>(() => {
    const optionsByPlanName = new Map<string, DropdownOption>();

    clientAnalytics.forEach((client) => {
      const planName = client.planName?.trim();
      if (!planName || optionsByPlanName.has(planName)) return;

      optionsByPlanName.set(planName, {
        value: planName,
        label: getPlanLabel(planName)
      });
    });

    return [
      { value: '', label: 'All plans' },
      ...[...optionsByPlanName.values()].sort((first, second) => first.label.localeCompare(second.label))
    ];
  }, [clientAnalytics]);
  const filteredClientAnalytics = useMemo(() => (
    clientPlanFilter
      ? clientAnalytics.filter((client) => client.planName?.trim() === clientPlanFilter)
      : clientAnalytics
  ), [clientAnalytics, clientPlanFilter]);
  const clientAnalyticsSort = useMemo<AnalyticsSortSelection>(() => ({
    field: clientAnalyticsSortField,
    direction: clientAnalyticsSortDirection
  }), [clientAnalyticsSortDirection, clientAnalyticsSortField]);
  const sortedClientAnalytics = useMemo(
    () => sortClientAnalytics(filteredClientAnalytics, clientAnalyticsSort),
    [clientAnalyticsSort, filteredClientAnalytics]
  );
  const selectedClientPlanLabel = clientPlanFilterOptions.find((option) => option.value === clientPlanFilter)?.label ?? 'All';
  const routeSearchPlaceholder = selectedCustomRoutes.length >= 5
    ? 'Remove a route to add another'
    : selectedCustomRoutes.length > 0
      ? 'Add another route...'
      : 'Search routes...';
  const hasClientRowsForPlanFilter = clientAnalytics.length > 0 && sortedClientAnalytics.length === 0;
  const toggleRouteAnalyticsSortDirection = () => {
    setRouteAnalyticsSortDirection((direction) => direction === 'desc' ? 'asc' : 'desc');
  };
  const toggleClientAnalyticsSortDirection = () => {
    setClientAnalyticsSortDirection((direction) => direction === 'desc' ? 'asc' : 'desc');
  };
  const openClientDetail = (client: ClientAnalyticsDto) => {
    if (typeof client.clientId !== 'number') return;
    navigate(`/clients/${client.clientId}`);
  };
  const shouldIgnoreRowNavigation = (target: EventTarget | null) => (
    target instanceof HTMLElement &&
    Boolean(target.closest('button, a, input, select, textarea, [role="menu"], [role="listbox"]'))
  );

  return (
    <div className="min-w-0">
      <PageHeader
        title="Analytics"
        meta={errorMessage ? <span className="text-xs text-slate-500">{errorMessage}</span> : undefined}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_16rem]">
        <Panel className="p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-100">Route trends</h2>
              <p className="mt-1 text-xs text-slate-400">{analyticsWindowLabel}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1">
                {routeTrendMetricOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedRouteMetric(option.key)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/20 ${
                      selectedRouteMetric === option.key
                        ? 'bg-slate-800/45 text-slate-100'
                        : 'text-slate-400 hover:bg-slate-900/35 hover:text-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {routeTrendDisplayOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setRouteTrendMode(option.key)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/20 ${
                      routeTrendMode === option.key
                        ? 'bg-slate-800/45 text-slate-100'
                        : 'text-slate-400 hover:bg-slate-900/35 hover:text-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <BarChart3 className="text-slate-600" size={20} aria-hidden="true" />
            </div>
          </div>

          {routeTrendMode === 'custom' && !isLoading && !errorMessage && routeTrendRouteCount > 0 && (
            <div className="mb-5 space-y-3">
              <div className="relative max-w-xl">
                <div className="flex items-center border-b border-slate-800/70 bg-transparent transition-colors hover:border-slate-700/90 focus-within:border-cyan-400/70 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cyan-400/25">
                  <Search className="mr-2 shrink-0 text-slate-700" size={15} aria-hidden="true" />
                  <input
                    type="search"
                    value={routeSearch}
                    onChange={(event) => setRouteSearch(event.target.value)}
                    placeholder={routeSearchPlaceholder}
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-100 outline-none placeholder:text-slate-700"
                  />
                  {routeSearch.trim() && (
                    <button
                      type="button"
                      onClick={() => setRouteSearch('')}
                      className="ml-2 shrink-0 text-xs font-medium text-slate-600 transition-colors hover:text-slate-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {routeSearch.trim() && (
                  <div className="absolute left-0 right-0 top-11 z-20 overflow-hidden rounded-md border border-slate-800/80 bg-slate-950/95 shadow-xl shadow-black/20">
                    {routeSearchResults.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-slate-500">No routes match this search.</p>
                    ) : (
                      <div className="max-h-56 overflow-y-auto py-1">
                        {routeSearchResults.map((option) => {
                          const isSelected = selectedCustomRoutes.includes(option.route);

                          return (
                            <button
                              key={option.route}
                              type="button"
                              onClick={() => handleSelectCustomRoute(option.route)}
                              className="flex w-full min-w-0 items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-900/70"
                            >
                              <span className="min-w-0 truncate font-mono text-xs text-slate-300" title={option.route}>
                                {option.route}
                              </span>
                              <span className="shrink-0 text-xs text-slate-600">
                                {isSelected ? 'Selected' : `${formatNumber(option.totalRequests)} total`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedCustomRoutes.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedCustomRoutes.map((route) => (
                    <span
                      key={route}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-slate-950/65 px-2 py-1 text-xs text-slate-400 ring-1 ring-slate-800/70"
                    >
                      <span className="max-w-56 truncate font-mono" title={route}>{route}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomRoute(route)}
                        className="text-slate-600 transition-colors hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-700/40"
                        aria-label={`Remove ${route}`}
                      >
                        <X size={13} aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedCustomRoutes([])}
                    className="text-xs font-medium text-slate-600 transition-colors hover:text-slate-300"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex h-72 items-center justify-center text-sm text-slate-500">
              Loading route trends...
            </div>
          ) : errorMessage ? (
            <EmptyState
              icon={Route}
              title="Route trends unavailable"
              description={errorMessage}
            />
          ) : routeTrendRouteCount === 0 ? (
            <EmptyState
              icon={Route}
              title="No route trend data yet"
              description="Send requests through the gateway to populate this chart."
            />
          ) : routeTrendMode === 'custom' && routeTrendRoutes.length === 0 ? (
            <EmptyState
              icon={Route}
              title="Select routes to compare"
              description="Search and select routes to compare trends."
            />
          ) : routeTrendData.length === 0 ? (
            <EmptyState
              icon={Route}
              title="No route trend data yet"
              description="Send requests through the gateway to populate this chart."
            />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={routeTrendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeOpacity={0.55} vertical={false} />
                  <XAxis dataKey="bucketLabel" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#020617',
                      border: '1px solid #1e293b',
                      borderRadius: 8,
                      boxShadow: '0 18px 45px rgba(2, 6, 23, 0.32)',
                      color: '#e2e8f0'
                    }}
                    itemStyle={{ color: '#cbd5e1', fontSize: 12 }}
                    labelStyle={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}
                    labelFormatter={(label) => `Bucket: ${String(label)}`}
                    formatter={(value, name) => [
                      formatNumber(typeof value === 'number' ? value : Number(value)),
                      routeTrendRoutes.find((route) => route.key === name)?.route ?? String(name)
                    ]}
                  />
                  {routeTrendRoutes.map((route) => (
                    <Line
                      key={route.key}
                      type="monotone"
                      dataKey={route.key}
                      name={route.route}
                      stroke={route.color}
                      strokeDasharray={route.strokeDasharray}
                      strokeOpacity={route.opacity}
                      strokeWidth={route.strokeWidth}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {!isLoading && !errorMessage && routeTrendRoutes.length > 0 && (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-xs text-slate-400">
                {getRouteTrendCountLabel(routeTrendMode, routeTrendRoutes.length, routeTrendRouteCount)}
              </p>
              <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
                {routeTrendRoutes.map((route) => (
                  <div key={route.key} className="flex min-w-0 items-center gap-2 text-xs text-slate-300">
                    <svg className="h-2 w-5 shrink-0 overflow-visible" viewBox="0 0 20 8" aria-hidden="true">
                      <line
                        x1="1"
                        y1="4"
                        x2="19"
                        y2="4"
                        stroke={route.color}
                        strokeDasharray={route.strokeDasharray}
                        strokeLinecap="round"
                        strokeOpacity={route.opacity}
                        strokeWidth={route.strokeWidth}
                      />
                    </svg>
                    <span className="min-w-0 truncate font-mono" title={route.route}>{route.route}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Summary</h2>
            <div className="flex items-center gap-2">
              <InfoTooltip label="Analytics summary trend details" align="right">
                Trend compares the latest analytics bucket with the previous bucket.
              </InfoTooltip>
              <Activity className="text-slate-600" size={18} aria-hidden="true" />
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="pb-4">
              <p className="text-sm text-slate-400">Requests</p>
              <div className="mt-2 flex min-w-0 items-baseline gap-2">
                <p className="truncate text-3xl font-semibold text-slate-50">{isLoading ? '...' : formatNumber(summaryTrend.totalRequests)}</p>
                {!isLoading && <TrendIndicator delta={summaryTrend.requestDelta} tone="traffic" />}
              </div>
            </div>
            <div className="py-2">
              <p className="text-sm text-slate-400">Allowed</p>
              <div className="mt-2 flex min-w-0 items-baseline gap-2">
                <p className="truncate text-3xl font-semibold text-slate-50">{isLoading ? '...' : formatNumber(summaryTrend.totalAllowed)}</p>
                {!isLoading && <TrendIndicator delta={summaryTrend.allowedDelta} tone="traffic" />}
              </div>
            </div>
            <div className="py-2">
              <p className="text-sm text-slate-400">Blocked</p>
              <div className="mt-2 flex min-w-0 items-baseline gap-2">
                <p className="truncate text-3xl font-semibold text-slate-100">{isLoading ? '...' : formatNumber(summaryTrend.totalBlocked)}</p>
                {!isLoading && <TrendIndicator delta={summaryTrend.blockedDelta} tone="neutral" />}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel className="p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Routes</h2>
            </div>
            <div className="flex items-center gap-3">
              <AppDropdown
                value={routeAnalyticsSortField}
                onChange={(value) => setRouteAnalyticsSortField(value as RouteAnalyticsSortField)}
                options={routeAnalyticsSortDropdownOptions}
                ariaLabel="Sort route analytics"
                fullWidth={false}
                align="right"
                displayValue="Sort"
                buttonClassName="h-8 px-0 text-xs text-slate-400"
                menuClassName="w-44"
              />
              <SortDirectionButton
                field={routeAnalyticsSortField}
                direction={routeAnalyticsSortDirection}
                onToggle={toggleRouteAnalyticsSortDirection}
              />
              <Route className="text-slate-600" size={18} aria-hidden="true" />
            </div>
          </div>

          {isLoading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">Loading route analytics...</div>
          ) : errorMessage ? (
            <EmptyState icon={Route} title="Route analytics unavailable" description={errorMessage} />
          ) : routeAnalytics.length === 0 ? (
            <EmptyState
              icon={Route}
              title="No route traffic recorded yet"
              description="Send requests through the gateway to populate route analytics."
            />
          ) : (
            <div className="max-h-[400px] overflow-auto">
              <table className="w-full min-w-[640px]">
                <thead className="border-b border-slate-800/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Route</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Allowed</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Blocked</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Block rate</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRouteAnalytics.map((route, index) => (
                    <tr key={route.route ?? index} className="transition-colors hover:bg-slate-900/25">
                      <td className="px-4 py-4 font-mono text-xs text-slate-300">{route.route ?? 'Unknown route'}</td>
                      <td className="px-4 py-4 text-right text-sm text-slate-300">{formatNumber(route.totalRequests)}</td>
                      <td className="px-4 py-4 text-right text-sm text-slate-400">{formatNumber(route.allowedRequests)}</td>
                      <td className="px-4 py-4 text-right text-sm text-slate-300">{formatNumber(route.blockedRequests)}</td>
                      <td className="px-4 py-4 text-right text-sm text-slate-300">
                        {formatBlockRate(route.totalRequests, route.blockedRequests)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel className="p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Clients</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AppDropdown
                value={clientPlanFilter}
                onChange={setClientPlanFilter}
                options={clientPlanFilterOptions}
                ariaLabel="Filter client analytics by plan"
                fullWidth={false}
                align="right"
                displayValue={`Plan: ${clientPlanFilter ? selectedClientPlanLabel : 'All'}`}
                buttonClassName="h-8 min-w-28 px-0 text-xs text-slate-400"
                menuClassName="w-44"
              />
              <AppDropdown
                value={clientAnalyticsSortField}
                onChange={(value) => setClientAnalyticsSortField(value as ClientAnalyticsSortField)}
                options={clientAnalyticsSortDropdownOptions}
                ariaLabel="Sort client analytics"
                fullWidth={false}
                align="right"
                displayValue="Sort"
                buttonClassName="h-8 px-0 text-xs text-slate-400"
                menuClassName="w-44"
              />
              <SortDirectionButton
                field={clientAnalyticsSortField}
                direction={clientAnalyticsSortDirection}
                onToggle={toggleClientAnalyticsSortDirection}
              />
              <Users className="text-slate-600" size={18} aria-hidden="true" />
            </div>
          </div>

          {isLoading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">Loading client analytics...</div>
          ) : errorMessage ? (
            <EmptyState icon={Users} title="Client analytics unavailable" description={errorMessage} />
          ) : clientAnalytics.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No client analytics recorded yet"
              description="Client usage will appear here after gateway requests are logged."
            />
          ) : hasClientRowsForPlanFilter ? (
            <EmptyState
              icon={Users}
              title="No clients match this plan"
              description="Choose another plan or return to All plans."
            />
          ) : (
            <div className="max-h-[400px] overflow-auto">
              <table className="w-full min-w-[720px]">
                <thead className="border-b border-slate-800/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Client</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Allowed</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Blocked</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Block rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClientAnalytics.map((client, index) => {
                    const hasClientId = typeof client.clientId === 'number';
                    const clientName = getClientName(client, index);

                    return (
                      <tr
                        key={client.clientId ?? index}
                        role={hasClientId ? 'link' : undefined}
                        tabIndex={hasClientId ? 0 : undefined}
                        aria-label={hasClientId ? `Open ${clientName}` : undefined}
                        onClick={(event) => {
                          if (shouldIgnoreRowNavigation(event.target)) return;
                          openClientDetail(client);
                        }}
                        onKeyDown={(event) => {
                          if (!hasClientId || shouldIgnoreRowNavigation(event.target)) return;
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openClientDetail(client);
                          }
                        }}
                        className={`transition-colors hover:bg-slate-900/25 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-700/40 ${
                          hasClientId ? 'group cursor-pointer' : ''
                        }`}
                      >
                        <td className="px-4 py-4 text-sm font-medium text-slate-100">
                          <span className={hasClientId ? 'transition-colors group-hover:text-slate-50' : undefined}>
                            {clientName}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-slate-300">{formatNumber(client.totalRequests)}</td>
                        <td className="px-4 py-4 text-right text-sm text-slate-400">{formatNumber(client.allowedRequests)}</td>
                        <td className="px-4 py-4 text-right text-sm text-slate-300">{formatNumber(client.blockedRequests)}</td>
                        <td className="px-4 py-4 text-right text-sm text-slate-300">
                          {formatBlockRate(client.totalRequests, client.blockedRequests)}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-300">{getPlanLabel(client.planName)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};
