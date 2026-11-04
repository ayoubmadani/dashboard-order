// صفحة صور احترافية: تجهيز الصور في المتصفح ← تصميم Claude ← تصوير الأقسام ← رفعها ← بلوكات المحرر.
// retryCapture يعيد التصوير والرفع فقط بنفس التصميم (بلا طلب Claude جديد ولا احتساب).
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import { componentsMap } from '../blocks/componentsMap';
import { downscale, removeBackgroundCached, extractPalette, extractBackgroundPalette, blobToDataUrl } from './prep';
import { fillPlaceholders, captureSections } from './capture';

const authHeaders = () => ({ Authorization: `Bearer ${getAccessToken()}` });
// رقم واتساب المتجر (إعدادات المتجر) — لأزرار واتساب التي يقترحها الذكاء الاصطناعي
const storeWhatsapp = () => {
  const storeId = localStorage.getItem('storeId');
  if (!storeId) return Promise.resolve('');
  return axios.get(`${baseURL}/stores/${storeId}`, { headers: authHeaders() })
    .then((r) => String(r.data?.data?.contact?.whatsapp || r.data?.contact?.whatsapp || '').trim())
    .catch(() => '');
};

const uuid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// حد جسم الطلب في Vercel 4.5MB — نرفع الأقسام على دفعات أصغر من ذلك
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;

export function chunkBySize(blobs, max = MAX_UPLOAD_BYTES) {
  const chunks = [];
  blobs.forEach((blob, i) => {
    const last = chunks[chunks.length - 1];
    const size = last ? last.items.reduce((n, x) => n + x.size, 0) : 0;
    if (last && size + blob.size <= max) last.items.push(blob);
    else chunks.push({ start: i, items: [blob] });
  });
  return chunks;
}

