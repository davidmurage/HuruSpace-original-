export type NeedCategory =
  | 'mobility'
  | 'visual'
  | 'hearing'
  | 'cognitive'
  | 'temporary';

export interface InteractionSettings {
  voice: boolean;
  largeText: boolean;
  highContrast: boolean;
  simplifiedUi: boolean;
}

export interface AccessibilityProfile {
  needs: NeedCategory[];
  mobilityNeeds: string[];
  visualNeeds: string[];
  hearingNeeds: string[];
  cognitiveNeeds: string[];
  temporaryNeeds: string[];
  interaction: InteractionSettings;
}

export interface AccessibilityDetails {
  mobility: string[];
  visual: string[];
  hearing: string[];
  cognitive: string[];
  temporary: string[];
}
