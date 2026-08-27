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

export const TRANSPORT_ACCESSIBILITY_OPTIONS = [
  'Wheelchair-accessible vehicle',
  'Space for mobility aid',
  'Driver assistance on arrival',
  'Easy-entry vehicle',
  'Service animal welcome',
  'Clear arrival communication',
  'Written or visual trip updates',
  'Clear communication',
  'Low-sensory ride where possible',
] as const;

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

export const getTransportRequirements = (profile?: AccessibilityProfile) => {
  if (!profile) {
    return [];
  }

  const requirements = new Set<string>();

  if (profile.needs.includes('mobility')) {
    requirements.add('Wheelchair-accessible vehicle');
    requirements.add('Space for mobility aid');
    requirements.add('Driver assistance on arrival');
  }
  if (profile.needs.includes('visual')) {
    requirements.add('Driver assistance on arrival');
    requirements.add('Clear arrival communication');
  }
  if (profile.needs.includes('hearing')) {
    requirements.add('Written or visual trip updates');
  }
  if (profile.needs.includes('cognitive')) {
    requirements.add('Clear communication');
    requirements.add('Low-sensory ride where possible');
  }
  if (profile.needs.includes('temporary')) {
    requirements.add('Easy-entry vehicle');
    requirements.add('Driver assistance on arrival');
  }

  return [...requirements];
};
