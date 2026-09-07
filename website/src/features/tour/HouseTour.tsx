import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { LatestSeek, sceneForTime, scrollForTime, timeForProgress } from './timeline';
import { chapters, chapterForScene, sceneEntryTime, sceneIndexForId, tourSceneEvent } from './navigation';
import tour from '@/data/tour.json';
import { initSmoothScroll, scrollImmediately, smoothingEvent } from '../../lib/smooth-scroll';

gsap.registerPlugin(ScrollTrigger);

export default function HouseTour() {
  const track = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null), caption = useRef<HTMLDivElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const restoreScene = useRef<number | null>(null), currentIndex = useRef(0);
  const [enhanced, setEnhanced] = useState(false), [reduced, setReduced] = useState(false);
  const [photos, setPhotos] = useState(false), [source, setSource] = useState<string>();
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  const [index, setIndex] = useState(0), [progress, setProgress] = useState(0);
  const [smoothing, setSmoothing] = useState(false);
  const photoMode = reduced || photos || failed;
  const scene = tour.scenes[index]!, chapter = chapterForScene(index);

  useEffect(() => {
    initSmoothScroll();
    const updateSmoothing = () => setSmoothing(document.documentElement.classList.contains('has-smoothing'));
    updateSmoothing();
    window.addEventListener(smoothingEvent, updateSmoothing);
    return () => window.removeEventListener(smoothingEvent, updateSmoothing);
  }, []);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { restoreScene.current = currentIndex.current; setReduced(preference.matches); };
    setReduced(preference.matches); setEnhanced(true);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!enhanced || !caption.current) return;
    const context = gsap.context(() => {
      if (!reduced) gsap.fromTo(caption.current, { opacity: 0, y: 14 }, {
        opacity: 1, y: 0, duration: .32, ease: 'power2.out', clearProps: 'opacity,transform',
      });
    });
    return () => context.revert();
  }, [index, enhanced, reduced]);

  useEffect(() => {
    if (!track.current || !enhanced || photoMode || source) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setSource(window.matchMedia('(max-width: 767px)').matches ? tour.mobile : tour.desktop);
        observer.disconnect();
      }
    }, { rootMargin: '600px' });
    observer.observe(track.current);
    return () => observer.disconnect();
  }, [enhanced, photoMode, source]);

  const go = useCallback((nextIndex: number) => {
    const next = Math.max(0, Math.min(tour.scenes.length - 1, nextIndex));
    if (photoMode) {
      currentIndex.current = next; setIndex(next); setProgress(next / (tour.scenes.length - 1)); return;
    }
    const element = track.current, pinned = stage.current;
    if (!element || !pinned) return;
    const start = trigger.current?.start ?? element.getBoundingClientRect().top + window.scrollY;
    scrollImmediately(scrollForTime(sceneEntryTime(next), tour.duration, start, element.offsetHeight - pinned.offsetHeight));
  }, [photoMode]);

  useEffect(() => {
    const element = track.current, pinned = stage.current, player = video.current;
    if (!element || !pinned || !enhanced || photoMode || !player) return;
    const controller = new LatestSeek(player);
    const update = (self: ScrollTrigger) => {
      const time = timeForProgress(self.progress, tour.duration, tour.fps);
      const next = sceneForTime(time, tour.scenes, tour.transition);
      currentIndex.current = next; setProgress(self.progress); setIndex(next); controller.request(time);
    };
    const scroll = ScrollTrigger.create({
      trigger: element, start: 'top top',
      pin: smoothing ? pinned : false, pinSpacing: false,
      end: () => `+=${Math.max(1, element.offsetHeight - pinned.offsetHeight)}`,
      onUpdate: update, onRefresh: update,
    });
    trigger.current = scroll;
    const loaded = () => { setReady(true); update(scroll); };
    const flush = () => controller.flush();
    player.addEventListener('loadeddata', loaded); player.addEventListener('canplay', loaded); player.addEventListener('seeked', flush);
    const initialFrame = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      if (restoreScene.current !== null) {
        const next = restoreScene.current; restoreScene.current = null; go(next);
      } else update(scroll);
    });
    let raf = 0;
    const resize = new ResizeObserver(() => {
      cancelAnimationFrame(raf); raf = requestAnimationFrame(() => scroll.refresh());
    });
    resize.observe(element); resize.observe(pinned);
    if (player.readyState >= 2) loaded();
    return () => {
      cancelAnimationFrame(initialFrame); cancelAnimationFrame(raf); resize.disconnect(); scroll.kill(); trigger.current = null; controller.dispose();
      player.removeEventListener('loadeddata', loaded); player.removeEventListener('canplay', loaded); player.removeEventListener('seeked', flush);
    };
  }, [enhanced, photoMode, source, go, smoothing]);

  useEffect(() => {
    if (!enhanced || photoMode || !track.current) return;
    const motion = gsap.matchMedia();
    motion.add('(min-width: 900px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)', () => {
      // Only the image moves; controls and captions never inherit a faded state.
      const screen = track.current!.querySelector('.tour-screen');
      gsap.fromTo(screen, { clipPath: 'inset(0 3% 0 3%)' }, {
        clipPath: 'inset(0 0% 0 0%)', ease: 'none',
        scrollTrigger: { trigger: track.current, start: 'top 85%', end: 'top top', scrub: true },
      });
      gsap.to(screen, { y: 80, ease: 'none', scrollTrigger: { trigger: '#plan', start: 'top bottom', end: 'top 20%', scrub: true } });
    });
    return () => motion.revert();
  }, [enhanced, photoMode, smoothing]);

  useEffect(() => {
    if (!photoMode || !enhanced) return;
    setReady(false);
    const selected = restoreScene.current ?? currentIndex.current;
    currentIndex.current = selected; setIndex(selected); setProgress(selected / (tour.scenes.length - 1));
    const raf = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      if (restoreScene.current !== null && track.current) scrollImmediately(track.current);
      restoreScene.current = null;
    });
    return () => cancelAnimationFrame(raf);
  }, [photoMode, enhanced]);

  useEffect(() => {
    const select = (event: Event) => {
      const next = sceneIndexForId((event as CustomEvent<string>).detail);
      if (next < 0) return;
      go(next);
      if (photoMode && track.current) scrollImmediately(track.current);
      stage.current?.focus({ preventScroll: true });
    };
    window.addEventListener(tourSceneEvent, select);
    return () => window.removeEventListener(tourSceneEvent, select);
  }, [go, photoMode]);

  function togglePhotos() { restoreScene.current = index; setPhotos(!photos); }

  return <div className="tour-track" ref={track} data-mode={photoMode ? 'photos' : 'scroll'}>
    <div className="tour-stage" ref={stage} tabIndex={-1} aria-label="Прогулка по дому">
      <div className="tour-visual">
        <div className="tour-topline"><span className="eyebrow">TAN HOUSE / ВНУТРИ И СНАРУЖИ</span><a href="#plan">К планировке <ArrowDown size={14} /></a></div>
        <div className="tour-screen">
          <img className="tour-poster" src={scene.poster} alt={scene.name} width="1280" height="720" style={{ visibility: !photoMode && ready ? 'hidden' : 'visible' }} />
          {!photoMode && <video ref={video} src={source} muted playsInline preload="auto" aria-label="Экскурсия по дому, управляемая прокруткой страницы" onError={() => { restoreScene.current = index; setFailed(true); }} style={{ opacity: ready ? 1 : 0 }} />}
          {!ready && !photoMode && enhanced && <div className="loading-note" role="status">Подготавливаем прогулку… <button onClick={togglePhotos}>Смотреть изображения</button></div>}
        </div>
        <div className="tour-caption-row">
          <div ref={caption} className="scene-caption"><p className="eyebrow">{String(index + 1).padStart(2, '0')} / 14 · {chapters[chapter]!.name}</p><h3>{scene.name}</h3><p>{scene.subtitle}</p></div>
          {enhanced && <div className="tour-step-buttons"><button className="icon-button" aria-label="Предыдущая комната" disabled={index === 0} onClick={() => go(index - 1)}><ChevronLeft /></button><button className="icon-button" aria-label="Следующая комната" disabled={index === 13} onClick={() => go(index + 1)}><ChevronRight /></button></div>}
        </div>
        {enhanced && <nav className="tour-chapters" aria-label="Главы экскурсии">{chapters.map((entry, i) => <button key={entry.name} aria-current={i === chapter ? 'step' : undefined} onClick={() => go(entry.start)}><span>{String(i + 1).padStart(2, '0')}</span>{entry.name}</button>)}</nav>}
        <div className="tour-progress" role="progressbar" aria-label="Прогресс экскурсии" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}><span style={{ transform: `scaleX(${progress})` }} /></div>
        {enhanced && <div className="tour-controls"><label className="room-select"><span>Выбрать комнату</span><select value={index} aria-label="Выбрать комнату" onChange={event => go(Number(event.target.value))}>{tour.scenes.map((entry, i) => <option key={entry.id} value={i}>{entry.name}</option>)}</select></label>
          {!reduced && !failed && <button className="photo-toggle" onClick={togglePhotos} aria-pressed={photos}><Images size={16} />{photos ? 'К видео' : 'Фото-режим'}</button>}
        </div>}
        {failed && <p className="media-error" role="status">Видео не загрузилось. Все комнаты доступны в фото-режиме.</p>}
        {!enhanced && <p className="static-hint">Все помещения доступны в <a href="#gallery">галерее визуализаций ↓</a></p>}
      </div>
    </div>
  </div>;
}
