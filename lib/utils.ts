import { clsx, type ClassValue } from 'clsx';
import { getColors } from 'react-native-image-colors';
import { twMerge } from 'tailwind-merge';

// Function to merge classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to get colors from an image, and return the corrects for each platform
export async function getImageColors(url: string) {
  const result = await getColors(url, {
    cache: true,
    key: 'image-colors-' + url,
  });
  // Return the correct colors for each platform - An array of colors HEX
  switch (result.platform) {
    case 'android':
      return [result.vibrant, result.dominant, result.darkVibrant]
    case 'ios':
      return [result.background, result.detail, result.primary, result.secondary]
    default:
      throw new Error('Unexpected platform')
  }


  // return an array of all the colors of the result
  // return Object.values(result);
}