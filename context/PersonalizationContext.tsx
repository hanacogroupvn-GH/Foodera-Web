import React, { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/apiClient';
import { PersonalizedRecommendations, PersonalizationProfile, PersonalizationTrackPayload } from '../types';

interface TrackEventOptions {
  dedupeKey?: string;
  dedupeTtlMs?: number;
}

interface PersonalizationContextValue {
  recommendations: PersonalizedRecommendations | null;
  profile: PersonalizationProfile | null;
  personalizedProducts: PersonalizedRecommendations['products'];
  personalizedNews: PersonalizedRecommendations['news'];
  hasPersonalizedContent: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: (options?: { productLimit?: number; newsLimit?: number }) => Promise<void>;
  trackEvent: (payload: PersonalizationTrackPayload, options?: TrackEventOptions) => Promise<void>;
}

const PersonalizationContext = createContext<PersonalizationContextValue | undefined>(undefined);
const recentEventTimestamps = new Map<string, number>();

const shouldSkipTrackedEvent = (dedupeKey?: string, dedupeTtlMs = 1500) => {
  const normalizedKey = String(dedupeKey ?? '').trim();
  if (!normalizedKey) {
    return false;
  }

  const now = Date.now();
  const previousTimestamp = recentEventTimestamps.get(normalizedKey);
  if (previousTimestamp && now - previousTimestamp < dedupeTtlMs) {
    return true;
  }

  recentEventTimestamps.set(normalizedKey, now);
  return false;
};

const withCurrentRoute = (payload: PersonalizationTrackPayload): PersonalizationTrackPayload => {
  if (payload.route || typeof window === 'undefined') {
    return payload;
  }

  return {
    ...payload,
    route: `${window.location.pathname}${window.location.search}`
  };
};

export const PersonalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (options?: { productLimit?: number; newsLimit?: number }) => {
    try {
      setIsLoading(true);
      const payload = await api.getPersonalizedRecommendations(options);
      startTransition(() => {
        setRecommendations(payload);
        setError(null);
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load personalized recommendations.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const trackEvent = useCallback(async (payload: PersonalizationTrackPayload, options?: TrackEventOptions) => {
    if (shouldSkipTrackedEvent(options?.dedupeKey, options?.dedupeTtlMs)) {
      return;
    }

    try {
      const response = await api.trackPersonalizationEvent(withCurrentRoute(payload));
      startTransition(() => {
        setRecommendations(response);
        setError(null);
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to track personalization event.');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, []);

  const profile = recommendations?.profile ?? null;
  const hasPersonalizedContent = Boolean(profile?.isPersonalized);

  const value = useMemo(
    () => ({
      recommendations,
      profile,
      personalizedProducts: hasPersonalizedContent ? recommendations?.products ?? [] : [],
      personalizedNews: hasPersonalizedContent ? recommendations?.news ?? [] : [],
      hasPersonalizedContent,
      isLoading,
      error,
      refresh,
      trackEvent
    }),
    [error, hasPersonalizedContent, isLoading, profile, recommendations, refresh, trackEvent]
  );

  return <PersonalizationContext.Provider value={value}>{children}</PersonalizationContext.Provider>;
};

export const usePersonalization = () => {
  const context = useContext(PersonalizationContext);
  if (!context) {
    throw new Error('usePersonalization must be used within PersonalizationProvider');
  }

  return context;
};
