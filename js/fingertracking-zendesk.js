(function() {
  window.dataLayer = window.dataLayer || [];
  window._CTR_FINGERPRINTJS_TOKEN = window._CTR_FINGERPRINTJS_TOKEN || "1xDWTKZNrjpwZjuWUjub";

  window.addEventListener('load', function() {
    try {
      (function(w, d, s, l, i) {
        try {
          if (!i) return;
          w[l] = w[l] || [];
          w[l].push({
            'gtm.start': new Date().getTime(),
            event: 'gtm.js'
          });
          var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
          j.async = true;
          j.src = '//www.googletagmanager.com/gtm.js?id=' + i + dl;
          f.parentNode.insertBefore(j, f);
        } catch (e) {
          console.log(e);
        }
      })(window, document, 'script', 'dataLayer', window.gtmId);

      (function(w, d, b, s, t) {
        try {
          if (!w._CTR_TRACKING_ID) return;
          w._CTR_CUSTOM_DATA = {
            siteName: w.location.hostname,
            pageName: d.querySelector(t).textContent || '',
            pageType: 'Zendesk Support'
          };
          var j = d.createElement(s);
          j.src = '//d16hdrba6dusey.cloudfront.net/sitecommon/js/commons/ctrwow_analytics.v3.pro.min.js'
          j.defer = true;
          d.querySelector(b).appendChild(j);
        } catch(err) {
          console.log('Bind fingerprint error: ', err);
        }
      })(window, document, 'body', 'script', 'title');
    } catch (e) {
      console.log(e);
    }
  });
})();
