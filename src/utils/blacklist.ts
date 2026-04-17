const BLOCKED_DOMAINS = [
  'malware.com',
  'phishing.com',
  'evil.com',
  'scam.net',
  'fake-bank.com',
  'login-fake.com',
];

export function isDomainBlocked(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return BLOCKED_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

export function getBlockedDomains(): string[] {
  return [...BLOCKED_DOMAINS];
}

export function addToBlacklist(domain: string): void {
  if (!BLOCKED_DOMAINS.includes(domain.toLowerCase())) {
    BLOCKED_DOMAINS.push(domain.toLowerCase());
  }
}

export { BLOCKED_DOMAINS };