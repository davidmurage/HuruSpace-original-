export const PLACE_ALERT_OPTIONS = [
  {
    value: 'lift-outage',
    label: 'Lift not working',
    description: 'Elevator or lift access is unavailable right now.',
  },
  {
    value: 'ramp-blocked',
    label: 'Ramp blocked',
    description: 'Step-free access is obstructed or temporarily unavailable.',
  },
  {
    value: 'toilet-inaccessible',
    label: 'Toilet inaccessible',
    description: 'Accessible toilet is unavailable or unusable.',
  },
  {
    value: 'stairs-only',
    label: 'Stairs only access',
    description: 'The practical access path currently requires stairs.',
  },
  {
    value: 'audio-guidance-offline',
    label: 'Audio support offline',
    description: 'Audio guidance or sound-based support is not working.',
  },
  {
    value: 'other',
    label: 'Other issue',
    description: 'Report another real-time accessibility problem.',
  },
] as const;

export const PLACE_ALERT_LABELS = PLACE_ALERT_OPTIONS.reduce<Record<string, string>>(
  (labels, option) => {
    labels[option.value] = option.label;
    return labels;
  },
  {}
);
