import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || 'phc_dummy_key_replace_me';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

export const analyticsService = {
  init: () => {
    if (typeof window !== 'undefined' && import.meta.env.MODE !== 'test') {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        autocapture: true, // Automatically tracks clicks and inputs
        capture_pageview: true, // Automatically tracks route changes
        capture_pageleave: true, 
      });
    }
  },

  identify: (userId: string, properties?: Record<string, any>) => {
    posthog.identify(userId, properties);
  },

  reset: () => {
    posthog.reset();
  },

  track: (eventName: string, properties?: Record<string, any>) => {
    posthog.capture(eventName, properties);
  },
  
  // Specific Core Events for Retention & Growth
  trackOnboardingStep: (stepNumber: number, stepName: string) => {
    posthog.capture('Onboarding Step Completed', { step: stepNumber, stepName });
  },

  trackCoreAction: (actionType: 'generate_deck' | 'study_session' | 'chat_message', details?: any) => {
    posthog.capture(`Core Action: ${actionType}`, details);
  },
  
  trackSubscription: (status: string, plan: string) => {
    posthog.capture('Subscription Change', { status, plan });
  }
};
