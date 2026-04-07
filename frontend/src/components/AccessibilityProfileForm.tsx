import React from 'react';
import {
  ACCESSIBILITY_OPTIONS,
  INTERACTION_OPTIONS,
  NEED_LABELS,
  getProfilePreferenceKey,
} from '../constants/accessibility';
import { AccessibilityProfile, NeedCategory } from '../types/accessibility';

interface AccessibilityProfileFormProps {
  value: AccessibilityProfile;
  onChange: (nextProfile: AccessibilityProfile) => void;
}

const categories = Object.keys(ACCESSIBILITY_OPTIONS) as NeedCategory[];

const AccessibilityProfileForm: React.FC<AccessibilityProfileFormProps> = ({
  value,
  onChange,
}) => {
  const selectedCategories = value.needs.length ? value.needs : categories;

  const handleNeedToggle = (category: NeedCategory) => {
    const nextNeeds = value.needs.includes(category)
      ? value.needs.filter((need) => need !== category)
      : [...value.needs, category];
    const preferenceKey = getProfilePreferenceKey(category);
    const nextProfile = { ...value, needs: nextNeeds };

    if (!nextNeeds.includes(category)) {
      nextProfile[preferenceKey] = [];
    }

    onChange(nextProfile);
  };

  const handlePreferenceToggle = (category: NeedCategory, option: string) => {
    const preferenceKey = getProfilePreferenceKey(category);
    const currentValues = value[preferenceKey];
    const nextValues = currentValues.includes(option)
      ? currentValues.filter((entry) => entry !== option)
      : [...currentValues, option];

    onChange({
      ...value,
      [preferenceKey]: nextValues,
    });
  };

  const handleInteractionToggle = (
    key: keyof AccessibilityProfile['interaction']
  ) => {
    onChange({
      ...value,
      interaction: {
        ...value.interaction,
        [key]: !value.interaction[key],
      },
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-lg font-semibold text-slate-900">Accessibility Needs</h3>
        <p className="mt-1 text-sm text-slate-600">
          Select the needs that matter most. Huruspaces uses this to personalize
          discovery, place summaries, and UI behavior.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleNeedToggle(category)}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                value.needs.includes(category)
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
              }`}
            >
              <span className="block text-sm font-semibold">
                {NEED_LABELS[category]}
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Personalize results for {NEED_LABELS[category].toLowerCase()} access.
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-slate-900">Preferred Features</h3>
        <p className="mt-1 text-sm text-slate-600">
          Choose practical features you want Huruspaces to prioritize.
        </p>
        <div className="mt-4 space-y-5">
          {selectedCategories.map((category) => {
            const preferenceKey = getProfilePreferenceKey(category);
            return (
              <div key={category}>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {NEED_LABELS[category]}
                </h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ACCESSIBILITY_OPTIONS[category].map((option) => {
                    const selected = value[preferenceKey].includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handlePreferenceToggle(category, option)}
                        className={`rounded-full border px-3 py-2 text-sm transition ${
                          selected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-slate-900">Accessible Interface Mode</h3>
        <p className="mt-1 text-sm text-slate-600">
          These settings shape how the app presents information to you.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {INTERACTION_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => handleInteractionToggle(option.key)}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                value.interaction[option.key]
                  ? 'border-violet-600 bg-violet-50 text-violet-900'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-violet-300'
              }`}
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className="mt-1 block text-xs text-slate-500">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AccessibilityProfileForm;
