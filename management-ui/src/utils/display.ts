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
    ACTIVE: 'Active',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed'
  };

  return labels[normalized] ?? normalized;
};

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) return 'Pending';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};
