/**
 * Custom hook for using IntersectionObserver
 * This hook provides a way to observe when an element enters the viewport
 */

import { useState, useEffect, RefObject } from 'react';

interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
}

/**
 * Hook that tracks whether an element is in the viewport
 * @param elementRef - Reference to the element to observe
 * @param options - IntersectionObserver options
 * @returns Whether the element is in the viewport
 */
export function useIntersectionObserver(
  elementRef: RefObject<Element>,
  {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    once = false,
  }: IntersectionObserverOptions = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Skip observation if already intersected and once is true
    if (isIntersecting && once) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);

        // Unobserve after first intersection if once is true
        if (isElementIntersecting && once && element) {
          observer.unobserve(element);
        }
      },
      { root, rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [elementRef, root, rootMargin, threshold, once, isIntersecting]);

  return isIntersecting;
}
