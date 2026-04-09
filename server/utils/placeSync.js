import {
  calculateAccessibilityScore,
  emptyAccessibilityDetails,
  flattenAccessibilityDetails,
} from './accessibility.js';
import { geocodeAddress } from './geocoding.js';

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const SUPPORTED_PLACE_TYPES = [
  'all',
  'restaurant',
  'office',
  'venue',
  'clinic',
  'hotel',
  'public-space',
];
const POSITIVE_ACCESS_VALUES = new Set([
  'yes',
  'designated',
  'limited',
  'true',
  '1',
]);
const NEGATIVE_ACCESS_VALUES = new Set(['no', 'false', '0', 'none', 'private']);
const DEFAULT_RADIUS_METERS = 5000;
const MIN_RADIUS_METERS = 500;
const MAX_RADIUS_METERS = 15000;
const WIKIMEDIA_FILE_REDIRECT_URL =
  'https://commons.wikimedia.org/w/index.php?title=Special:FilePath/';
const WIKIMEDIA_ACTION_API_URL = 'https://commons.wikimedia.org/w/api.php';
const WIKIDATA_ENTITY_DATA_URL =
  'https://www.wikidata.org/wiki/Special:EntityData/';
const WIKIPEDIA_SUMMARY_SUFFIX = '/api/rest_v1/page/summary/';
const MAX_SYNC_IMAGES = 12;
const IMAGE_URL_PATTERN =
  /\.(avif|bmp|gif|heic|jpeg|jpg|png|svg|webp)(?:$|[?#])/i;
const WIKIDATA_IMAGE_PROPERTY = 'P18';
const WIKIDATA_COMMONS_CATEGORY_PROPERTY = 'P373';
const WEBSITE_IMAGE_SKIP_KEYWORDS = [
  'logo',
  'icon',
  'sprite',
  'avatar',
  'favicon',
  'placeholder',
  'tracking',
  'pixel',
];

const TYPE_SELECTORS = {
  restaurant: ['nwr["amenity"~"^(restaurant|cafe|fast_food)$"]'],
  office: ['nwr["office"]'],
  venue: [
    'nwr["amenity"~"^(community_centre|conference_centre|events_venue|arts_centre|theatre|cinema|exhibition_centre)$"]',
    'nwr["tourism"="museum"]',
  ],
  clinic: ['nwr["amenity"~"^(clinic|hospital|doctors|dentist)$"]'],
  hotel: ['nwr["tourism"~"^(hotel|guest_house|hostel|motel)$"]'],
  'public-space': [
    'nwr["leisure"~"^(park|garden)$"]',
    'nwr["amenity"~"^(library|community_centre|townhall)$"]',
  ],
};

export class PlaceSyncError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'PlaceSyncError';
    this.statusCode = statusCode;
  }
}

const addFeature = (details, category, feature) => {
  if (!feature || details[category].includes(feature)) {
    return;
  }

  details[category].push(feature);
};

const normalizeTagValue = (value) => String(value || '').trim().toLowerCase();

const hasPositiveTag = (tags, ...keys) =>
  keys.some((key) => POSITIVE_ACCESS_VALUES.has(normalizeTagValue(tags?.[key])));

const hasMeaningfulTag = (tags, ...keys) =>
  keys.some((key) => {
    const value = normalizeTagValue(tags?.[key]);
    return Boolean(value) && !NEGATIVE_ACCESS_VALUES.has(value);
  });

const getFirstTag = (tags, keys = []) => {
  for (const key of keys) {
    const value = String(tags?.[key] || '').trim();

    if (value) {
      return value;
    }
  }

  return '';
};

