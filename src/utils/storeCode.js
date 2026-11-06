// رمز منتج قصير للمتجر (4 خانات حروف وأرقام، بلا O وI) — نفس رمز تطبيق الهاتف، يُقرأ بالماسح (CODE128)
const CHARS = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function randomStoreCode() {
  const r = new Uint32Array(4);
  crypto.getRandomValues(r);
  return [...r].map((n) => CHARS[n % CHARS.length]).join('');
}

/** رمز غير مستعمل في المتجر: get(code) يبحث عنه (404 = متاح) */
export async function freshStoreCode(get) {
  for (let i = 0; i < 6; i++) {
    const code = randomStoreCode();
    try {
      await get(code);
    } catch (e) {
      if (e?.response?.status === 404) return code;
      throw e;
    }
  }
  throw new Error('no free code');
}
