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

export function buildImagePageTree(urls, { form, formAfter, productId }) {
  const images = urls.map((src) => ({
    id: uuid(),
    type: 'image',
    props: { ...componentsMap.image.defaultProps, src, width: 100 },
  }));
  const formBlock = {
    id: uuid(),
    type: 'productForm',
    props: { ...componentsMap.productForm.defaultProps, ...form, productId: productId || '' },
  };
  const at = Math.min(Math.max(0, formAfter ?? images.length - 1), images.length - 1) + 1;
  return [...images.slice(0, at), formBlock, ...images.slice(at)];
}

export default function useImagePageGenerator(pageId, { onTree } = {}) {
  const [step, setStep] = useState(null);
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
  }, [pageId, onTree, clearPreview]);

  const run = useCallback(async ({ files, productId, description, price, language, style }) => {
    setCanRetry(false);
    last.current = null;
    clearPreview();
    setPreview({ count: null, images: [] });
    try {
      setStep('cutout');
      const photos = await Promise.all(files.slice(0, 3).map((f) => downscale(f)));
      const cutouts = [];
      for (const p of photos) cutouts.push(await removeBackgroundCached(p)); // واحدة تلو الأخرى: الذاكرة على الهاتف

      setStep('palette');
      const palette = await extractPalette(cutouts[0], 5);
      const backgroundPalette = await extractBackgroundPalette(photos[0], cutouts[0], 4).catch(() => []);

      setStep('design');
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
          cutouts: cutouts.length,
          details: photos.length,
        },
        { headers: authHeaders() },
      );
      last.current = {
        ...res.data,
        productId,
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
  }, [pageId, finish, refreshUsage, clearPreview]);

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
  }, [finish, clearPreview]);

  return { run, step, usage, canRetry, retryCapture, refreshUsage, preview };
}
