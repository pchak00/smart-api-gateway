export type PasswordStrength = 'weak' | 'fair' | 'strong' | 'very-strong';

export interface PasswordPolicyResult {
  valid: boolean;
  strength: PasswordStrength;
  label: string;
  feedback: string;
  score: number;
}

const MIN_LENGTH = 12;
const MAX_LENGTH = 128;

const commonPasswords = new Set([
  'password',
  'password1',
  'password123',
  'admin',
  'admin123',
  'owner',
  'owner123',
  'pacific',
  'pacific123',
  'demo',
  'demo123',
  'changeme',
  'letmein',
  'qwerty',
  'qwerty123',
  '123456',
  '12345678',
  '123456789',
  'newstrongpassword123'
]);

const sequences = [
  '0123', '1234', '2345', '3456', '4567', '5678', '6789',
  'abcd', 'bcde', 'cdef', 'defg', 'qwer', 'wert', 'asdf', 'sdfg', 'zxcv'
];

const normalizeLettersAndDigits = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

const containsUsername = (username: string | null | undefined, password: string) => {
  if (!username?.trim()) return false;

  const normalizedPassword = normalizeLettersAndDigits(password);
  const normalizedUsername = normalizeLettersAndDigits(username);

  if (normalizedUsername.length >= 3 && normalizedPassword.includes(normalizedUsername)) {
    return true;
  }

  return username
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .some((part) => part.length >= 4 && normalizedPassword.includes(part));
};

const isCommonPassword = (password: string) => {
  const normalized = normalizeLettersAndDigits(password);
  const lower = password.toLowerCase().trim();

  return commonPasswords.has(normalized) ||
    commonPasswords.has(lower) ||
    /^(password|admin|owner|pacific|demo|qwerty|letmein|changeme)[0-9!@#$%^&*._-]*$/.test(normalized);
};

const containsSequence = (password: string) => {
  const normalized = normalizeLettersAndDigits(password);
  return sequences.some((sequence) => normalized.includes(sequence));
};

const scorePassword = (password: string) => {
  let score = Math.min(45, password.length * 2);
  const lowerPassword = password.toLowerCase();
  const uniqueChars = new Set(lowerPassword).size;
  const variety = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^\da-zA-Z\s]/.test(password),
    /\s/.test(password)
  ].filter(Boolean).length;

  score += variety * 8;
  score += Math.min(20, uniqueChars * 2);

  const words = password.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 3 && password.length >= 20) {
    score += 20;
  }

  if (/(.)\1{3,}/.test(lowerPassword)) {
    score -= 25;
  }
  if (containsSequence(lowerPassword)) {
    score -= 25;
  }
  if (uniqueChars <= 4) {
    score -= 20;
  }
  if (
    lowerPassword.includes('password') ||
    lowerPassword.includes('qwerty') ||
    lowerPassword.includes('letmein') ||
    lowerPassword.includes('changeme')
  ) {
    score -= 15;
  }

  return score;
};

const strengthFromScore = (score: number): Pick<PasswordPolicyResult, 'strength' | 'label'> => {
  if (score >= 90) return { strength: 'very-strong', label: 'Very strong' };
  if (score >= 70) return { strength: 'strong', label: 'Strong' };
  if (score >= 50) return { strength: 'fair', label: 'Fair' };
  return { strength: 'weak', label: 'Weak' };
};

const result = (
  valid: boolean,
  score: number,
  feedback: string
): PasswordPolicyResult => {
  const strength = strengthFromScore(score);
  return {
    valid,
    score,
    feedback,
    ...strength
  };
};

export const evaluateAdminPassword = (
  username: string | null | undefined,
  password: string
): PasswordPolicyResult => {
  if (!password) {
    return result(false, 0, 'Use at least 12 characters.');
  }

  if (!password.trim()) {
    return result(false, 0, 'Password is required.');
  }

  if (password !== password.trim()) {
    return result(false, 0, 'Do not start or end with spaces.');
  }

  if (password.length < MIN_LENGTH) {
    return result(false, Math.min(40, password.length * 2), 'Use at least 12 characters.');
  }

  if (password.length > MAX_LENGTH) {
    return result(false, 0, 'Use 128 characters or fewer.');
  }

  if (containsUsername(username, password)) {
    return result(false, 20, 'Avoid using the username.');
  }

  if (isCommonPassword(password)) {
    return result(false, 20, 'Avoid common passwords.');
  }

  const score = scorePassword(password);
  const strength = strengthFromScore(score);

  if (strength.strength === 'weak') {
    return result(false, score, 'Try a longer passphrase.');
  }

  if (strength.strength === 'fair') {
    return result(true, score, 'A longer passphrase would be stronger.');
  }

  return result(true, score, 'Password meets the admin policy.');
};
