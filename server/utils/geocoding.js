import { parseJsonField } from './accessibility.js';

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

export class LocationResolutionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LocationResolutionError';
    this.statusCode = 400;
  }
}

export const hasUsableCoordinates = (location) => {
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0)
  );
};

export const normalizeCoordinates = (value) => {
  const source = parseJsonField(value, {});

  if (!hasUsableCoordinates(source)) {
    return null;
  }

  return {
    latitude: Number(source.latitude),
    longitude: Number(source.longitude),
    displayName: source.displayName,
  };
};

export const geocodeAddress = async (address) => {
  const query = String(address || '').trim();

  if (!query) {
    return null;
  }

  if (typeof fetch !== 'function') {
    throw new LocationResolutionError(
      'Address lookup is not available in this Node.js runtime.'
    );
  }

  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '1',
  });

  let response;

  try {
    response = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Huruspaces/1.0 accessibility-platform',
      },
    });
  } catch {
    throw new LocationResolutionError(
      'Address lookup is temporarily unavailable. Please try again or enter coordinates manually.'
    );
  }

  if (!response.ok) {
    throw new LocationResolutionError(
      'Address lookup failed. Please make the address more specific or enter coordinates manually.'
    );
  }

  const results = await response.json();
  const firstResult = Array.isArray(results) ? results[0] : null;

  if (!firstResult) {
    return null;
  }

  const coordinates = normalizeCoordinates({
    latitude: firstResult.lat,
    longitude: firstResult.lon,
    displayName: firstResult.display_name || query,
  });

  return coordinates;
};

export const resolvePlaceLocation = async (address, location) => {
  const providedCoordinates = normalizeCoordinates(location);

  if (providedCoordinates) {
    return providedCoordinates;
  }

  const resolvedCoordinates = await geocodeAddress(address);

  if (!resolvedCoordinates) {
    throw new LocationResolutionError(
      'We could not find map coordinates for that address. Please add the city/country or use manual coordinates.'
    );
  }

  return resolvedCoordinates;
};
