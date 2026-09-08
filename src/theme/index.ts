import { Colors } from './colors';
import { Typography } from './typography';
import { Spacing } from './spacing';

export { Colors } from './colors';
export { Typography } from './typography';
export { Spacing } from './spacing';
export { useTheme, useThemeStore, LightColors, DarkColors } from '../stores/themeStore';

export const theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
};

export default theme;
