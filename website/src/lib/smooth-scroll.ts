import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
export const smoothingEvent = 'lotos:smoothing';
let media: ReturnType<typeof gsap.matchMedia> | undefined;

// Called by both the page and the tour: smoothing must precede their triggers,
// regardless of the order in which Astro scripts and React hydration run.
export function initSmoothScroll() {
  if (media) return;
  media = gsap.matchMedia();
  media.add('(min-width: 900px) and (min-height: 700px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    const smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper', content: '#smooth-content',
      smooth: .7, smoothTouch: false, effects: false,
      onFocusIn: (_self, event) => {
        const target = event.target as Element;
        // Programmatic section/tour focus already has an explicit destination.
        // Keep Smoother's default reveal for normal keyboard tab navigation.
        if (target.getAttribute('tabindex') === '-1' || !document.querySelector('#smooth-content')?.contains(target)) return false;
      },
    });
    document.documentElement.classList.add('has-smoothing');
    window.dispatchEvent(new Event(smoothingEvent));
    const anchor = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link || link.hasAttribute('data-room-tour') || link.target || link.hasAttribute('download')) return;
      const hash = link.getAttribute('href')!;
      const target = hash === '#' ? null : document.getElementById(decodeURIComponent(hash.slice(1)));
      if (hash !== '#' && !target) return;
      event.preventDefault();
      history.pushState(null, '', hash);
      if (target) {
        if (!target.hasAttribute('tabindex')) {
          target.tabIndex = -1;
          target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
        }
        target.focus({ preventScroll: true });
      }
      smoother.scrollTo(target ?? 0, true, 'top 24px');
    };
    document.addEventListener('click', anchor);
    return () => {
      document.removeEventListener('click', anchor);
      smoother.kill();
      document.documentElement.classList.remove('has-smoothing');
      window.dispatchEvent(new Event(smoothingEvent));
    };
  });
  document.addEventListener('astro:before-swap', () => { media?.revert(); media = undefined; }, { once: true });
}

export function scrollImmediately(top: number | HTMLElement) {
  const smoother = ScrollSmoother.get();
  if (smoother) smoother.scrollTo(top, false, 'top top');
  else if (typeof top === 'number') window.scrollTo({ top, behavior: 'instant' });
  else top.scrollIntoView({ behavior: 'instant', block: 'start' });
  ScrollTrigger.update();
}

export function pauseSmoothScroll(paused: boolean) {
  ScrollSmoother.get()?.paused(paused);
}
