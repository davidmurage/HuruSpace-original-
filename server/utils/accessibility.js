export const accessibilityCategories = [
  'mobility',
  'visual',
  'hearing',
  'cognitive',
  'temporary',
];

export const emptyAccessibilityDetails = () => ({
  mobility: [],
  visual: [],
  hearing: [],
  cognitive: [],
  temporary: [],
});

export const parseJsonField = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((entry) => String(entry).trim()).filter(Boolean))];
};

export const normalizeAccessibilityDetails = (value) => {
  const source = parseJsonField(value, {});

  return accessibilityCategories.reduce((details, category) => {
    details[category] = normalizeStringArray(source?.[category]);
    return details;
  }, emptyAccessibilityDetails());
};

export const flattenAccessibilityDetails = (details = emptyAccessibilityDetails()) =>
  accessibilityCategories.flatMap((category) => details[category] || []);

export const calculateAccessibilityScore = (details, reviews = []) => {
  const uniqueFeatureCount = new Set(flattenAccessibilityDetails(details)).size;
  const featureScore = Math.min(100, Math.round((uniqueFeatureCount / 15) * 100));

  if (!reviews.length) {
    return featureScore;
  }

  const averageReview =
    reviews.reduce((total, review) => total + (review.accessibilityRating || 0), 0) /
    reviews.length;

  return Math.min(100, Math.round(featureScore * 0.7 + averageReview * 20 * 0.3));
};

export const calculateAverageAccessibilityRating = (reviews = []) => {
  if (!reviews.length) {
    return 0;
  }

  return Number(
    (
      reviews.reduce((total, review) => total + (review.accessibilityRating || 0), 0) /
      reviews.length
    ).toFixed(1)
  );
};

export const normalizeInteractionSettings = (value) => {
  const source = parseJsonField(value, {});

  return {
    voice: Boolean(source?.voice),
    largeText: Boolean(source?.largeText),
    highContrast: Boolean(source?.highContrast),
    simplifiedUi: Boolean(source?.simplifiedUi),
  };
};

export const normalizeAccessibilityProfile = (value) => {
  const source = parseJsonField(value, {});

  return {
    needs: normalizeStringArray(source?.needs),
    mobilityNeeds: normalizeStringArray(source?.mobilityNeeds),
    visualNeeds: normalizeStringArray(source?.visualNeeds),
    hearingNeeds: normalizeStringArray(source?.hearingNeeds),
    cognitiveNeeds: normalizeStringArray(source?.cognitiveNeeds),
    temporaryNeeds: normalizeStringArray(source?.temporaryNeeds),
    interaction: normalizeInteractionSettings(source?.interaction),
  };
};
