import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { gsap } from 'gsap';

export default function DemoEnquiry() {
  const [ready, setReady] = useState(false);
  const [stage, setStage] = useState<'idle' | 'sending' | 'success'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const success = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    setReady(true);
    return () => clearTimeout(timer.current);
  }, []);
  useEffect(() => {
    if (stage !== 'success' || !success.current) return;
    success.current.focus({ preventScroll: true });
    const motion = gsap.matchMedia();
    motion.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(success.current!.parentElement, { opacity: 0, y: 12, duration: .35, clearProps: 'opacity,transform' });
    });
    return () => motion.revert();
  }, [stage]);

  return <div className="enquiry-card">
    <span className="enquiry-badge">Демо-форма</span>
    {stage === 'success' ? <div className="enquiry-success">
      <span className="enquiry-check"><Check size={28} aria-hidden="true" /></span>
      <h3 ref={success} tabIndex={-1}>Демо-заявка отправлена</h3>
      <p>Вот так будет выглядеть первый шаг к вашему дому.</p>
      <p className="enquiry-note">Это демонстрация: данные никуда не отправлены и не сохранены. Для настоящих заявок мы подключим отправку менеджеру.</p>
      <Button variant="outline" size="lg" onClick={() => setStage('idle')}>Заполнить ещё раз</Button>
    </div> : <form aria-label="Заявка на строительство дома" aria-describedby="enquiry-demo-note" onSubmit={event => {
      event.preventDefault();
      if (!ready || stage !== 'idle') return;
      setStage('sending');
      timer.current = setTimeout(() => setStage('success'), 800);
    }}>
      <h3>Обсудить строительство</h3>
      <p className="enquiry-subtitle">Начнём с вашего имени и места, где появится дом.</p>
      <fieldset disabled={!ready || stage === 'sending'}>
        <div className="enquiry-field"><Label htmlFor="enquiry-name">Ваше имя *</Label><Input id="enquiry-name" autoComplete="given-name" placeholder="Как к вам обращаться" required maxLength={80} pattern=".*\S.*" title="Введите ваше имя" /></div>
        <div className="enquiry-field"><Label htmlFor="enquiry-phone">Телефон *</Label><Input id="enquiry-phone" type="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" required maxLength={30} pattern={'\\+?(?:[\\s\\(\\)\\-]*[0-9]){10,15}[\\s\\(\\)\\-]*'} title="Введите номер: от 10 до 15 цифр. Можно использовать +, пробелы, скобки и дефисы." /><small>Номер с кодом страны</small></div>
        <div className="enquiry-field"><Label htmlFor="enquiry-city">Город строительства <span>необязательно</span></Label><Input id="enquiry-city" autoComplete="address-level2" placeholder="Где хотите построить дом" maxLength={100} /></div>
        <Button type="submit" size="lg">{stage === 'sending' ? <>Отправляем… <LoaderCircle className="animate-spin" aria-hidden="true" /></> : <>Хочу такой дом <ArrowUpRight aria-hidden="true" /></>}</Button>
      </fieldset>
      <p id="enquiry-demo-note" className="enquiry-note">Демонстрация заявки. Можно указать вымышленные данные — они никуда не отправляются и не сохраняются.</p>
      <noscript><p className="enquiry-note">Для демонстрации формы включите JavaScript.</p></noscript>
    </form>}
  </div>;
}
