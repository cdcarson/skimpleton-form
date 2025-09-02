import type { Snippet } from 'svelte';
import { sineInOut } from 'svelte/easing';

export type CloseRouteActionModalFn = () => void;

export type RouteActionModalCloseOptions = {
  closeModal: CloseRouteActionModalFn;
  closeHref: string;
  closeDisabled?: boolean;
};

export const modalSizes = [
  'tiny',
  'small',
  'medium',
  'large',
  'extra-large'
] as const;
export type ModalSize = (typeof modalSizes)[number];

export const modalPositions = [
  'left',
  'right',
  'top',
  'bottom',
  'centered',
  'fullscreen'
] as const;
export type ModalPosition = (typeof modalPositions)[number];

export type ModalDisplayOptions = {
  hideBackdrop?: boolean;
  animationDuration?: number;
  position?: ModalPosition;
  size?: ModalSize;
  dismissOnOutsideClick?: boolean;
};

export const getModalSlide = (position: ModalPosition) => {
  return (_el: HTMLElement, opts: { duration: number }) => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const calculatedDuration =
      mediaQuery && mediaQuery.matches ? 0 : opts.duration;
    return {
      delay: 0,
      duration: calculatedDuration,
      css: (t: number) => {
        let tyPct = 100 - sineInOut(t) * 100;
        if (tyPct > 99.7) {
          tyPct = 100;
        } else if (tyPct < 0.3) {
          tyPct = 0;
        }
        if (position === 'left') {
          return `transform: translateX(-${tyPct}%)`;
        } else if (position === 'right') {
          return `transform: translateX(${tyPct}%)`;
        } else if (position === 'top') {
          return `transform: translateY(-${tyPct}%)`;
        }
        return `transform: translateY(${tyPct}%)`;
      }
    };
  };
};

export const backdropFade = (node: HTMLElement, opts: { duration: number }) => {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const calculatedDuration =
    mediaQuery && mediaQuery.matches ? 0 : opts.duration;
  const o = +getComputedStyle(node).opacity;
  return {
    duration: calculatedDuration,
    css: (t: number) => `opacity: ${sineInOut(t) * o}`
  };
};

export type ModalLayoutProps = {
  header: string | Snippet;
  footer?: Snippet;
  position?: ModalPosition;
  cancelUrl?: string;
  closeDisabled?: boolean;
  size?: ModalSize;
};
