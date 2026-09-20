import { useState, useEffect } from 'react';

export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface BreakpointState {
  breakpoint: BreakpointKey;
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /**
   * Specifically detects screen sizes (>= 1280px / xl) equipped for
   * high-concurrency desktop audit dashboards with multi-column telemetry.
   */
  isHighConcurrencyAudit: boolean;
  isAtLeast: (bp: BreakpointKey) => boolean;
  isBelow: (bp: BreakpointKey) => boolean;
}

const BREAKPOINT_VALUES: Record<BreakpointKey, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

const BREAKPOINT_ORDER: BreakpointKey[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

function getBreakpointKey(width: number): BreakpointKey {
  if (width >= BREAKPOINT_VALUES['2xl']) return '2xl';
  if (width >= BREAKPOINT_VALUES.xl) return 'xl';
  if (width >= BREAKPOINT_VALUES.lg) return 'lg';
  if (width >= BREAKPOINT_VALUES.md) return 'md';
  if (width >= BREAKPOINT_VALUES.sm) return 'sm';
  return 'xs';
}

/**
 * Custom hook to detect screen size changes in real-time.
 * Enables the UI to adapt fluidly between mobile-first layouts
 * and high-concurrency desktop audit views.
 */
export function useBreakpoint(): BreakpointState {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>(() => {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 1280, height: 800 };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let frameId: number | null = null;

    const handleResize = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    // Trigger initial check
    handleResize();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const bpKey = getBreakpointKey(dimensions.width);
  const currentOrderIdx = BREAKPOINT_ORDER.indexOf(bpKey);

  const isAtLeast = (target: BreakpointKey) => {
    const targetIdx = BREAKPOINT_ORDER.indexOf(target);
    return currentOrderIdx >= targetIdx;
  };

  const isBelow = (target: BreakpointKey) => {
    const targetIdx = BREAKPOINT_ORDER.indexOf(target);
    return currentOrderIdx < targetIdx;
  };

  return {
    breakpoint: bpKey,
    width: dimensions.width,
    height: dimensions.height,
    isMobile: dimensions.width < 768,
    isTablet: dimensions.width >= 768 && dimensions.width < 1024,
    isDesktop: dimensions.width >= 1024,
    isHighConcurrencyAudit: dimensions.width >= 1280,
    isAtLeast,
    isBelow,
  };
}
