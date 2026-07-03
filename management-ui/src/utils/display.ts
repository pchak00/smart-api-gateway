export const getPlanLabel = (planName: string | null | undefined) => {
  if (!planName) return 'Unknown';

  const normalized = planName.trim();
  const labels: Record<string, string> = {
    FREE: 'Free',
    PRO: 'Pro',
    ENTERPRISE: 'Enterprise'
  };

  if (labels[normalized]) return labels[normalized];

  const safeName = normalized.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  const shouldTitleCase = /^[A-Z0-9 _-]+$/.test(normalized);

  if (!shouldTitleCase) return safeName;

  return safeName
    .toLowerCase()
    .replace(/\b[a-z0-9]/g, (character) => character.toUpperCase());
};

export const getSeverityLabel = (severity: string | null | undefined) => {
  if (!severity) return 'Watch';

  const labels: Record<string, string> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High'
  };

  return labels[severity] ?? severity;
};

export const getStatusLabel = (status: string | null | undefined) => {
  if (!status) return 'Open';

  const normalized = status.trim();
  const labels: Record<string, string> = {
    OPEN: 'Open',
    ACKNOWLEDGED: 'Acknowledged',
    ACTIVE: 'Active',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed'
  };

  return labels[normalized] ?? normalized;
};

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const dateTimePattern = /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:/;
const explicitTimeZonePattern = /(?:Z|[+-]\d{2}:?\d{2})$/i;

const parseBrowserLocalCalendarDate = (value: string) => {
  const match = dateOnlyPattern.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

const parseServerTimestamp = (value: string | null | undefined) => {
  if (!value) return null;

  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const localCalendarDate = parseBrowserLocalCalendarDate(trimmedValue);
  if (localCalendarDate) return localCalendarDate;

  const normalizedValue = dateTimePattern.test(trimmedValue) && !explicitTimeZonePattern.test(trimmedValue)
    ? `${trimmedValue.replace(' ', 'T')}Z`
    : trimmedValue;
  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const getServerTimestampDate = (value: string | null | undefined) => parseServerTimestamp(value);

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) return 'Pending';

  const date = parseServerTimestamp(value);
  if (!date) return value;

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};

export const formatRelativeDateTime = (value: string | null | undefined) => {
  if (!value) return 'Never';

  const date = parseServerTimestamp(value);
  if (!date) return value;

  const now = new Date();
  const ageMs = now.getTime() - date.getTime();
  const ageDays = Math.floor(ageMs / 86_400_000);

  if (ageDays <= 0) return 'Today';
  if (ageDays === 1) return 'Yesterday';
  if (ageDays <= 90) return `${ageDays} days ago`;

  return formatShortDate(value);
};

export const formatShortDate = (value: string | null | undefined) => {
  if (!value) return 'No date';

  const date = parseServerTimestamp(value);
  if (!date) return value;

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const formatNumber = (value: number | null | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0';

  return new Intl.NumberFormat().format(value);
};

export const formatBucket = (value: string | null | undefined) => {
  return formatShortDate(value);
};
