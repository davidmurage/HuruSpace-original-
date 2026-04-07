import {
  AccessibilityDetails,
  AccessibilityProfile,
  InteractionSettings,
  NeedCategory,
} from '../types/accessibility';

export const NEED_LABELS: Record<NeedCategory, string> = {
  mobility: 'Mobility',
  visual: 'Visual',
  hearing: 'Hearing',
  cognitive: 'Cognitive',
  temporary: 'Temporary',
};

export const ACCESSIBILITY_OPTIONS: Record<NeedCategory, string[]> = {
  mobility: [
    'Ramp',
    'Elevator',
    'No stairs',
    'Accessible toilet',
    'Accessible parking',
    'Wide doorway',
  ],
  visual: [
    'Braille signage',
    'Audio guidance',
    'Good lighting',
    'Tactile paving',
    'Readable digital menu',
  ],
  hearing: [
    'Visual alerts',
    'Sign language support',
    'Captioned screens',
    'Hearing loop',
  ],
  cognitive: [
    'Quiet space',
    'Clear signage',
    'Low sensory lighting',
    'Supportive staff',
  ],
  temporary: [
    'Drop-off zone',
    'Rest area',
    'Handrails',
    'Short walking distance',
  ],
};

export const INTERACTION_OPTIONS: Array<{
  key: keyof InteractionSettings;
  label: string;
  description: string;
}> = [
  {
    key: 'voice',
    label: 'Voice-ready experience',
    description: 'Prepare the interface for future voice-first flows and simple prompts.',
  },
  {
    key: 'largeText',
    label: 'Large text',
    description: 'Increase text size across the app.',
  },
  {
    key: 'highContrast',
    label: 'High contrast',
    description: 'Improve readability with stronger color contrast.',
  },
  {
    key: 'simplifiedUi',
    label: 'Simplified UI',
    description: 'Reduce visual noise and keep key actions prominent.',
  },
];

export const PLACE_TYPES = [
  'restaurant',
  'office',
  'venue',
  'clinic',
  'hotel',
  'public-space',
] as const;

export const emptyAccessibilityDetails = (): AccessibilityDetails => ({
  mobility: [],
  visual: [],
  hearing: [],
  cognitive: [],
  temporary: [],
});

export const emptyAccessibilityProfile = (): AccessibilityProfile => ({
  needs: [],
  mobilityNeeds: [],
  visualNeeds: [],
  hearingNeeds: [],
  cognitiveNeeds: [],
  temporaryNeeds: [],
  interaction: {
    voice: false,
    largeText: false,
    highContrast: false,
    simplifiedUi: false,
  },
});

export const getProfilePreferenceKey = (
  category: NeedCategory
): keyof Pick<
  AccessibilityProfile,
  'mobilityNeeds' | 'visualNeeds' | 'hearingNeeds' | 'cognitiveNeeds' | 'temporaryNeeds'
> => {
  switch (category) {
    case 'mobility':
      return 'mobilityNeeds';
    case 'visual':
      return 'visualNeeds';
    case 'hearing':
      return 'hearingNeeds';
    case 'cognitive':
      return 'cognitiveNeeds';
    case 'temporary':
      return 'temporaryNeeds';
  }
};

export const normalizeAccessibilityDetails = (
  value?: Partial<AccessibilityDetails>
): AccessibilityDetails => ({
  mobility: value?.mobility ?? [],
  visual: value?.visual ?? [],
  hearing: value?.hearing ?? [],
  cognitive: value?.cognitive ?? [],
  temporary: value?.temporary ?? [],
});

export const flattenAccessibilityDetails = (details?: Partial<AccessibilityDetails>) => {
  const normalized = normalizeAccessibilityDetails(details);
  return Object.values(normalized).flat();
};

export const getPreferredFeatures = (profile?: AccessibilityProfile) => {
  if (!profile) {
    return [];
  }

  return [
    ...profile.mobilityNeeds,
    ...profile.visualNeeds,
    ...profile.hearingNeeds,
    ...profile.cognitiveNeeds,
    ...profile.temporaryNeeds,
  ];
};