// نفس عدّ الخادم (validateImagePageHtml)
export function countSections(html) {
  return (html.match(/<section\b[^>]*class\s*=\s*["'][^"']*\bs\b[^"']*["']/gi) || []).length;
}

// خطة الذكاء الاصطناعي (extras، منظَّفة في الخادم) ← بلوكات وعناصر حقيقية فوق الصور:
//   topBar ← بلوك «مساحة فارغة» أول الصفحة فيه نص متحرك بعرضه
//   overlays ← عناصر عائمة فوق صورة قسمها (زر نموذج/واتساب أو شريط نص متحرك)
//   whatsappButton ← زر واتساب عائم — فقط إن كان للمتجر رقم (whatsapp)، وكذلك أزرار واتساب فوق الصور
const LIVELY = ['pulse', 'bounce', 'glow', 'heartbeat', 'shake'];

// look: { radius (زوايا النموذج = أسلوب الصفحة), animation (حركة تختلف من صفحة لأخرى) }
function overlayElement(o, whatsapp, look) {
  if (o.kind === 'marquee') {
    return { id: uuid(), type: 'text', content: o.text, x: 50, y: o.y, width: 100, height: 56, fontSize: 22, fontWeight: 700, color: o.textColor, backgroundColor: o.backgroundColor, marquee: 'rtl', marqueeSpeed: 12, marqueeRepeat: 2 };
  }
  return {
    id: uuid(), type: 'button', text: o.text, linkType: o.linkType, ...(o.linkType === 'whatsapp' ? { whatsappNumber: whatsapp } : { link: '#' }),
    x: o.x, y: o.y, width: o.width, height: 60, fontSize: 20, borderRadius: look.radius, backgroundColor: o.backgroundColor, textColor: o.textColor, animation: look.animation,
  };
}

export function buildImagePageTree(urls, { form, formAfter, productId, extras, whatsapp = '', rand = Math.random }) {
  const look = {
    radius: Number.isFinite(Number(form?.borderRadius)) ? Number(form.borderRadius) : 12,
    animation: LIVELY[Math.min(LIVELY.length - 1, Math.floor(rand() * LIVELY.length))],
  };
  const overlays = (extras?.overlays || []).filter((o) => o.linkType !== 'whatsapp' || o.kind !== 'button' || whatsapp);
  const images = urls.map((src, i) => ({
    id: uuid(),
    type: 'image',
    props: { ...componentsMap.image.defaultProps, src, width: 100, elements: overlays.filter((o) => o.section === i).map((o) => overlayElement(o, whatsapp, look)) },
  }));
  const formBlock = {
    id: uuid(),
    type: 'productForm',
    props: { ...componentsMap.productForm.defaultProps, ...form, productId: productId || '' },
  };
  const at = Math.min(Math.max(0, formAfter ?? images.length - 1), images.length - 1) + 1;
  const tree = [...images.slice(0, at), formBlock, ...images.slice(at)];

  const bar = extras?.topBar;
  if (bar?.text) {
    tree.unshift({
      id: uuid(),
      type: 'spacer',
      props: {
        ...componentsMap.spacer.defaultProps,
        height: 48,
        backgroundColor: bar.backgroundColor,
        elements: [{ id: uuid(), type: 'text', content: bar.text, x: 50, y: 50, width: 100, fontSize: 18, fontWeight: 700, color: bar.textColor, marquee: bar.direction === 'ltr' ? 'ltr' : 'rtl', marqueeSpeed: 12, marqueeRepeat: 1 }],
      },
    });
  }
  if (extras?.whatsappButton && whatsapp) {
    tree.push({
      id: uuid(),
      type: 'floatingButton',
      props: { ...componentsMap.floatingButton.defaultProps, linkType: 'whatsapp', whatsappNumber: whatsapp, icon: 'WhatsApp', backgroundColor: '#25D366', textColor: '#ffffff', position: 'bottom-right', animation: 'pulse' },
    });
  }
  return tree;
}

export default function useImagePageGenerator(pageId, { onTree } = {}) {
  const [step, setStepState] = useState(null);
  const [stepAt, setStepAt] = useState(0); // بداية المرحلة الحالية — لشريط التقدّم
  const setStep = useCallback((s) => {
    setStepState(s);
    setStepAt(Date.now());
  }, []);
  const [usage, setUsage] = useState({ used: 0, limit: 0 });
  const [canRetry, setCanRetry] = useState(false);
  // معاينة أثناء الإنشاء: { count: null | n, images: (url|null)[] } — null = لا إنشاء جارٍ
  const [preview, setPreview] = useState(null);
  const previewUrls = useRef([]);

  const clearPreview = useCallback(() => {
    previewUrls.current.forEach((u) => URL.revokeObjectURL(u));
    previewUrls.current = [];
    setPreview(null);
  }, []);
  const last = useRef(null);

  const refreshUsage = useCallback(async () => {
    try {
      const res = await axios.get(`${baseURL}/builder-pages/image-pages/usage`, { headers: authHeaders() });
      setUsage({ used: Number(res.data?.used) || 0, limit: Number(res.data?.limit) || 0 });
    } catch {
      /* العدّاد اختياري للعرض — الخادم هو من يفرض الحد */
    }
  }, []);

  useEffect(() => {
    if (pageId && pageId !== 'demo') refreshUsage();
  }, [pageId, refreshUsage]);

  // تصوير الأقسام ← رفعها ← بناء الصفحة (يُعاد كما هو في retryCapture)
  const finish = useCallback(async () => {
    const g = last.current;
    setStep('capture');
    const count = countSections(g.html);
    setPreview({ count, images: Array(count).fill(null) });
    const blobs = await captureSections(fillPlaceholders(g.html, g.images), {
      onProgress: (i, blob) => {
        const url = URL.createObjectURL(blob);
        previewUrls.current.push(url);
        setPreview((p) => (p ? { ...p, images: p.images.map((x, j) => (j === i ? url : x)) } : p));
      },
    });
    setStep('upload');
    const urls = [];
    for (const { start, items } of chunkBySize(blobs)) {
      const body = new FormData();
      body.append('generationId', g.generationId);
      body.append('startIndex', String(start));
      items.forEach((b, i) => body.append('files', b, `${start + i + 1}.${b.type === 'image/webp' ? 'webp' : 'jpg'}`));
      const res = await axios.post(`${baseURL}/builder-pages/${pageId}/image-page-sections`, body, { headers: authHeaders() });
      urls.push(...res.data.urls);
    }
    onTree?.(buildImagePageTree(urls, g));
    clearPreview();
    last.current = null;
    setCanRetry(false);
    return true;
  }, [pageId, onTree, clearPreview, setStep]);

  const run = useCallback(async ({ files, productId, description, price, language, style, primaryColor }) => {
    setCanRetry(false);
    last.current = null;
    clearPreview();
    setPreview({ count: null, images: [] });
    try {
      setStep('cutout');
      const photos = await Promise.all(files.slice(0, 3).map((f) => downscale(f)));
      const cutouts = [];
      for (const p of photos) cutouts.push(await removeBackgroundCached(p, pageId)); // واحدة تلو الأخرى

      setStep('palette');
      const palette = await extractPalette(cutouts[0], 5);
      const backgroundPalette = await extractBackgroundPalette(photos[0], cutouts[0], 4).catch(() => []);

      setStep('design');
      const whatsapp = await storeWhatsapp();
      const res = await axios.post(
        `${baseURL}/builder-pages/${pageId}/generate-image-page`,
        {
          productId: productId || undefined,
          description: description || undefined,
          price,
          language,
          style,
          palette: palette.length ? palette : ['#1f2937'],
          backgroundPalette,
          primaryColor,
          cutouts: cutouts.length,
          details: photos.length,
          hasWhatsapp: !!whatsapp,
        },
        { headers: authHeaders() },
      );
      last.current = {
        ...res.data,
        productId,
        whatsapp,
        images: {
          IMG: await Promise.all(cutouts.map(blobToDataUrl)),
          DETAIL: await Promise.all(photos.map(blobToDataUrl)),
        },
      };
      refreshUsage();
      return await finish();
    } catch (err) {
      setCanRetry(!!last.current); // فشل بعد التصميم: إعادة التصوير بلا احتساب
      clearPreview();
      throw err;
    } finally {
      setStep(null);
    }
  }, [pageId, finish, refreshUsage, clearPreview, setStep]);

  const retryCapture = useCallback(async () => {
    if (!last.current) return false;
    try {
      return await finish();
    } catch (err) {
      setCanRetry(!!last.current);
      clearPreview();
      throw err;
    } finally {
      setStep(null);
    }
  }, [finish, clearPreview, setStep]);

  return { run, step, stepAt, usage, canRetry, retryCapture, refreshUsage, preview };
}
