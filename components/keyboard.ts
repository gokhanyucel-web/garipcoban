import React from 'react';

// Makes a role="button" element operable by keyboard: fire `fn` on Enter/Space.
export const onActivateKey = (fn: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};
