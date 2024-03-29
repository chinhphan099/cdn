(() => {
  console.log('BlueShift');
  const clientDomain = [
    // 'publish.ctrwow.com', // Test
    'azzurogroup.com',
    'getpurechill.com',
    'arctoscooler.com',
    'batteryvaultshop.com',
    'everbladeshop.com',
    'hulkheater.com',
    'powerpodshop.com',
    'mystarbellyshop.com',
    'buychillwell.com',
    'chillwellcooler.com',
    'chillwelloffer.com',
    'chillwellorder.com',
    'buycircaknee.com',
    'buy.noobru.com',
    'getshinearmor.com',
    'shop.tryseedwell.com',
    'shopcontoursrx.com',
    'shopclipperpro.com',
    'theclipperpro.com',
    'sleepconnectionstore.com',
    'yoursleepconnection.com',
    'buy.joyspringvitamins.com',
    'try.fruily.com',
    'officialshinearmor.com',
    'yourshinearmor.com',
    'buymiraclebrand.com',
    'theofficialbarxbuddy.com',
    'ultraradianceskin.com',
  ];
  const hostName = window.location.host.replace(/www./, '');
  const isClient = clientDomain.includes(hostName);
  function getQueryParameter(param) {
    let href = '';
    if (location.href.indexOf('?')) {
      href = location.href.substr(location.href.indexOf('?'));
    }

    const value = href.match(new RegExp('[\?\&]' + param + '=([^\&]*)(\&?)', 'i'));
    return value ? value[1] : null;
  }
  function getCurrentDate() {
    const date = new Date();
    return date.toISOString();
  }
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }
  async function callAjax(url, settings) {
    let settingsClone = {};
    if (!url) {
      throw 'API URL is missing!';
    }
    const headersOptions = {
      'content-type': 'application/json'
    };
    if (settings && typeof settings === 'object') {
      settingsClone = Object.assign(
        {
          method: 'GET',
          headers: settings.headers ? Object.assign(headersOptions, settings.headers) : headersOptions
        },
        settings
      );
    }

    const response = await window.fetch(url, settingsClone);
    if (response.status === 204 || response.status === 205) {
      return null;
    }
    if (response.status >= 200 && response.status < 300) {
      return response.text().then(function (text) {
        try {
          return text ? JSON.parse(text) : {};
        } catch (e) {
          return {};
        }
      });
    }
    throw {
      status: response.status,
      statusText: response.statusText,
      response: response
    };
  }

  const urlPath = window.location.pathname;
  const blueshiftID = getQueryParameter('isCardTest') === '1' ? 'fa8307145a64f9484defb6d8a18940f0' : '13c25a652e2a0c05cb06a3b1dba09a85';
  window._blueshiftid = blueshiftID;
  window.blueshift = window.blueshift || [];
  if(blueshift.constructor === Array) {
    blueshift.load = function(){
      var d=function(a){
        return function(){
          blueshift.push([a].concat(Array.prototype.slice.call(arguments,0)));
        };
      },
      e = ['identify','track','click','pageload','capture','retarget','interstitial_load','shop_load','product_details_load','cart_load','checkout_load'];
      for(var f = 0; f < e.length; f++) {
        blueshift[e[f]] = d(e[f]);
      }
    };
  }
  isClient ? blueshift.load({ client: true }) : blueshift.load();
  isClient ? blueshift.pageload({ client: true }) : blueshift.pageload();
  if (urlPath.indexOf('/index') > -1) {
    isClient ? blueshift.interstitial_load({ client: true }) : blueshift.interstitial_load();
  }
  if (urlPath.indexOf('/shop') > -1) {
    isClient ? blueshift.shop_load({ client: true }) : blueshift.shop_load();
  }
  if (urlPath.indexOf('/cart') > -1) {
    isClient ? blueshift.cart_load({ client: true }) : blueshift.cart_load();
  }
  if (urlPath.indexOf('/checkout') > -1) {
    isClient ? blueshift.checkout_load({ client: true }) : blueshift.checkout_load();
  }
  // if (document.querySelector('.product-details-page')) { blueshift.product_details_load(); }

  if(blueshift.constructor===Array){(function(){var b=document.createElement('script');b.type='text/javascript',b.async=!0,b.src=('https:'===document.location.protocol?'https:':'http:')+'//cdn.getblueshift.com/blueshift.js',b.defer=true;var c=document.getElementsByTagName('script')[0];c.parentNode.insertBefore(b,c);})();}

  let campaignInfo;
  let checkoutFired = false;
  let countryCode = '';
  function isPlusQuantity(pid) {
    try {
      const qtyFromAPI = campaignInfo.prices.find(price => price.productId === pid).quantity;
      if (qtyFromAPI !== 1) {
        return false;
      }
      return true;
    } catch(e) {
      console.log(e);
    }
  }
  function addSkuIntoCartItems(isConfirmPage) {
    try {
      let cartItems = {};
      if (isConfirmPage) {
        cartItems.items = JSON.parse(localStorage.getItem('checkoutSuccess')).products;
      }
      else {
        cartItems = JSON.parse(localStorage.getItem('cart'));
      }
      // cartItems.items = cartItems.items.map((cartItem) => {
      //     var sku = campaignInfo.prices.find(price => price.productId === Number(cartItem.productId)).sku;
      //     return {
      //         ...cartItem,
      //         sku: sku
      //     }
      // });
      if (!isConfirmPage) {
        window.localStorage.setItem('cart', JSON.stringify(cartItems));
      }
      return cartItems;
    } catch(e) {
      console.log(e);
    }
  }
  function getProductsInCart(isConfirmPage) {
    try {
      const cartItems = addSkuIntoCartItems(isConfirmPage);
      const products = cartItems.items.map((item) => {
        var quantity = Number(item.quantity);
        var total = Number(item.discountedPrice) + Number(item.shippingValue);
        var isPlusQty = isPlusQuantity(Number(item.productId), quantity);
        if (isPlusQty) {
          total = Number(item.discountedPrice) * quantity + Number(item.shippingValue);
        }
        return {
          productId: item.productId,
          sku: item.sku,
          total_usd: total.toFixed(2),
          quantity: quantity
        };
      });

      return {
        products: products
      };
    } catch(e) {
      console.log(e);
    }
  }
  function checkoutPageEvents() {
    try {
      window.localStorage.removeItem('isFiredMainOrderBlueshift');

      if (!campaignInfo || !window._EA_ID || checkoutFired) {
        return;
      }
      countryCode = campaignInfo.location.countryCode;
      checkoutFired = true;

      let phone_valid = '', phone_linetype = '', phone_carrier = '', international_format = '';
      const getIdentifyData = function() {
        try {
          const data = {
            email: document.querySelector('#customer_email').value,
            firstname: document.querySelector('#shipping_firstname').value || '',
            lastname: document.querySelector('#shipping_lastname').value || '',
            phone_number: international_format || document.querySelector('#customer_phone').value,
            phone_valid: phone_valid,
            phone_linetype: phone_linetype,
            phone_carrier: phone_carrier,
            ship_city: document.querySelector('#shipping_city').value,
            ship_address: document.querySelector('#shipping_address1').value,
            ship_state: document.querySelector('#shipping_state').value,
            ship_zip: document.querySelector('#shipping_postcode').value,
            ship_country: document.querySelector('#shipping_country').value,
            customer_language: document.querySelector('html').getAttribute('lang') || '',
            joined_at: getCurrentDate(),
            fingerprint_id: window._EA_ID,
            referrer: document.referrer
          };
          isClient && (data.client = isClient);
          return data;
        } catch(e) {
          console.log(e);
        }
      };

      var inputs = Array.prototype.slice.call(document.querySelectorAll('#customer_email, #shipping_firstname, #shipping_lastname, #customer_phone'));
      let identifyData = getIdentifyData();
      blueshift.identify(identifyData);

      inputs.forEach(function(input) {
        input.addEventListener('change', function (e) {
          try {
            identifyData = getIdentifyData();

            if (e.currentTarget.getAttribute('id') === 'customer_email' && document.querySelector('#customer_email').classList.contains('valid')) {
              blueshift.identify(identifyData);
            }

            if (e.currentTarget.getAttribute('id') === 'customer_phone' && e.currentTarget.value !== '') {
              const phoneNumber = e.currentTarget.value.match(/\d/g).join('');
              let checkPhoneAPI = `//apilayer.net/api/validate?access_key=755a648d3837cf3adb128f29d322879a&number=${phoneNumber}`;
              if (countryCode) { checkPhoneAPI += `&country_code=${countryCode.toLowerCase()}`; }
              callAjax(checkPhoneAPI)
                .then((result) => {
                  phone_valid = result.valid;
                  phone_linetype = result.line_type;
                  phone_carrier = result.carrier;
                  if (phone_valid) {
                    international_format = result.international_format;
                    identifyData = getIdentifyData();
                    blueshift.identify(identifyData);
                  }
                })
                .catch((e) => {
                  console.log(e);
                });
            }
          } catch(x) {
            console.log(x);
          }
        });
      });

      const submitCheckoutOrder = function() {
        try {
          identifyData = getIdentifyData();
          blueshift.identify(identifyData);
          window.localStorage.setItem('identifyData', JSON.stringify(identifyData));

          const productsInCart = getProductsInCart();
          const items = productsInCart.products;
          const product_ids = [];
          const skus = [];
          let totalQty = 0;
          let totalPrice = 0;
          for (let i = 0, n = items.length; i < n; i++) {
            product_ids.push(items[i].productId);
            skus.push(items[i].sku);
            totalQty += items[i].quantity;
            totalPrice += Number(items[i].total_usd);
          }
          const checkoutData = {
            fingerprintId: window._EA_ID,
            referrer: document.referrer,
            countryCode: identifyData.ship_country,
            regionCode: identifyData.ship_state,
            ip: campaignInfo.location.ip,
            product_ids: product_ids,
            items: items,
            sku: skus,
            // total_usd: totalPrice,
            // quantity: totalQty,
            currency: campaignInfo.location.currencyCode
          };
          isClient && (checkoutData.client = isClient);
          blueshift.track('checkout', checkoutData);
        } catch (e) {
          console.log(e);
        }
      };

      $('button.checkoutWithPaypal').on('click', function() {
        submitCheckoutOrder();
      });
      $('button#btn-submit-cc').on('click', function() {
        submitCheckoutOrder();
      });
    } catch(e) {
      console.log(e);
    }
  }

  function init() {
    try {
      // ! Checkout
      if (urlPath.indexOf('/checkout') > -1) {
        checkoutPageEvents();
        let count = 0;
        const checkoutPage = setInterval(() => {
          count++;
          campaignInfo = window.localStorage.getItem('ctr__ecom_campaigns');
          if (campaignInfo && window._EA_ID) {
            campaignInfo = JSON.parse(campaignInfo);
            checkoutPageEvents();
            clearInterval(checkoutPage);
          }
          if (count >= 50) {
            clearInterval(checkoutPage);
          }
        }, 300);
        return;
      }

      const getPurchasedData = function(orderInfo, isConfirmPage) {
        try {
          campaignInfo = JSON.parse(window.localStorage.getItem('ctr__ecom_campaigns'));
          const cartNumber = orderInfo.cartNumber;
          const productsInCart = getProductsInCart(isConfirmPage);
          const items = productsInCart.products;
          const product_ids = [];
          const skus = [];
          let totalQty = 0;
          let totalPrice = 0;
          for (let i = 0, n = items.length; i < n; i++) {
            product_ids.push(items[i].productId);
            skus.push(items[i].sku);
            totalQty += items[i].quantity;
            totalPrice += Number(items[i].total_usd);
          }

          const landingurl = window.location.href;
          const landingBaseUrl = landingurl.split('?')[0];
          const data = {
            order_id: cartNumber,
            customer_id: orderInfo.customerId || '',
            email: orderInfo.email,
            order_create_date: getCurrentDate(),
            ip_address: campaignInfo.location.ip,
            customer_language: document.querySelector('html').getAttribute('lang') || '',
            device_type: getDeviceType(),
            device_vendor: window.navigator.vendor,
            campaignname: campaignInfo.campaignName,
            internal_campaignname: campaignInfo.campaignName,
            landingurl: landingurl,
            landing_base_url: landingBaseUrl,
            referringurl: document.referrer,
            parentcampaign: campaignInfo.campaignName,
            product_ids: product_ids,
            items: items,
            sku: skus,
            revenue: totalPrice.toFixed(2),
            currency: campaignInfo.location.currencyCode
          };
          isClient && (data.client = isClient);
          return data;
        } catch(e) {
          console.log(e);
        }
      };

      // ! Confirm
      var isFiredMainOrderBlueshift = window.localStorage.getItem('isFiredMainOrderBlueshift');
      let orderInfo = window.localStorage.getItem('checkoutSuccess');
      if (urlPath.indexOf('confirm') > -1 && orderInfo) {
        orderInfo = JSON.parse(orderInfo);

        let identifyData = window.localStorage.getItem('identifyData');
        if (identifyData) {
          identifyData = JSON.parse(identifyData);
          if (!identifyData.customer_id && orderInfo.customerId) {
            identifyData.customer_id = orderInfo.customerId;
          }
          window.localStorage.setItem('identifyData', JSON.stringify(identifyData));
          blueshift.identify(identifyData);
        }

        if (!isFiredMainOrderBlueshift) {
          blueshift.track('purchase', getPurchasedData(orderInfo, true));
          window.localStorage.setItem('isFiredMainOrderBlueshift', true);
        }
        window.localStorage.setItem('checkoutSuccess', JSON.stringify(orderInfo));
      }

      // ! Decline
      if (urlPath.indexOf('decline') > -1) {
        campaignInfo = JSON.parse(window.localStorage.getItem('ctr__ecom_campaigns'));
        const productsInCart = getProductsInCart();
        const items = productsInCart.products;
        const product_ids = [];
        const skus = [];
        let totalQty = 0;
        let totalPrice = 0;
        for (let i = 0, n = items.length; i < n; i++) {
          product_ids.push(items[i].productId);
          skus.push(items[i].sku);
          totalQty += items[i].quantity;
          totalPrice += Number(items[i].total_usd);
        }

        const landingurl = window.location.href;
        const landingBaseUrl = landingurl.split('?')[0];
        const declineData = {
          order_create_date: getCurrentDate(),
          ip_address: campaignInfo.location.ip,
          internal_campaignname: campaignInfo.campaignName,
          device_type: getDeviceType(),
          device_vendor: window.navigator.vendor,
          campaignname: campaignInfo.campaignName,
          landingurl: landingurl,
          landing_base_url: landingBaseUrl,
          referringurl: document.referrer,
          parentcampaign: campaignInfo.campaignName,
          product_ids: product_ids,
          items: items,
          sku: skus,
          // total_usd: totalPrice,
          // quantity: totalQty,
          currency: campaignInfo.location.currencyCode,
        };
        isClient && (declineData.client = isClient);
        blueshift.track('decline', declineData);
      }
    } catch(e) {
      console.log(e);
    }
  }

  window.addEventListener('load', function() {
    init();
  });
})();
