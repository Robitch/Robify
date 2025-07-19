import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';
import { NAV_THEME } from '~/lib/constants';

export async function setAndroidNavigationBar(theme: 'light' | 'dark') {
  if (Platform.OS !== 'android') return;
  
  try {
    // Set navigation bar style (buttons color)
    await NavigationBar.setButtonStyleAsync(theme === 'dark' ? 'light' : 'dark');
    
    // Set navigation bar background color based on theme
    const backgroundColor = theme === 'dark' ? NAV_THEME.dark.background : NAV_THEME.light.background;
    await NavigationBar.setBackgroundColorAsync(backgroundColor);
    
    // Set navigation bar position
    await NavigationBar.setPositionAsync('absolute');
  } catch (error) {
    console.log('Error setting Android navigation bar:', error);
  }
}
