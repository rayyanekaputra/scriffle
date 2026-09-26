'use client';

import React from 'react';
import { SpotlightOverlay } from './SpotlightOverlay';
import { TourCardPopover } from './TourCardPopover';
import { ResumeTourPill } from './ResumeTourPill';

export const OnboardingTour: React.FC = () => {
  return (
    <>
      <SpotlightOverlay />
      <TourCardPopover />
      <ResumeTourPill />
    </>
  );
};
