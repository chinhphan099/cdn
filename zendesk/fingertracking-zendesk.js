(function() {
  window.dataLayer = window.dataLayer || [];
  window.gtmId = window.gtmId || 'GTM-WZZ327J'; // KoreHealth
  window._CTR_TRACKING_ID = window._CTR_TRACKING_ID || 'KH00012030';
  window._CTR_FINGERPRINTJS_TOKEN = window._CTR_FINGERPRINTJS_TOKEN || "1xDWTKZNrjpwZjuWUjub";

  window.addEventListener('load', function() {
    (function(w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', window.gtmId);

    try {
      if (!!window._CTR_TRACKING_ID) {
        window._CTR_CUSTOM_DATA = {
          siteName: window.location.hostname,
          pageName: document.querySelector('title').textContent,
          pageType: '',
          campaignName: '',
          campaignWebKey: ''
        };
      }

      const script = document.createElement('script');
      script.src = 'https://d16hdrba6dusey.cloudfront.net/sitecommon/js/commons/ctrwow_analytics.v3.pro.min.js'
      script.defer = true;
      document.querySelector('body').appendChild(script);
    } catch(err) {
      console.log('Bind fingerprint error: ', err);
    }
  });
})();
