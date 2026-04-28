import path from 'path';

interface GeoData {
  country?: string;
  city?: string;
}

let geoLookup: any = null;

async function initGeoLookup() {
  try {
    const maxmind = await import('maxmind');
    const dbPath = path.join(process.cwd(), 'data', 'GeoLite2-City.mmdb');
    geoLookup = await maxmind.default.open(dbPath);
    console.log('MaxMind GeoIP database loaded successfully');
  } catch {
    console.warn('MaxMind GeoIP database not found. Geolocation disabled.');
    console.warn('Download from: https://dev.maxmind.com/geoip/geolite2-free-geolocation-data');
    geoLookup = null;
  }
}

initGeoLookup();

export async function lookupGeo(ipAddress: string): Promise<GeoData> {
  if (!geoLookup || !ipAddress) {
    return {};
  }

  try {
    if (ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress.startsWith('172.')) {
      return {};
    }

    const result = geoLookup.get(ipAddress);
    if (result && result.country) {
      return {
        country: result.country.names?.en || result.country.isoCode,
      };
    }
  } catch {
    console.warn('GeoIP lookup failed for:', ipAddress);
  }

  return {};
}

export function isGeoEnabled(): boolean {
  return geoLookup !== null;
}