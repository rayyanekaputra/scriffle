'use client';

import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export const MingIcon: React.FC<IconProps> = ({ name, size = 18, className = '' }) => {
  return (
    <i
      className={`mgc_${name} inline-flex items-center justify-center not-italic leading-none before:!text-current ${className}`}
      style={{ fontSize: `${size}px` }}
    />
  );
};
