import { Coordinates } from './location';
import { API_URL } from './config';

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name?: string;
}

export interface GeocodingResult extends Coordinates {
  displayName: string;
}

export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  const query = address.trim();

  if (!query) {
    return null;
  }

  const params = new URLSearchParams({ address: query });

  const response = await fetch(`${API_URL}/places/geocode?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    throw new Error(
      errorBody?.message || 'Address lookup failed. Please check the address and try again.'
    );
  }

  const result = (await response.json()) as Partial<NominatimSearchResult> &
    Partial<GeocodingResult>;

  const latitude = Number(result.latitude ?? result.lat);
  const longitude = Number(result.longitude ?? result.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
    displayName: result.displayName || result.display_name || query,
  };
};
