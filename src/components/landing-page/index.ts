// Only export HeroSection directly as it's critical for initial render
export { default as HeroSection } from './HeroSection';

// Export types and data
export * from './types';
export * from './data';

// Note: All other components are now dynamically imported directly in the page component
// to enable proper lazy loading and code splitting 