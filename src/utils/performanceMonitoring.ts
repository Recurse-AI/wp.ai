/**
 * Performance monitoring utility for tracking navigation and page load metrics
 */

export interface NavigationTiming {
  url: string;
  startTime: number;
  duration: number;
  type: 'push' | 'replace' | 'back' | 'forward' | 'prefetch' | 'unknown';
}

export interface PageLoadMetrics {
  url: string;
  ttfb: number; // Time to First Byte
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  ttl: number; // Time to Load
}

// Web Performance API interface extensions
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

// Store recent navigation timings for analysis
const navigationTimings: NavigationTiming[] = [];
const MAX_TIMINGS = 20;

// Store page load metrics
const pageLoadMetrics: Record<string, PageLoadMetrics> = {};

/**
 * Record a navigation timing event
 */
export function recordNavigation(url: string, duration: number, type: NavigationTiming['type'] = 'unknown') {
  const timing: NavigationTiming = {
    url,
    startTime: Date.now() - duration,
    duration,
    type,
  };
  
  // Add to the beginning of the array and keep only MAX_TIMINGS items
  navigationTimings.unshift(timing);
  if (navigationTimings.length > MAX_TIMINGS) {
    navigationTimings.pop();
  }
  
  // Log slow navigations (> 300ms)
  if (duration > 300) {
    console.warn(`[Performance] Slow navigation to ${url}: ${duration.toFixed(0)}ms`);
  }
  
  return timing;
}

/**
 * Get recent navigation timings
 */
export function getNavigationTimings(): NavigationTiming[] {
  return [...navigationTimings];
}

/**
 * Get timings for a specific URL
 */
export function getNavigationTimingsForUrl(url: string): NavigationTiming[] {
  return navigationTimings.filter(timing => timing.url === url);
}

/**
 * Calculate average navigation time for a URL
 */
export function getAverageNavigationTime(url: string): number | null {
  const timings = getNavigationTimingsForUrl(url);
  if (timings.length === 0) return null;
  
  const sum = timings.reduce((acc, timing) => acc + timing.duration, 0);
  return sum / timings.length;
}

/**
 * Record page load metrics
 */
export function recordPageLoadMetrics(metrics: PageLoadMetrics) {
  pageLoadMetrics[metrics.url] = metrics;
  
  // Log poor page load performance
  if (metrics.fcp > 1000 || metrics.lcp > 2500 || metrics.cls > 0.1) {
    console.warn(`[Performance] Poor page load metrics for ${metrics.url}:`, {
      FCP: `${metrics.fcp.toFixed(0)}ms`,
      LCP: `${metrics.lcp.toFixed(0)}ms`,
      CLS: metrics.cls.toFixed(3),
    });
  }
}

/**
 * Get page load metrics for a URL
 */
export function getPageLoadMetrics(url: string): PageLoadMetrics | null {
  return pageLoadMetrics[url] || null;
}

// Track navigation via history API overrides
// Called directly without React, avoids "useInsertionEffect must not schedule updates" error
function setupHistoryMonitoring() {
  if (typeof window === 'undefined') return;
  
  // Store original methods before overriding
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  // Override pushState to record navigation timing
  history.pushState = function(state, title, url) {
    const startTime = performance.now();
    originalPushState.call(this, state, title, url);
    const duration = performance.now() - startTime;
    
    if (url) {
      recordNavigation(url.toString(), duration, 'push');
    }
  };
  
  // Override replaceState to record navigation timing
  history.replaceState = function(state, title, url) {
    const startTime = performance.now();
    originalReplaceState.call(this, state, title, url);
    const duration = performance.now() - startTime;
    
    if (url) {
      recordNavigation(url.toString(), duration, 'replace');
    }
  };
  
  // Track back/forward navigation
  window.addEventListener('popstate', () => {
    recordNavigation(window.location.href, 0, 'back');
  });
}

// Setup page load performance monitoring
function setupPerformanceObservers() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
  
  try {
    // First Contentful Paint
    new PerformanceObserver((entries) => {
      const fcp = entries.getEntries()[0];
      if (fcp && pageLoadMetrics[window.location.href]) {
        pageLoadMetrics[window.location.href].fcp = fcp.startTime;
      }
    }).observe({ type: 'paint', buffered: true });
    
    // Largest Contentful Paint
    new PerformanceObserver((entries) => {
      const lcp = entries.getEntries()[0];
      if (lcp && pageLoadMetrics[window.location.href]) {
        pageLoadMetrics[window.location.href].lcp = lcp.startTime;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    
    // Cumulative Layout Shift
    new PerformanceObserver((entries) => {
      let clsValue = 0;
      for (const entry of entries.getEntries()) {
        // Use proper type assertion for layout shift entries
        const layoutShift = entry as LayoutShiftEntry;
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
        }
      }
      
      if (pageLoadMetrics[window.location.href]) {
        pageLoadMetrics[window.location.href].cls = clsValue;
      }
    }).observe({ type: 'layout-shift', buffered: true });
    
    // First Input Delay
    new PerformanceObserver((entries) => {
      const firstEntry = entries.getEntries()[0];
      if (firstEntry && pageLoadMetrics[window.location.href]) {
        // Use proper type assertion for first input entries
        const firstInput = firstEntry as FirstInputEntry;
        pageLoadMetrics[window.location.href].fid = firstInput.processingStart - firstInput.startTime;
      }
    }).observe({ type: 'first-input', buffered: true });
  } catch (err) {
    console.error('[Performance] Failed to initialize performance observers:', err);
  }
}

/**
 * Initialize performance monitoring
 * Call this once at application startup
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;
  
  try {
    // Set up initial page metrics
    const url = window.location.href;
    pageLoadMetrics[url] = {
      url,
      ttfb: 0,
      fcp: 0,
      lcp: 0,
      cls: 0,
      fid: 0,
      ttl: 0,
    };
    
    // Record TTFB for initial page
    if (performance.getEntriesByType) {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        pageLoadMetrics[url].ttfb = navEntry.responseStart;
        pageLoadMetrics[url].ttl = navEntry.loadEventEnd;
      }
    }
    
    // Run setup functions that don't involve React effects
    setupHistoryMonitoring();
    setupPerformanceObservers();
    
    console.log('[Performance] Monitoring initialized');
  } catch (err) {
    console.error('[Performance] Failed to initialize monitoring:', err);
  }
} 