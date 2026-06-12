export const getPlanLabel = (planName: string | null | undefined) => {
  if (!planName) return 'Unknown';

  const labels: Record<string, string> = {
    FREE: 'Free',
    PRO: 'Pro',
    ENTERPRISE: 'Enterprise'
  };

  return labels[planName] ?? planName;
};