const splitTagValues = (value) =>
  String(value || '')
    .split(/[;\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const getTagValuesByKeyMatcher = (tags = {}, predicate, { split = true } = {}) =>
  Object.entries(tags)
    .filter(([key, value]) => predicate(key, value) && String(value || '').trim())
    .flatMap(([, value]) => (split ? splitTagValues(value) : [String(value).trim()]));

const safeDecodeURIComponent = (value) => {
  try {
    return decodeURIComponent(String(value || ''));
  } catch {
    return String(value || '');
  }
};

const stripFilePrefix = (value) =>
  String(value || '')
    .replace(/^(file|image):/i, '')
    .trim();

const buildWikimediaFileUrl = (value) => {
  const fileName = stripFilePrefix(value);

  if (!fileName || /^category:/i.test(fileName)) {
    return '';
  }

  return `${WIKIMEDIA_FILE_REDIRECT_URL}${encodeURIComponent(fileName)}&width=1600`;
};

const normalizeImageUrl = (value) => {
  const source = String(value || '').trim();

  if (!source) {
    return '';
  }

  if (/^(file|image):/i.test(source)) {
    return buildWikimediaFileUrl(source);
  }

  if (/^https?:\/\/commons\.wikimedia\.org\/wiki\/File:/i.test(source)) {
    const fileName = safeDecodeURIComponent(source.split('/wiki/File:')[1] || '');
    return buildWikimediaFileUrl(fileName);
  }

  if (/^https?:\/\/.+\/wiki\/File:/i.test(source)) {
    const fileName = safeDecodeURIComponent(source.split('/wiki/File:')[1] || '');
    return buildWikimediaFileUrl(fileName);
  }

  if (/^https?:\/\/.+\/Special:FilePath\//i.test(source)) {
    return source;
  }

  if (/^https?:\/\//i.test(source)) {
    if (IMAGE_URL_PATTERN.test(source) || source.includes('upload.wikimedia.org')) {
      return source;
    }
  }

  return '';
};

const uniqueImages = (values = []) =>
  [...new Set(values.filter(Boolean))].slice(0, MAX_SYNC_IMAGES);

const normalizeWikidataId = (value) => {
  const match = String(value || '').match(/Q\d+/i);
  return match ? match[0].toUpperCase() : '';
};

const normalizeWikipediaReference = (reference) => {
  if (!reference || !reference.language || !reference.title) {
    return null;
  }

  const language = String(reference.language || '').trim().toLowerCase();
  const title = safeDecodeURIComponent(String(reference.title || '').replace(/_/g, ' '))
    .trim();

  if (!/^[a-z_-]{2,20}$/i.test(language) || !title) {
    return null;
  }

  return { language: language.replace(/_/g, '-'), title };
};

const parseWikipediaReference = (value) => {
  const source = String(value || '').trim();

  if (!source) {
    return null;
  }

  if (/^https?:\/\//i.test(source)) {
    try {
      const url = new URL(source);
      const language = url.hostname.split('.')[0];
      let title = '';

      if (url.pathname.startsWith('/wiki/')) {
        title = url.pathname.slice('/wiki/'.length);
      } else if (url.pathname.startsWith('/w/index.php')) {
        title = url.searchParams.get('title') || '';
      }

      return normalizeWikipediaReference({
        language,
        title: title.replace(/^File:/i, ''),
      });
    } catch {
      return null;
    }
  }

  const match = source.match(/^([a-z_-]{2,20}):(.+)$/i);

  if (!match) {
    return null;
  }

  return normalizeWikipediaReference({
    language: match[1],
    title: match[2],
  });
};

const parseCommonsReference = (value) => {
  const source = String(value || '').trim();

  if (!source) {
    return null;
  }

  let normalizedSource = source;

  if (/^https?:\/\/.+\/wiki\//i.test(source)) {
    normalizedSource = safeDecodeURIComponent(source.split('/wiki/')[1] || '');
  }

  normalizedSource = normalizedSource.replace(/_/g, ' ').trim();

  if (/^(file|image):/i.test(normalizedSource)) {
    const fileName = stripFilePrefix(normalizedSource);
    return fileName ? { type: 'file', title: fileName } : null;
  }

  if (/^category:/i.test(normalizedSource)) {
    const categoryName = normalizedSource.replace(/^category:/i, '').trim();
    return categoryName ? { type: 'category', title: `Category:${categoryName}` } : null;
  }

  return null;
};

const uniqueWikipediaReferences = (references = []) => {
  const seen = new Set();

  return references.filter((reference) => {
    const normalizedReference = normalizeWikipediaReference(reference);

    if (!normalizedReference) {
      return false;
    }

    const key = `${normalizedReference.language}:${normalizedReference.title.toLowerCase()}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const uniqueCommonsReferences = (references = []) => {
  const seen = new Set();

  return references.filter((reference) => {
    if (!reference?.type || !reference?.title) {
      return false;
    }

    const key = `${reference.type}:${String(reference.title).toLowerCase()}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const buildWikipediaSummaryUrl = ({ language, title }) =>
  `https://${language}.wikipedia.org${WIKIPEDIA_SUMMARY_SUFFIX}${encodeURIComponent(
    title.replace(/\s+/g, '_')
  )}`;

const getClaimStringValues = (entity, propertyId) => {
  const claims = Array.isArray(entity?.claims?.[propertyId])
    ? entity.claims[propertyId]
    : [];

  return claims
    .map((claim) => claim?.mainsnak?.datavalue?.value)
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => value.trim());
};

const extractWikipediaReferencesFromTags = (tags = {}) =>
  uniqueWikipediaReferences([
    parseWikipediaReference(tags.wikipedia),
    parseWikipediaReference(tags['brand:wikipedia']),
  ]);

const extractCommonsReferencesFromTags = (tags = {}) =>
  uniqueCommonsReferences(
    getTagValuesByKeyMatcher(
      tags,
      (key) => key === 'wikimedia_commons' || key.endsWith(':wikimedia_commons'),
      { split: false }
    ).map((value) => parseCommonsReference(value))
  );

const normalizeWebsiteUrl = (value) => {
  const source = String(value || '').trim();

  if (!source) {
    return '';
  }

  if (/^https?:\/\//i.test(source)) {
    return source;
  }

  if (/^[\w.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(source)) {
    return `https://${source}`;
  }

  return '';
};

const extractWebsiteUrlsFromTags = (tags = {}) =>
  [
    ...new Set(
      getTagValuesByKeyMatcher(
        tags,
        (key) => key === 'website' || key === 'url' || key.endsWith(':website')
      )
        .map((value) => normalizeWebsiteUrl(value))
        .filter(Boolean)
    ),
  ];

const extractWikipediaReferencesFromEntity = (entity = {}) => {
  const sitelinks = entity?.sitelinks || {};
  const references = [];

  if (sitelinks.enwiki?.title) {
    references.push({ language: 'en', title: sitelinks.enwiki.title });
  }

  for (const [key, value] of Object.entries(sitelinks)) {
    if (key === 'commonswiki' || key === 'wikidatawiki' || !key.endsWith('wiki')) {
      continue;
    }

    const language = key.slice(0, -4);

    if (value?.title) {
      references.push({ language, title: value.title });
    }
  }

  return uniqueWikipediaReferences(references);
};

const extractCommonsReferencesFromEntity = (entity = {}) =>
  uniqueCommonsReferences([
    ...getClaimStringValues(entity, WIKIDATA_COMMONS_CATEGORY_PROPERTY).map((value) =>
      parseCommonsReference(`Category:${value}`)
    ),
    parseCommonsReference(entity?.sitelinks?.commonswiki?.title),
  ]);

const ensureImageCache = (cache = {}) => ({
  wikidataEntities:
    cache?.wikidataEntities instanceof Map ? cache.wikidataEntities : new Map(),
  wikipediaSummaries:
    cache?.wikipediaSummaries instanceof Map ? cache.wikipediaSummaries : new Map(),
  wikidataImages:
    cache?.wikidataImages instanceof Map ? cache.wikidataImages : new Map(),
  commonsCategories:
    cache?.commonsCategories instanceof Map ? cache.commonsCategories : new Map(),
  websiteImages:
    cache?.websiteImages instanceof Map ? cache.websiteImages : new Map(),
});

const fetchWikidataEntity = async (entityId, cache = new Map()) => {
  if (!entityId || typeof fetch !== 'function') {
    return null;
  }

  if (cache.has(entityId)) {
    return cache.get(entityId);
  }

  let response;

  try {
    response = await fetch(`${WIKIDATA_ENTITY_DATA_URL}${entityId}.json`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Huruspaces/1.0 accessibility-sync',
      },
    });
  } catch {
    cache.set(entityId, null);
    return null;
  }

  if (!response.ok) {
    cache.set(entityId, null);
    return null;
  }

  const data = await response.json();
  const entity = data?.entities?.[entityId] || null;

  cache.set(entityId, entity);
  return entity;
};

const extractImageUrlFromWikipediaSummary = (summary = {}) =>
  normalizeImageUrl(
    summary?.originalimage?.source ||
      summary?.originalimage?.url ||
      summary?.originalimage?.uri ||
      summary?.thumbnail?.source ||
      summary?.thumbnail?.url ||
      summary?.thumbnail?.uri ||
      ''
  );

const fetchWikipediaSummaryImageUrl = async (
  reference,
  cache = new Map()
) => {
  const normalizedReference = normalizeWikipediaReference(reference);

  if (!normalizedReference || typeof fetch !== 'function') {
    return '';
  }

  const cacheKey = `${normalizedReference.language}:${normalizedReference.title.toLowerCase()}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) || '';
  }

  let response;

  try {
    response = await fetch(buildWikipediaSummaryUrl(normalizedReference), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Huruspaces/1.0 accessibility-sync',
      },
    });
  } catch {
    cache.set(cacheKey, '');
    return '';
  }

  if (!response.ok) {
    cache.set(cacheKey, '');
    return '';
  }

  const summary = await response.json();
  const imageUrl = extractImageUrlFromWikipediaSummary(summary);

  cache.set(cacheKey, imageUrl);
  return imageUrl;
};

const fetchWikipediaImageUrls = async (tags = {}, cache = {}) => {
  const imageCache = ensureImageCache(cache);
  const references = extractWikipediaReferencesFromTags(tags);

  if (!references.length) {
    return [];
  }

  const imageUrls = [];

  for (const reference of references) {
    const imageUrl = await fetchWikipediaSummaryImageUrl(
      reference,
      imageCache.wikipediaSummaries
    );

    if (imageUrl) {
      imageUrls.push(imageUrl);
    }

    if (imageUrls.length >= MAX_SYNC_IMAGES) {
      break;
    }
  }

  return uniqueImages(imageUrls);
};

const buildCommonsCategoryRequestUrl = (categoryTitle, continueToken = '') => {
  const url = new URL(WIKIMEDIA_ACTION_API_URL);

  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('list', 'categorymembers');
  url.searchParams.set('cmtype', 'file');
  url.searchParams.set('cmprop', 'title');
  url.searchParams.set('cmtitle', categoryTitle);
  url.searchParams.set('cmlimit', String(Math.min(MAX_SYNC_IMAGES, 50)));

  if (continueToken) {
    url.searchParams.set('cmcontinue', continueToken);
  }

  return url.toString();
};

const fetchCommonsCategoryImageUrls = async (categoryTitle, cache = new Map()) => {
  if (!categoryTitle || typeof fetch !== 'function') {
    return [];
  }

  if (cache.has(categoryTitle)) {
    return cache.get(categoryTitle) || [];
  }

  const imageUrls = [];
  let continueToken = '';

  do {
    let response;

    try {
      response = await fetch(buildCommonsCategoryRequestUrl(categoryTitle, continueToken), {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Huruspaces/1.0 accessibility-sync',
        },
      });
    } catch {
      cache.set(categoryTitle, []);
      return [];
    }

    if (!response.ok) {
      cache.set(categoryTitle, []);
      return [];
    }

    const data = await response.json();
    const files = Array.isArray(data?.query?.categorymembers)
      ? data.query.categorymembers
      : [];

    imageUrls.push(
      ...files.map((file) => buildWikimediaFileUrl(file?.title)).filter(Boolean)
    );

    continueToken = data?.continue?.cmcontinue || '';
  } while (continueToken && imageUrls.length < MAX_SYNC_IMAGES);

  const normalizedUrls = uniqueImages(imageUrls);

  cache.set(categoryTitle, normalizedUrls);
  return normalizedUrls;
};

const fetchCommonsReferenceImageUrls = async (references = [], cache = {}) => {
  const imageCache = ensureImageCache(cache);
  const imageUrls = [];

  for (const reference of uniqueCommonsReferences(references)) {
    if (reference.type === 'file') {
      imageUrls.push(buildWikimediaFileUrl(reference.title));
    } else if (reference.type === 'category') {
      imageUrls.push(
        ...(await fetchCommonsCategoryImageUrls(
          reference.title,
          imageCache.commonsCategories
        ))
      );
    }

    if (imageUrls.length >= MAX_SYNC_IMAGES) {
      break;
    }
  }

  return uniqueImages(imageUrls);
};

const collectRegexMatches = (value, pattern) => {
  const matches = [];

  pattern.lastIndex = 0;

  while (true) {
    const match = pattern.exec(value);

    if (!match) {
      break;
    }

    matches.push(match[1]);

    if (match.index === pattern.lastIndex) {
      pattern.lastIndex += 1;
    }
  }

  return matches;
};

const extractSrcsetUrls = (value = '') =>
  String(value || '')
    .split(',')
    .map((entry) => entry.trim().split(/\s+/)[0] || '')
    .filter(Boolean);

const isLikelyUsefulWebsiteImageUrl = (value) => {
  const source = String(value || '').trim().toLowerCase();

  if (
    !source ||
    source.startsWith('data:') ||
    source.startsWith('javascript:') ||
    WEBSITE_IMAGE_SKIP_KEYWORDS.some((keyword) => source.includes(keyword))
  ) {
    return false;
  }

  return true;
};

const extractWebsiteImageCandidates = (html = '') => {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url|:url)?["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url|:url)?["'][^>]*>/gi,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["'][^>]*>/gi,
    /<link[^>]+rel=["'][^"']*image_src[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/gi,
    /<(?:img|source)[^>]+(?:data-src|data-lazy-src|src)=["']([^"']+)["'][^>]*>/gi,
    /<(?:img|source)[^>]+(?:data-srcset|srcset)=["']([^"']+)["'][^>]*>/gi,
  ];

  const candidates = [];

  for (const pattern of patterns) {
    for (const match of collectRegexMatches(html, pattern)) {
      if (pattern.source.includes('srcset')) {
        candidates.push(...extractSrcsetUrls(match));
      } else {
        candidates.push(match);
      }
    }
  }

  return [...new Set(candidates.filter(isLikelyUsefulWebsiteImageUrl))].slice(
    0,
    MAX_SYNC_IMAGES * 3
  );
};

const resolveWebsiteImageUrl = (candidate, pageUrl) => {
  const source = String(candidate || '').trim();

  if (!source || source.startsWith('data:')) {
    return '';
  }

  try {
    return normalizeImageUrl(new URL(source, pageUrl).toString());
  } catch {
    return normalizeImageUrl(source);
  }
};

const fetchWebsiteImageUrls = async (tags = {}, cache = {}) => {
  if (typeof fetch !== 'function') {
    return [];
  }

  const imageCache = ensureImageCache(cache);
  const websiteUrls = extractWebsiteUrlsFromTags(tags);

  if (!websiteUrls.length) {
    return [];
  }

  const imageUrls = [];

  for (const websiteUrl of websiteUrls) {
    if (imageCache.websiteImages.has(websiteUrl)) {
      imageUrls.push(...imageCache.websiteImages.get(websiteUrl));
      continue;
    }

    let response;

    try {
      response = await fetch(websiteUrl, {
        headers: {
          Accept: 'text/html,application/xhtml+xml,image/*;q=0.9,*/*;q=0.8',
          'User-Agent': 'Huruspaces/1.0 accessibility-sync',
        },
      });
    } catch {
      imageCache.websiteImages.set(websiteUrl, []);
      continue;
    }

    if (!response.ok) {
      imageCache.websiteImages.set(websiteUrl, []);
      continue;
    }

    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    let normalizedUrls = [];

    if (contentType.startsWith('image/')) {
      normalizedUrls = uniqueImages([
        normalizeImageUrl(response.url || websiteUrl),
      ]);
    } else {
      const html = await response.text();
      normalizedUrls = uniqueImages(
        extractWebsiteImageCandidates(html).map((candidate) =>
          resolveWebsiteImageUrl(candidate, response.url || websiteUrl)
        )
      );
    }

    imageCache.websiteImages.set(websiteUrl, normalizedUrls);
    imageUrls.push(...normalizedUrls);

    if (imageUrls.length >= MAX_SYNC_IMAGES) {
      break;
    }
  }

  return uniqueImages(imageUrls);
};

const fetchWikidataImageUrls = async (tags = {}, cache = {}) => {
  const wikidataIds = [
    normalizeWikidataId(tags.wikidata),
    normalizeWikidataId(tags['brand:wikidata']),
  ].filter(Boolean);

  if (!wikidataIds.length || typeof fetch !== 'function') {
    return [];
  }

  const imageCache = ensureImageCache(cache);
  const imageUrls = [];

  for (const entityId of wikidataIds) {
    if (imageCache.wikidataImages.has(entityId)) {
      imageUrls.push(...imageCache.wikidataImages.get(entityId));
      continue;
    }

    const entity = await fetchWikidataEntity(entityId, imageCache.wikidataEntities);

    if (!entity) {
      imageCache.wikidataImages.set(entityId, []);
      continue;
    }

    const fileNames = getClaimStringValues(entity, WIKIDATA_IMAGE_PROPERTY);
    const urls = fileNames.map((fileName) => buildWikimediaFileUrl(fileName));

    if (urls.length < MAX_SYNC_IMAGES) {
      urls.push(
        ...(await fetchCommonsReferenceImageUrls(
          extractCommonsReferencesFromEntity(entity),
          imageCache
        ))
      );
    }

    if (urls.length < MAX_SYNC_IMAGES) {
      const wikipediaReferences = extractWikipediaReferencesFromEntity(entity);

      for (const reference of wikipediaReferences) {
        const imageUrl = await fetchWikipediaSummaryImageUrl(
          reference,
          imageCache.wikipediaSummaries
        );

        if (imageUrl) {
          urls.push(imageUrl);
        }

        if (urls.length >= MAX_SYNC_IMAGES) {
          break;
        }
      }
    }

    const normalizedUrls = uniqueImages(urls);

    imageCache.wikidataImages.set(entityId, normalizedUrls);
    imageUrls.push(...normalizedUrls);
  }

  return uniqueImages(imageUrls);
};

const parseMeters = (value) => {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  const numeric = Number.parseFloat(String(value).replace(/[^\d.]/g, ''));

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  if (String(value).includes('cm')) {
    return numeric / 100;
  }

  return numeric;
};

const buildAccessibilityDetailsFromTags = (tags = {}) => {
  const details = emptyAccessibilityDetails();

  if (hasMeaningfulTag(tags, 'wheelchair')) {
    addFeature(details, 'mobility', 'Wheelchair access');
  }

  if (hasPositiveTag(tags, 'ramp', 'ramp:wheelchair')) {
    addFeature(details, 'mobility', 'Ramp');
  }

  if (
    hasPositiveTag(tags, 'elevator') ||
    normalizeTagValue(tags.highway) === 'elevator'
  ) {
    addFeature(details, 'mobility', 'Elevator');
  }

  if (hasPositiveTag(tags, 'step_free_access')) {
    addFeature(details, 'mobility', 'No stairs');
  }

  if (hasPositiveTag(tags, 'toilets:wheelchair', 'wheelchair:toilet')) {
    addFeature(details, 'mobility', 'Accessible toilet');
  }

  if (
    hasPositiveTag(tags, 'parking:wheelchair') ||
    Number.parseInt(String(tags['capacity:disabled'] || '0'), 10) > 0
  ) {
    addFeature(details, 'mobility', 'Accessible parking');
  }

  if (parseMeters(tags.width) >= 0.9 || parseMeters(tags['door:width']) >= 0.9) {
    addFeature(details, 'mobility', 'Wide doorway');
  }

  if (hasPositiveTag(tags, 'braille')) {
    addFeature(details, 'visual', 'Braille signage');
  }

  if (hasPositiveTag(tags, 'audio_guide', 'audio_description')) {
    addFeature(details, 'visual', 'Audio guidance');
  }

  if (hasPositiveTag(tags, 'lit')) {
    addFeature(details, 'visual', 'Good lighting');
  }

  if (hasPositiveTag(tags, 'tactile_paving')) {
    addFeature(details, 'visual', 'Tactile paving');
  }

  if (hasPositiveTag(tags, 'visual_signals', 'visual_alert')) {
    addFeature(details, 'hearing', 'Visual alerts');
  }

  if (hasMeaningfulTag(tags, 'sign_language', 'deaf:sign')) {
    addFeature(details, 'hearing', 'Sign language support');
  }

  if (hasPositiveTag(tags, 'captioned', 'subtitles')) {
    addFeature(details, 'hearing', 'Captioned screens');
  }

  if (hasMeaningfulTag(tags, 'hearing_loop', 'audio_loop', 'induction_loop')) {
    addFeature(details, 'hearing', 'Hearing loop');
  }

  if (hasPositiveTag(tags, 'quiet') || hasMeaningfulTag(tags, 'quiet_room')) {
    addFeature(details, 'cognitive', 'Quiet space');
  }

  if (hasMeaningfulTag(tags, 'signage')) {
    addFeature(details, 'cognitive', 'Clear signage');
  }

  if (hasPositiveTag(tags, 'low_sensory_lighting', 'sensory_friendly')) {
    addFeature(details, 'cognitive', 'Low sensory lighting');
  }

  if (hasMeaningfulTag(tags, 'staff_assistance')) {
    addFeature(details, 'cognitive', 'Supportive staff');
  }

  if (hasPositiveTag(tags, 'drop_off') || normalizeTagValue(tags.amenity) === 'taxi') {
    addFeature(details, 'temporary', 'Drop-off zone');
  }

  if (hasPositiveTag(tags, 'bench', 'seating')) {
    addFeature(details, 'temporary', 'Rest area');
  }

  if (hasPositiveTag(tags, 'handrail', 'handrails')) {
    addFeature(details, 'temporary', 'Handrails');
  }

  return details;
};

const inferPlaceTypeFromTags = (tags = {}) => {
  const amenity = normalizeTagValue(tags.amenity);
  const tourism = normalizeTagValue(tags.tourism);
  const leisure = normalizeTagValue(tags.leisure);

  if (['restaurant', 'cafe', 'fast_food'].includes(amenity)) {
    return 'restaurant';
  }

  if (tags.office) {
    return 'office';
  }

  if (
    [
      'community_centre',
      'conference_centre',
      'events_venue',
      'arts_centre',
      'theatre',
      'cinema',
      'exhibition_centre',
    ].includes(amenity) ||
    tourism === 'museum'
  ) {
    return 'venue';
  }

  if (['clinic', 'hospital', 'doctors', 'dentist'].includes(amenity)) {
    return 'clinic';
  }

  if (['hotel', 'guest_house', 'hostel', 'motel'].includes(tourism)) {
    return 'hotel';
  }

  if (
    ['park', 'garden'].includes(leisure) ||
    ['library', 'community_centre', 'townhall'].includes(amenity)
  ) {
    return 'public-space';
  }

  return null;
};

const buildAddress = (tags = {}, searchArea = '') => {
  const explicitAddress = getFirstTag(tags, ['addr:full']);

  if (explicitAddress) {
    return explicitAddress;
  }

  const streetLine = [tags['addr:housenumber'], tags['addr:street']]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' ');
  const locality = [
    tags['addr:suburb'],
    tags['addr:city'],
    tags['addr:state'],
    tags['addr:country'],
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  const address = [streetLine, ...locality].filter(Boolean).join(', ');

  return address || searchArea;
};

const buildDescription = (tags = {}) =>
  [
    getFirstTag(tags, ['description']),
    getFirstTag(tags, ['wheelchair:description']),
    getFirstTag(tags, ['tactile_paving:description']),
  ]
    .filter(Boolean)
    .slice(0, 2)
    .join(' ');

const buildContact = (tags = {}) => ({
  phone: getFirstTag(tags, ['contact:phone', 'phone']),
  email: getFirstTag(tags, ['contact:email', 'email']),
});

const buildImages = async (tags = {}, cache = {}) => {
  const directImageCandidates = getTagValuesByKeyMatcher(
    tags,
    (key) => key === 'image' || key.startsWith('image:')
  ).map((value) => normalizeImageUrl(value));

  const commonsReferenceCandidates = await fetchCommonsReferenceImageUrls(
    extractCommonsReferencesFromTags(tags),
    cache
  );

  const directAndCommonsCandidates = uniqueImages([
    ...directImageCandidates,
    ...commonsReferenceCandidates,
  ]);
  const wikipediaCandidates =
    directAndCommonsCandidates.length >= MAX_SYNC_IMAGES
      ? []
      : await fetchWikipediaImageUrls(tags, cache);
  const seededCandidates = uniqueImages([
    ...directAndCommonsCandidates,
    ...wikipediaCandidates,
  ]);
  const wikidataCandidates =
    seededCandidates.length >= MAX_SYNC_IMAGES
      ? []
      : await fetchWikidataImageUrls(tags, cache);
  const enrichedCandidates = uniqueImages([
    ...seededCandidates,
    ...wikidataCandidates,
  ]);
  const websiteCandidates =
    enrichedCandidates.length >= MAX_SYNC_IMAGES
      ? []
      : await fetchWebsiteImageUrls(tags, cache);

  return uniqueImages([...enrichedCandidates, ...websiteCandidates]);
};

const extractCoordinates = (element = {}) => {
  const latitude = Number(element.lat ?? element.center?.lat);
  const longitude = Number(element.lon ?? element.center?.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

const getSelectorsForType = (type) => {
  if (type === 'all') {
    return Object.values(TYPE_SELECTORS).flat();
  }

  return TYPE_SELECTORS[type] || [];
};

const buildOverpassQuery = ({ latitude, longitude, radiusMeters, type }) => {
  const selectors = getSelectorsForType(type);

  return `[out:json][timeout:25];
(
${selectors.map((selector) => `  ${selector}(around:${radiusMeters},${latitude},${longitude});`).join('\n')}
);
out center tags;`;
};

const normalizeRadiusMeters = (value) => {
  const radiusKm = Number(value);

  if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
    return DEFAULT_RADIUS_METERS;
  }

  return Math.min(MAX_RADIUS_METERS, Math.max(MIN_RADIUS_METERS, Math.round(radiusKm * 1000)));
};

export const fetchQualifyingPlaceCandidates = async ({
  searchArea,
  type = 'all',
  radiusKm,
}) => {
  const normalizedSearchArea = String(searchArea || '').trim();
  const normalizedType = String(type || 'all').trim();

  if (!normalizedSearchArea) {
    throw new PlaceSyncError('Search area is required to sync places from the internet.');
  }

  if (!SUPPORTED_PLACE_TYPES.includes(normalizedType)) {
    throw new PlaceSyncError('That place type is not supported for internet sync.');
  }

  const center = await geocodeAddress(normalizedSearchArea);

  if (!center) {
    throw new PlaceSyncError(
      'We could not find that search area on the map. Please make the location more specific.'
    );
  }

  if (typeof fetch !== 'function') {
    throw new PlaceSyncError(
      'Internet place sync is not available in this Node.js runtime.',
      500
    );
  }

  const radiusMeters = normalizeRadiusMeters(radiusKm);
  const overpassQuery = buildOverpassQuery({
    latitude: center.latitude,
    longitude: center.longitude,
    radiusMeters,
    type: normalizedType,
  });

  let response;

  try {
    response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'text/plain;charset=UTF-8',
        'User-Agent': 'Huruspaces/1.0 accessibility-sync',
      },
      body: overpassQuery,
    });
  } catch {
    throw new PlaceSyncError(
      'Internet place sync is temporarily unavailable. Please try again in a moment.',
      502
    );
  }

  if (!response.ok) {
    throw new PlaceSyncError(
      'OpenStreetMap place sync failed. Please try again with a smaller area or later.',
      502
    );
  }

  const data = await response.json();
  const rawElements = Array.isArray(data?.elements) ? data.elements : [];
  const candidates = [];
  const imageCache = {
    wikidataEntities: new Map(),
    wikipediaSummaries: new Map(),
    wikidataImages: new Map(),
    commonsCategories: new Map(),
    websiteImages: new Map(),
  };
  let skippedMissingAccessibility = 0;
  let skippedUnnamed = 0;
  let skippedUnsupported = 0;

  for (const element of rawElements) {
    const tags = element?.tags || {};
    const resolvedType =
      normalizedType === 'all' ? inferPlaceTypeFromTags(tags) : normalizedType;

    if (!resolvedType) {
      skippedUnsupported += 1;
      continue;
    }

    const coordinates = extractCoordinates(element);
    const name = getFirstTag(tags, ['name', 'brand', 'operator']);

    if (!coordinates || !name) {
      skippedUnnamed += 1;
      continue;
    }

    const accessibilityDetails = buildAccessibilityDetailsFromTags(tags);

    if (!flattenAccessibilityDetails(accessibilityDetails).length) {
      skippedMissingAccessibility += 1;
      continue;
    }

    candidates.push({
      name,
      type: resolvedType,
      address: buildAddress(tags, normalizedSearchArea),
      description: buildDescription(tags),
      contact: buildContact(tags),
      images: await buildImages(tags, imageCache),
      location: coordinates,
      accessibilityDetails,
      accessibilityFeatures: flattenAccessibilityDetails(accessibilityDetails),
      accessibilityScore: calculateAccessibilityScore(accessibilityDetails, []),
      verificationStatus: 'community',
      source: {
        kind: 'internet-sync',
        provider: 'openstreetmap',
        externalId: `${element.type}/${element.id}`,
        sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
        syncedAt: new Date(),
        searchArea: normalizedSearchArea,
      },
    });
  }

  return {
    searchArea: normalizedSearchArea,
    center,
    radiusMeters,
    requestedType: normalizedType,
    totalResults: rawElements.length,
    skippedMissingAccessibility,
    skippedUnnamed,
    skippedUnsupported,
    candidates,
  };
};
