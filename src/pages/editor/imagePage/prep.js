// تجهيز صور صفحة الصور في المتصفح: تصغير، نزع الخلفية (مع حفظ النتيجة)، واستخراج الألوان.
// لا شيء من هذا يمر على الخادم — تكلفة المنصة = طلب Claude واحد فقط.

const makeCanvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode_failed'))), type, quality));

async function decode(blob) {
  try {
    return await createImageBitmap(blob);
  } catch {
    throw new Error('unsupported_image'); // HEIC على متصفح لا يدعمه مثلاً
  }
}

export async function downscale(file, maxSide = 1600) {
  const bmp = await decode(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = makeCanvas(Math.round(bmp.width * scale), Math.round(bmp.height * scale));
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  return canvasToBlob(canvas, 'image/jpeg', 0.9);
}

// ---- نزع الخلفية مع حفظ النتيجة (IndexedDB، بمفتاح SHA-256 للصورة) ----
const DB_NAME = 'mdstore-cutouts';
const memory = new Map();

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no_idb'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('cutouts');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idb(mode, fn) {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const req = fn(db.transaction('cutouts', mode).objectStore('cutouts'));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined; // وضع خاص أو IndexedDB معطّل: نكمل بلا حفظ دائم
  }
}

async function sha256(blob) {
  const hash = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

// تنظيف حواف القص: البكسل شبه الشفاف يُحذف، وبكسل الحافة يأخذ لون أقرب بكسلات المنتج المعتمة
// (بدل بقايا الخلفية — الهالة البيضاء حول الشعر والأطراف). يعدّل data (RGBA) في مكانه.
export function refineAlpha(data, width, height, radius = 3) {
  const alpha = new Uint8ClampedArray(width * height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3] < 64 ? 0 : data[i * 4 + 3];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const a = alpha[i];
      data[i * 4 + 3] = a;
      if (a === 0 || a >= 250) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= width) continue;
          const j = yy * width + xx;
          if (alpha[j] < 250) continue;
          r += data[j * 4]; g += data[j * 4 + 1]; b += data[j * 4 + 2]; n++;
        }
      }
      if (!n) {
        data[i * 4 + 3] = 0; // بقعة معزولة من الخلفية
        continue;
      }
      data[i * 4] = r / n; data[i * 4 + 1] = g / n; data[i * 4 + 2] = b / n;
    }
  }
  return data;
}

async function refineCutout(png) {
  try {
    const bmp = await createImageBitmap(png);
    const canvas = makeCanvas(bmp.width, bmp.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp, 0, 0);
    bmp.close?.();
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    refineAlpha(img.data, img.width, img.height);
    ctx.putImageData(img, 0, 0);
    return await canvasToBlob(canvas, 'image/png');
  } catch {
    return png; // متصفح بلا canvas كافٍ: نرجع نتيجة النموذج كما هي
  }
}

// يتغير مع النموذج/التنظيف حتى لا تُستعمل قصّات قديمة محفوظة
const CUTOUT_VERSION = 'fp16-refine-1';

export async function removeBackgroundCached(blob) {
  const key = `${CUTOUT_VERSION}:${await sha256(blob)}`;
  const hit = memory.get(key) ?? (await idb('readonly', (s) => s.get(key)));
  if (hit) {
    memory.set(key, hit);
    return hit;
  }
  const { removeBackground } = await import('@imgly/background-removal');
  // النموذج المتوسط: الكبير أعطى نفس النتيجة تقريبًا بعد تنظيف الحواف، بضعف حجم التحميل
  const out = await refineCutout(await removeBackground(blob, { model: 'isnet_fp16', output: { format: 'image/png' } }));
  memory.set(key, out);
  await idb('readwrite', (s) => s.put(out, key));
  return out;
}

// ---- الألوان: تجميع البكسلات في خانات ثم متوسط كل خانة ----
const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

export async function extractPalette(blob, count = 5) {
  const bmp = await decode(blob);
  const canvas = makeCanvas(64, 64);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bmp, 0, 0, 64, 64);
  bmp.close?.();
  const { data } = ctx.getImageData(0, 0, 64, 64);

  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 128) continue; // شفاف (بعد نزع الخلفية)
    if (Math.min(r, g, b) > 235 || Math.max(r, g, b) < 20) continue; // شبه أبيض / شبه أسود
    const key = (r >> 4) * 256 + (g >> 4) * 16 + (b >> 4);
    const s = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    s.n++; s.r += r; s.g += g; s.b += b;
    buckets.set(key, s);
  }

  const picked = [];
  for (const s of [...buckets.values()].sort((x, y) => y.n - x.n)) {
    const c = [s.r / s.n, s.g / s.n, s.b / s.n];
    // نتجنب لونين متقاربين جداً
    if (picked.some((p) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) < 48)) continue;
    picked.push(c);
    if (picked.length === count) break;
  }
  return picked.map((c) => hex(...c));
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
