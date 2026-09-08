import React from 'react';
import { ProgressScreen } from '../progress/ProgressScreen';

export const HealthScreen: React.FC<{ navigation?: any }> = (props) => {
  return <ProgressScreen {...props} />;
};
