export interface Coordinates {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371;

const toRadians = (value: number) => (value * Math.PI) / 180;

export const hasCoordinates = (coordinates?: Partial<Coordinates> | null) =>
  Boolean(
    coordinates &&
      Number.isFinite(coordinates.latitude) &&
      Number.isFinite(coordinates.longitude) &&
      !(coordinates.latitude === 0 && coordinates.longitude === 0)
  );

export const calculateDistanceKm = (
  origin: Coordinates,
  destination: Coordinates
) => {
  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return EARTH_RADIUS_KM * arc;
};

export const formatDistanceKm = (distanceKm: number) =>
  distanceKm < 1
    ? `${Math.round(distanceKm * 1000)} m`
    : `${distanceKm.toFixed(1)} km`;

export const buildOpenStreetMapEmbedUrl = (
  coordinates: Coordinates,
  zoomDelta = 0.01
) => {
  const minLongitude = coordinates.longitude - zoomDelta;
  const maxLongitude = coordinates.longitude + zoomDelta;
  const minLatitude = coordinates.latitude - zoomDelta;
  const maxLatitude = coordinates.latitude + zoomDelta;
  const bbox = [minLongitude, minLatitude, maxLongitude, maxLatitude].join(',');

  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox
  )}&layer=mapnik&marker=${coordinates.latitude},${coordinates.longitude}`;
};

export const buildOpenStreetMapPageUrl = (coordinates: Coordinates) =>
  `https://www.openstreetmap.org/?mlat=${coordinates.latitude}&mlon=${coordinates.longitude}#map=17/${coordinates.latitude}/${coordinates.longitude}`;

export const buildGoogleMapsPlaceUrl = (coordinates: Coordinates) =>
  `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`;

export const buildGoogleMapsDirectionsUrl = (
  destination: Coordinates,
  origin?: Coordinates
) => {
  const params = new URLSearchParams({
    api: '1',
    destination: `${destination.latitude},${destination.longitude}`,
    travelmode: 'walking',
  });

  if (origin) {
    params.set('origin', `${origin.latitude},${origin.longitude}`);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

export const buildOpenStreetMapDirectionsUrl = (
  origin: Coordinates,
  destination: Coordinates
) =>
  `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${origin.latitude}%2C${origin.longitude}%3B${destination.latitude}%2C${destination.longitude}`;
