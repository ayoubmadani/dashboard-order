import { useEffect } from 'react';

export function StorePixels({ pixels }) {
  useEffect(() => {
    if (!pixels || pixels.length === 0) return;

    // Facebook Pixel
    const fbPixel = pixels.find(p => p.type === 'facebook' && p.isActive);
    if (fbPixel) {
      initFacebookPixel(fbPixel.pixelId, fbPixel.events);
    }

    // TikTok Pixel
    const tiktokPixel = pixels.find(p => p.type === 'tiktok' && p.isActive);
    if (tiktokPixel) {
      initTikTokPixel(tiktokPixel.pixelId, tiktokPixel.events);
    }
  }, [pixels]);

  return null;
}

function initFacebookPixel(pixelId, events) {
  if (typeof window === 'undefined' || window.fbq) return;

  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);

  events?.forEach(event => {
    if (event !== 'PageView') {
      window.fbq('track', event);
    }
  });
}

function initTikTokPixel(pixelId, events) {
  if (typeof window === 'undefined' || window.ttq) return;

  const script = document.createElement('script');
  script.innerHTML = `
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;
      var ttq=w[t]=w[t]||[];
      ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
      ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
      for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
      ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
      ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=n;
      var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=i+"?sdkid="+e+"&lib="+t;
      var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(a,s)};
      
      ttq.load('${pixelId}');
      ttq.page();
    }(window, document, 'ttq');
  `;
  document.head.appendChild(script);
}