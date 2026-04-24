import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

// Check if PostHog is properly configured (not using placeholder values)
const isPostHogConfigured = POSTHOG_KEY && POSTHOG_KEY !== 'phc_placeholder' && POSTHOG_KEY.length > 10;

export const analyticsService = {
  init: () => {
    if (typeof window !== 'undefined' && import.meta.env.MODE !== 'test' && isPostHogConfigured) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        autocapture: true, // Automatically tracks clicks and inputs
        capture_pageview: true, // Automatically tracks route changes
        capture_pageleave: true,
      });
    } else {
      console.log('PostHog analytics disabled - not configured');
    }
  },

  identify: (userId: string, properties?: Record<string, any>) => {
    if (isPostHogConfigured) {
      posthog.identify(userId, properties);
    }
  },

  reset: () => {
    if (isPostHogConfigured) {
      posthog.reset();
    }
  },

  track: (eventName: string, properties?: Record<string, any>) => {
    if (isPostHogConfigured) {
      posthog.capture(eventName, properties);
    }
  },

  // Specific Core Events for Retention & Growth
  trackOnboardingStep: (stepNumber: number, stepName: string) => {
    if (isPostHogConfigured) {
      posthog.capture('Onboarding Step Completed', { step: stepNumber, stepName });
    }
  },

  trackCoreAction: (actionType: 'generate_deck' | 'study_session' | 'chat_message', details?: any) => {
    if (isPostHogConfigured) {
      posthog.capture(`Core Action: ${actionType}`, details);
    }
  },

  trackSubscription: (status: string, plan: string) => {
    if (isPostHogConfigured) {
      posthog.capture('Subscription Change', { status, plan });
    }
  }
};
