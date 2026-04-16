export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export function buildUTMUrl(baseUrl: string, params: UTMParams): string {
  const url = new URL(baseUrl);
  if (params.source) url.searchParams.set('utm_source', params.source);
  if (params.medium) url.searchParams.set('utm_medium', params.medium);
  if (params.campaign) url.searchParams.set('utm_campaign', params.campaign);
  if (params.term) url.searchParams.set('utm_term', params.term);
  if (params.content) url.searchParams.set('utm_content', params.content);
  return url.toString();
}

export const UTM_SOURCES = {
  google: 'google',
  facebook: 'facebook',
  twitter: 'twitter',
  email: 'email',
  linkedin: 'linkedin',
} as const;

export const UTM_MEDIUMS = {
  cpc: 'cpc',
  organic: 'organic',
  social: 'social',
  email: 'email',
  referral: 'referral',
} as const;