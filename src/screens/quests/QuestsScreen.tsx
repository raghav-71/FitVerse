import React from 'react';
import { ChallengesScreen } from '../challenges/ChallengesScreen';

export const QuestsScreen: React.FC<{ navigation?: any }> = (props) => {
  return <ChallengesScreen {...props} />;
};
