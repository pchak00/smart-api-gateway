export const getPlanLabel = (planName: string | null | undefined) => {
  if (!planName) return 'Unknown';

  const labels: Record<string, string> = {
    FREE: 'Free',
    PRO: 'Pro',
    ENTERPRISE: 'Enterprise'
  };

  return labels[planName] ?? planName;
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
