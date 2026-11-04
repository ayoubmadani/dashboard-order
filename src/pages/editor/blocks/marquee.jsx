import { useEffect, useRef, useState } from 'react';

// نص متحرك (عنصر النص العائم في المحرر): نسخ من النص تدخل من طرف الشريط وتخرج من الآخر بلا انقطاع.
// نفس الملف في المتجر: mdstore-store/src/components/builderPages/marquee.ts + MarqueeTrack.tsx — عدّلهما معاً.
//
// «عدد النسخ» N = كم نسخة على عرض الشريط، والمسافة بين بدايات النسخ = max(عرض الشريط ÷ N، طول النص + مسافة):
//   N=1 ← حين تبدأ نسخة بالخروج تبدأ التالية بالدخول؛ N=2 ← واحدة تخرج، واحدة في المنتصف، وواحدة تدخل.
//   النص الطويل يأخذ مسافته كاملة فلا تتداخل النسخ ولا يُقص.
// الشريط يتحرك مسافة نسخة واحدة ثم يعيد (النسخ متطابقة فلا يظهر الرجوع). عرض الشريط وطول النص يُقاسان في المتصفح.
// لا حركة لمن فعّل «تقليل الحركة» في جهازه.

export const MARQUEE_DIRECTIONS = ['none', 'rtl', 'ltr'];

export const MARQUEE_CSS = `
@keyframes md-marquee-rtl { from { transform: translateX(0); } to { transform: translateX(calc(-1 * var(--md-mq-shift))); } }
@keyframes md-marquee-ltr { from { transform: translateX(calc(-1 * var(--md-mq-shift))); } to { transform: translateX(0); } }
@media (prefers-reduced-motion: reduce) { .md-marquee-track { animation: none !important; } }
`;

/** null = نص عادي؛ وإلا الاتجاه (rtl: يدخل من اليمين ويخرج من اليسار، ltr: العكس) والثواني لعبور الشريط مرة */
export function marqueeOf(el) {
  const dir = el?.marquee;
  if (dir !== 'rtl' && dir !== 'ltr') return null;
  return { dir, seconds: Math.min(60, Math.max(3, Number(el.marqueeSpeed) || 12)) };
}

/** عدد النسخ على عرض الشريط (1..10، الافتراضي 1) */
export function marqueeRepeat(el) {
  return Math.min(10, Math.max(1, Math.round(Number(el?.marqueeRepeat) || 1)));
}

/**
 * band: عرض الشريط، text: طول النص، gap: أقل مسافة بعد النص — كلها px.
 * spacing: المسافة بين بدايات النسخ، count: عدد النسخ اللازم ليمتلئ الشريط أثناء الحركة،
 * duration: ثوانٍ لتحرك نسخة واحدة (نفس سرعة «عبور الشريط في seconds»).
 */
export function marqueeLayout({ band, text, gap, repeat, seconds }) {
  if (!(band > 0)) return null;
  const spacing = Math.max(band / repeat, text + gap);
  return {
    spacing: Math.round(spacing * 100) / 100,
    count: Math.ceil(band / spacing) + 1,
    duration: Math.round(((seconds * spacing) / band) * 100) / 100,
  };
}

// شريط النص المتحرك — يقيس عرض الشريط وطول النص ثم يوزّع النسخ
export function MarqueeTrack({ text, dir, seconds, repeat = 1 }) {
  const bandRef = useRef(null);
  const textRef = useRef(null);
  const gapRef = useRef(null);
  const [size, setSize] = useState({ band: 0, text: 0, gap: 0 });

  useEffect(() => {
    const measure = () => setSize({
      band: bandRef.current?.clientWidth || 0,
      text: textRef.current?.offsetWidth || 0,
      gap: gapRef.current?.offsetWidth || 0,
    });
    measure();
    const ro = new ResizeObserver(measure);
    if (bandRef.current) ro.observe(bandRef.current);
    if (textRef.current) ro.observe(textRef.current);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [text]);

  const layout = marqueeLayout({ ...size, repeat, seconds });
  const gapEl = <span style={{ paddingInline: '0.9em' }} />; // أقل مسافة بين نسختين

  return (
    <div ref={bandRef} style={{ width: '100%', overflow: 'hidden', position: 'relative', direction: 'ltr' }}>
      {/* direction ltr: في صفحة عربية يلتصق الشريط الأعرض من الإطار باليمين فتختفي النسخ — النص العربي داخله يبقى سليماً (dir=auto) */}
      <style>{MARQUEE_CSS}</style>
      {/* قياس طول النص والمسافة (غير مرئي) */}
      <span aria-hidden="true" style={{ position: 'absolute', visibility: 'hidden', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
        <span ref={textRef} dir="auto" style={{ unicodeBidi: 'isolate' }}>{text}</span>
        <span ref={gapRef}>{gapEl}</span>
      </span>
      {layout ? (
        <div
          className="md-marquee-track"
          style={{
            display: 'flex', width: 'max-content', direction: 'ltr', willChange: 'transform',
            '--md-mq-shift': `${layout.spacing}px`,
            animation: `md-marquee-${dir} ${layout.duration}s linear infinite`,
          }}
        >
          {Array.from({ length: layout.count }, (_, i) => (
            // النص في الطرف الذي يدخل منه: بداية الخانة عند الحركة لليسار، نهايتها عند الحركة لليمين
            <span key={i} style={{ width: layout.spacing, flexShrink: 0, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', flexDirection: dir === 'ltr' ? 'row-reverse' : 'row' }}>
              <span dir="auto" style={{ unicodeBidi: 'isolate' }}>{text}</span>
            </span>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{text}</div>
      )}
    </div>
  );
}
