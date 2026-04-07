import { Coordinates } from './location';

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name?: string;
}

export interface GeocodingResult extends Coordinates {
  displayName: string;
}

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  const query = address.trim();

  if (!query) {
    return null;
  }

  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '1',
  });

  const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Address lookup failed. Please check the address and try again.');
  }

  const results = (await response.json()) as NominatimSearchResult[];
  const firstResult = results[0];

  if (!firstResult) {
    return null;
  }

  const latitude = Number(firstResult.lat);
  const longitude = Number(firstResult.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
    displayName: firstResult.display_name || query,
  };
};
