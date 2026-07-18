import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import { DEMO_PAGE_NAME, getDemoBlocks } from '../demoData';

const DEMO_DELAY = 500;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// NOTE: Using the "builder-pages" resource name to avoid colliding with the
// existing single-product `landing-page` module/entity.
// pageId === 'demo' bypasses the network for load/save/publish (see
// ../demoData.js) so the editor UI can be tried without a real page. AI
// generation is the one exception — it hits the real /generate-trial
// endpoint (free-tier Gemini, no persistence) so the "free trial" is
// genuine AI output, not templated text.
export default function usePageBuilder(pageId) {
  const isDemo = pageId === 'demo';

  const [name, setName] = useState('');
  const [productId, setProductId] = useState(null);
  const [domain, setDomain] = useState(null);
  const [settings, setSettings] = useState({});
  const [blocks, setBlocks] = useState([]);
  // `publishedUrl` (from the backend) is the raw R2 JSON artifact the page
  // tree gets published to — never meant for a person to open. The real,
  // customer-facing page lives at the page's own domain instead, same as
  // every link in PagesList.jsx (`https://${page.domain}`).
  const [publishedUrl, setPublishedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dirty, setDirty] = useState(false);

  const authHeaders = () => ({ Authorization: `Bearer ${getAccessToken()}` });

  const fetchPage = useCallback(async () => {
    if (!pageId) return;
    setLoading(true);
    setError(null);

    if (isDemo) {
      await wait(DEMO_DELAY);
      setName(DEMO_PAGE_NAME);
      setBlocks(getDemoBlocks());
      setPublishedUrl(null);
      setDirty(false);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${baseURL}/builder-pages/${pageId}`, { headers: authHeaders() });
      setName(res.data?.name ?? '');
      setProductId(res.data?.productId ?? null);
      setDomain(res.data?.domain ?? null);
      setSettings(res.data?.settings && typeof res.data.settings === 'object' ? res.data.settings : {});
      setBlocks(Array.isArray(res.data?.tree) ? res.data.tree : []);
      setPublishedUrl(res.data?.publishedUrl ?? null);
      setDirty(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'fetch_error');
    } finally {
      setLoading(false);
    }
  }, [pageId, isDemo]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const updateBlocks = useCallback((updater) => {
    setBlocks((prev) => (typeof updater === 'function' ? updater(prev) : updater));
    setDirty(true);
  }, []);

  const updateSettings = useCallback((updater) => {
    setSettings((prev) => (typeof updater === 'function' ? updater(prev) : updater));
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    if (!pageId) return false;
    setSaving(true);
    try {
      if (isDemo) {
        await wait(DEMO_DELAY);
        setDirty(false);
        return true;
      }
      await axios.put(`${baseURL}/builder-pages/${pageId}/tree`, { tree: blocks, settings }, { headers: authHeaders() });
      setDirty(false);
      return true;
    } finally {
      setSaving(false);
    }
  }, [pageId, blocks, settings, isDemo]);

  const publish = useCallback(async () => {
    if (!pageId) return null;
    setPublishing(true);
    try {
      if (isDemo) {
        await wait(DEMO_DELAY);
        const url = 'https://demo.mdstore.top/demo-page';
        setPublishedUrl(url);
        return url;
      }
      const res = await axios.post(`${baseURL}/builder-pages/${pageId}/publish`, {}, { headers: authHeaders() });
      const url = res.data?.publishedUrl ?? null;
      setPublishedUrl(url);
      return url;
    } finally {
      setPublishing(false);
    }
  }, [pageId, isDemo]);

  const generate = useCallback(async ({ productId, description, language }) => {
    if (!pageId) return false;
    setGenerating(true);
    try {
      const endpoint = isDemo ? `${baseURL}/builder-pages/generate-trial` : `${baseURL}/builder-pages/${pageId}/generate`;
      const res = await axios.post(endpoint, { productId, description, language }, { headers: authHeaders() });
      setBlocks(Array.isArray(res.data?.tree) ? res.data.tree : []);
      setDirty(true);
      return { imageFailed: !!res.data?.imageFailed };
    } finally {
      setGenerating(false);
    }
  }, [pageId, isDemo]);

  // The real, customer-facing page — only meaningful once the page has
  // actually been published (publishedUrl set) and has a domain assigned
  // (a page can be published without one, since domain is optional at
  // creation; without it there's no real URL to send anyone to).
  const siteUrl = domain && publishedUrl ? `https://${domain}` : null;

  return {
    name,
    productId,
    domain,
    settings,
    setSettings: updateSettings,
    blocks,
    setBlocks: updateBlocks,
    publishedUrl,
    siteUrl,
    loading,
    error,
    saving,
    publishing,
    generating,
    dirty,
    save,
    publish,
    generate,
    refetch: fetchPage,
    isDemo,
  };
}
