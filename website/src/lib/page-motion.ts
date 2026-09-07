import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { initSmoothScroll } from './smooth-scroll';

gsap.registerPlugin(ScrollTrigger, SplitText);

export function initPageMotion() {
  initSmoothScroll();
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    const titles = Array.from(document.querySelectorAll<HTMLElement>('h1, .section-heading h2, .tour-intro h2, .about-copy h2, .enquiry-copy h2'));
    const splits = titles.map(title => {
      title.setAttribute('aria-label', title.innerText.replace(/\s+/g, ' ').trim());
      return SplitText.create(title, {
      aria: 'none',
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit(split) {
        return gsap.from(split.lines, {
          yPercent: 105, duration: .8, stagger: .09, ease: 'power3.out',
          scrollTrigger: { trigger: title, start: 'top 94%', once: true },
        });
      },
    });
    });
    gsap.from('.hero-image', { clipPath: 'inset(0 3% 0 3%)', duration: 1, ease: 'power3.out', clearProps: 'clipPath' });
    gsap.from('.hero-description, .hero-foot', { opacity: 0, y: 12, duration: .65, delay: .15, stagger: .1, clearProps: 'opacity,transform' });
    gsap.utils.toArray<HTMLElement>('.facts-grid > div, .gallery-card').forEach(element => {
      gsap.from(element, { opacity: .25, y: 22, duration: .65, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 96%', once: true }, clearProps: 'opacity,transform' });
    });
    return () => splits.forEach(split => split.revert());
  });
  media.add('(min-width: 900px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.to('.hero-image img', { scale: 1.055, ease: 'none', scrollTrigger: { trigger: '.hero-image', start: 'top 45%', end: 'bottom top', scrub: true } });
    gsap.to('.hero-heading', { y: -32, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero-image', start: 'top 40%', end: 'top top', scrub: true } });
    gsap.fromTo('.about-image img', { yPercent: -3, scale: 1.08 }, { yPercent: 3, ease: 'none', scrollTrigger: { trigger: '.about-image', start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  const refresh = () => ScrollTrigger.refresh();
  document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh, { once: true });
  document.addEventListener('astro:before-swap', () => { media.revert(); window.removeEventListener('load', refresh); }, { once: true });
}
