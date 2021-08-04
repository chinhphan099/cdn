(() => {
    console.log('BlueShift');
    function getQueryParameter(param) {
        let href = '';
        if (location.href.indexOf('?')) {
            href = location.href.substr(location.href.indexOf('?'));
        }

        const value = href.match(new RegExp('[\?\&]' + param + '=([^\&]*)(\&?)', 'i'));
        return value ? value[1] : null;
    }
    const blueshiftID = getQueryParameter('isCardTest') === '1' ? 'fa8307145a64f9484defb6d8a18940f0' : '13c25a652e2a0c05cb06a3b1dba09a85';
    window._blueshiftid = blueshiftID;
    window.blueshift = window.blueshift || [];
    if(blueshift.constructor === Array) {
        blueshift.load = function() {
            var d = function(a) {
                return function() { blueshift.push([a].concat(Array.prototype.slice.call(arguments,0))); };
            },
            e = ['identify', 'track', 'click', 'pageload', 'capture', 'retarget', 'presale_load', 'interstitial_load', 'upsell_load'];
            for(var f = 0; f < e.length; f++) {
                blueshift[e[f]] = d(e[f]);
            }
        };
    }
    blueshift.load();
    blueshift.pageload();

    const urlPath = window.location.pathname;
    if (urlPath.indexOf('/pre') > -1) { blueshift.presale_load(); }
    if (urlPath.indexOf('/index') > -1) { blueshift.interstitial_load(); }
    if (urlPath.indexOf('/special-offer-') > -1) { blueshift.upsell_load(); }

    if(blueshift.constructor===Array){(function(){var b=document.createElement('script');b.type='text/javascript',b.async=!0,b.src=('https:'===document.location.protocol?'https:':'http:')+'//cdn.getblueshift.com/blueshift.js',b.defer=true;var c=document.getElementsByTagName('script')[0];c.parentNode.insertBefore(b,c);})();}

    let campaignName = window.siteSetting.campaignName;
    let _campaignInfo;
    let orderFired = false;
    let countryCode = '';
    function getCurrentDate() {
        const date = new Date();
        return date.toISOString();
        // return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
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
    function getCheckedProduct() {
        try {
            const product = window._q('input[name="product"]:checked').dataset.product;
            if (product) {
                return JSON.parse(product);
            }
            else {
                return null;
            }
        } catch(e) {
            console.log(e);
        }
    }
    function orderPageEvents() {
        window.localStorage.removeItem('isFiredMainOrderBlueshift');
        _campaignInfo = window.campaignInfo;

        if (!_campaignInfo || !window._EA_ID || orderFired) {
            return;
        }
        console.log('BlueShift', _campaignInfo, window._EA_ID);
        countryCode = _campaignInfo.location.countryCode;
        var checkedItemData = getCheckedProduct();
        orderFired = true;

        let phone_valid = '', phone_linetype = '', phone_carrier = '', international_format = '';
        function getIdentifyData() {
            try {
                let firstName = window._qById('customer_firstname') ? window._qById('customer_firstname').value : '';
                let lastName = window._qById('customer_lastname') ? window._qById('customer_lastname').value : '';
                if (!firstName) {
                    firstName = window._qById('shipping_firstname') ? window._qById('shipping_firstname').value : '';
                }
                if (!lastName) {
                    lastName = window._qById('shipping_lastname') ? window._qById('shipping_lastname').value : '';
                }
                const data = {
                    // customer_id: '',
                    email: window._qById('customer_email').value,
                    firstname: firstName,
                    lastname: lastName,
                    // ers: '',
                    // email_verified: '',
                    // widget: false,
                    phone_number: international_format || window._qById('customer_phone').value,
                    phone_valid: phone_valid,
                    phone_linetype: phone_linetype,
                    phone_carrier: phone_carrier,
                    // orig_affid: '',
                    ship_city: window._qById('shipping_city').value,
                    ship_address: window._qById('shipping_address1').value,
                    ship_state: window._qById('shipping_province').value,
                    ship_zip: window._qById('shipping_postal').value,
                    ship_country: window._qById('shipping_country').value,
                    customer_language: document.querySelector('html').getAttribute('lang') || '',
                    joined_at: getCurrentDate(),
                    fingerprint_id: window._EA_ID,
                    referrer: document.referrer
                };
                if (window.CC_Code) {
                    data.coupon = window.CC_Code;
                }
                return data;
            } catch (e) {
                console.log(e);
            }
        }
        function getItemDataForCart(checkedItem) {
            try {
                const quantity = window.localStorage.getItem('doubleQuantity') ? checkedItem.quantity / 2 : checkedItem.quantity;
                const landingurl = window.location.href;
                let landingBaseUrl = '';
                if (landingurl) {
                    landingBaseUrl = landingurl.split('?')[0];
                }
                return {
                    // fingerprintId: window._EA_ID,
                    email: window._qById('customer_email').value || '',
                    product_ids: [checkedItem.productId],
                    items: [
                        {
                            productId: checkedItem.productId,
                            sku: checkedItem.sku,
                            total_usd: (checkedItem.productPrices.DiscountedPrice.Value + checkedItem.shippings[window.shippingIndex || 0].price).toFixed(2),
                            quantity: quantity
                        }
                    ],
                    sku: checkedItem.sku,
                    currency: window.localStorage.getItem('currencyCode'),
                    landing_base_url: landingBaseUrl,
                    customer_language: document.querySelector('html').getAttribute('lang') || ''
                    // referrer: document.referrer,
                    // countryCode: _campaignInfo.location.countryCode,
                    // regionCode: _campaignInfo.location.regionCode,
                    // ip: _campaignInfo.location.ip
                };
            } catch (e) {
                console.log(e);
            }
        }

        var inputs = Array.prototype.slice.call(document.querySelectorAll('.customer-email, .shipping-firstname, .shipping-lastname, .customer-phone'));
        let identifyData = getIdentifyData();
        blueshift.identify(identifyData);

        inputs.forEach(function(input) {
            input.addEventListener('change', function (e) {
                try {
                    identifyData = getIdentifyData();

                    if (e.currentTarget.getAttribute('id') === 'customer_email' && window._qById('customer_email').classList.contains('input-valid')) {
                        console.log('BlueShift - Fire identify');
                        blueshift.identify(identifyData);
                        checkedItemData = getCheckedProduct();
                        blueshift.track('add_to_cart', getItemDataForCart(checkedItemData));
                    }

                    if (e.currentTarget.getAttribute('id') === 'customer_phone' && e.currentTarget.value !== '') {
                        const phoneNumber = e.currentTarget.value.match(/\d/g).join('');
                        let checkPhoneAPI = `//apilayer.net/api/validate?access_key=755a648d3837cf3adb128f29d322879a&number=${phoneNumber}`;
                        if (countryCode) {
                            checkPhoneAPI += `&country_code=${countryCode.toLowerCase()}`;
                        }

                        window.utils
                            .callAjax(checkPhoneAPI, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                }
                            })
                            .then((result) => {
                                phone_valid = result.valid;
                                phone_linetype = result.line_type;
                                phone_carrier = result.carrier;
                                if (phone_valid) {
                                    international_format = result.international_format;
                                    identifyData = getIdentifyData();
                                    blueshift.identify(identifyData);
                                    // blueshift.track('add_to_cart', getItemDataForCart(checkedItemData));
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

        window.utils.events.on('onActivePopup', function() {
            window.CC_Code = window.nextPurchaseCoupon || window.couponCodeId || true;
            identifyData = getIdentifyData();
            blueshift.identify(identifyData);
        });

        window.utils.events.on('beforeSubmitOrder', function() {
            try {
                identifyData = getIdentifyData();
                blueshift.identify(identifyData);
                window.localStorage.setItem('identifyData', JSON.stringify(identifyData));

                const curItem = getCheckedProduct();
                curItem.campaignName = campaignName;
                window.localStorage.setItem('prevItem', JSON.stringify(curItem));

                console.log('BlueShift - Fire checkout');
                const getProductsInCart = function() {
                    const currentItem = getCheckedProduct();
                    const quantity = window.localStorage.getItem('doubleQuantity') ? currentItem.quantity / 2 : currentItem.quantity;
                    const products = [
                        {
                            productId: currentItem.productId,
                            sku: currentItem.sku,
                            total_usd: (currentItem.productPrices.DiscountedPrice.Value + currentItem.shippings[window.shippingIndex || 0].price).toFixed(2),
                            quantity: quantity
                        }
                    ];
                    return {
                        products: products,
                        sku: currentItem.sku
                    };
                };
                const productsInCart = getProductsInCart();
                const items = productsInCart.products;
                const product_ids = [];
                for (let i = 0, n = items.length; i < n; i++) {
                    product_ids.push(items[i].productId);
                }
                blueshift.track('checkout', {
                    fingerprintId: window._EA_ID,
                    referrer: document.referrer,
                    countryCode: identifyData.ship_country,
                    regionCode: identifyData.ship_state,
                    ip: _campaignInfo.location.ip,
                    product_ids: product_ids,
                    items: items,
                    sku: productsInCart.sku,
                    // total_usd
                    currency: window.localStorage.getItem('currencyCode')
                    // quantity
                });
            } catch(e) {
                console.log(e);
            }
        });

        window.localStorage.setItem('location', JSON.stringify(_campaignInfo.location)); // Save for Upsell

        // add_to_cart first time
        // blueshift.track('add_to_cart', getItemDataForCart(checkedItemData));

        Array.prototype.slice.call(window._qAll('input[name="product"]')).forEach(input => {
            input.addEventListener('change', () => {
                try {
                    var currentItem = getCheckedProduct();

                    if (currentItem.productId === checkedItemData.productId) { return;}

                    if (
                        document.querySelector('#customer_email') &&
                        document.querySelector('#customer_email').classList.contains('input-valid')
                    ) {
                        // remove_from_cart
                        blueshift.track('remove_from_cart', getItemDataForCart(checkedItemData));
                        // add_to_cart
                        blueshift.track('add_to_cart', getItemDataForCart(currentItem));
                    }

                    checkedItemData = getCheckedProduct();
                } catch(e) {
                    console.log(e);
                }
            });
        });
    }

    function init() {
        try {
            if (window.location.href.indexOf('/order') > -1) {
                orderPageEvents();
                let count = 0;
                const orderPage = setInterval(() => {
                    count++;
                    if (window.PRICES && window._EA_ID) {
                        orderPageEvents();
                        clearInterval(orderPage);
                    }
                    if (count === 50) {
                        clearInterval(orderPage);
                    }
                }, 300);
                return;
            }

            var orderInfo = window.localStorage.getItem('orderInfo');
            var _location = window.localStorage.getItem('location');
            var isFiredMainOrderBlueshift = window.localStorage.getItem('isFiredMainOrderBlueshift');
            var __EA_ID = window._EA_ID || window.localStorage.getItem('_vid');
            if (!window.localStorage.getItem('referrerUrl')) {
                window.localStorage.setItem('referrerUrl', document.referrer);
            }
            const getPurchasedData = function(orderInfo, upsellInfo) {
                let orderNumber = orderInfo.orderNumber,
                    quantity = window.localStorage.getItem('doubleQuantity') ? orderInfo.quantity / 2 : orderInfo.quantity,
                    revenue = Number(orderInfo.orderTotalFull),
                    items = [
                        {
                            productId: orderInfo.orderedProducts[0].pid,
                            sku: orderInfo.orderedProducts[0].sku,
                            total_usd: orderInfo.orderTotalFull,
                            quantity: quantity
                        }
                    ],
                    sku = orderInfo.orderedProducts[0].sku;

                if (orderInfo.upsellUrls && orderInfo.upsellUrls.length > 0) {
                    // items.push({
                    //     productId: orderInfo.upsellUrls[0].orderedProducts[0].pid,
                    //     sku: orderInfo.upsellUrls[0].orderedProducts[0].sku,
                    //     total_usd: orderInfo.upsellUrls[0].price,
                    //     quantity: orderInfo.upsellUrls[0].orderedProducts[0].quantity
                    // });
                    for (let i = 0, n = orderInfo.upsellUrls.length; i < n; i++) {
                        if (orderInfo.upsellUrls[i].isFired === 'fired') {
                            revenue += orderInfo.upsellUrls[i].price;
                        }
                    }
                }

                if (upsellInfo) {
                    orderNumber = orderInfo.orderNumber;
                    campaignName = upsellInfo.campaignName;
                    items = [
                        {
                            productId: upsellInfo.orderedProducts[0].pid,
                            sku: upsellInfo.orderedProducts[0].sku,
                            total_usd: upsellInfo.price,
                            quantity: upsellInfo.orderedProducts[0].quantity
                        }
                    ],
                    sku = upsellInfo.orderedProducts[0].sku;
                }
                const product_ids = [];
                for (let i = 0, n = items.length; i < n; i++) {
                    product_ids.push(items[i].productId);
                }
                const landingurl = window.location.href;
                let landingBaseUrl = '';
                if (landingurl) {
                    landingBaseUrl = landingurl.split('?')[0];
                }
                const data = {
                    order_id: orderNumber,
                    customer_id: orderInfo.customerId,
                    email: orderInfo.cusEmail,
                    order_create_date: getCurrentDate(),
                    ip_address: _location.ip || '',
                    // customer_language: orderInfo.cusCountry,
                    customer_language: document.querySelector('html').getAttribute('lang') || '',
                    // affid
                    // device
                    // device_timezone
                    device_type: getDeviceType(),
                    device_vendor: window.navigator.vendor,
                    campaignname: campaignName,
                    internal_campaignname: campaignName,
                    landingurl: landingurl,
                    landing_base_url: landingBaseUrl,
                    referringurl: document.referrer,
                    parentcampaign: window.localStorage.getItem('mainCampaignName'),
                    // external_payment_url
                    // one_click_purchase_reference
                    product_ids: product_ids,
                    items: items,
                    sku: sku,
                    revenue: revenue.toFixed(2),
                    currency: window.localStorage.getItem('currencyCode'),
                    // order_status
                };
                return data;
            };
            if (orderInfo && __EA_ID) {
                orderInfo = JSON.parse(orderInfo);
                _location = JSON.parse(_location || '{}');

                let identifyData = window.localStorage.getItem('identifyData');
                if (identifyData) {
                    identifyData = JSON.parse(identifyData);
                    if (!identifyData.customer_id) {
                        identifyData.customer_id = orderInfo.customerId;
                    }
                    window.localStorage.setItem('identifyData', JSON.stringify(identifyData));
                    blueshift.identify(identifyData);
                }

                if (!isFiredMainOrderBlueshift) {
                    console.log('BlueShift - Fire Purchase');
                    if (orderInfo.upsellUrls && orderInfo.upsellUrls.length > 0) {
                        localStorage.setItem('subOrderNumber', orderInfo.upsellUrls[0].orderNumber);
                        // orderInfo.upsellUrls[0].isFired = 'noFired';
                    }
                    blueshift.track('purchase', getPurchasedData(orderInfo));
                    window.localStorage.setItem('isFiredMainOrderBlueshift', true);
                }
                else if (orderInfo.upsellUrls && orderInfo.upsellUrls.length > 0) {
                    const latestUpsellIndex = orderInfo.upsellUrls.length - 1;
                    const upsellInfo = orderInfo.upsellUrls[latestUpsellIndex];
                    const subOrderNumber = localStorage.getItem('subOrderNumber');
                    if (!orderInfo.upsellUrls[latestUpsellIndex].isFired && orderInfo.upsellUrls[latestUpsellIndex].orderNumber !== subOrderNumber) {
                        orderInfo.upsellUrls[latestUpsellIndex].isFired = 'fired';
                        console.log('BlueShift - Fire Purchase');
                        blueshift.track('purchase', getPurchasedData(orderInfo, upsellInfo));
                    }
                }
                window.localStorage.setItem('orderInfo', JSON.stringify(orderInfo));
            }

            window.utils.events.on('onBeforePlaceUpsellOrder', function() {
                const upsellItem = window.upsell.products[window.upsell_productindex];
                upsellItem.campaignName = campaignName;
                window.localStorage.setItem('prevItem', JSON.stringify(upsellItem));
            });

            if (urlPath.indexOf('decline') > -1) {
                let prevItem = JSON.parse(window.localStorage.getItem('prevItem'));
                if (prevItem) {
                    const quantity = window.localStorage.getItem('doubleQuantity') ? prevItem.quantity / 2 : prevItem.quantity;
                    const failProducts = [
                        {
                            productId: prevItem.productId,
                            sku: prevItem.sku,
                            total_usd: (prevItem.productPrices.DiscountedPrice.Value + prevItem.shippings[window.shippingIndex || 0].price).toFixed(2),
                            quantity: quantity
                        }
                    ],
                    sku = prevItem.sku;
                    const product_ids = [];
                    for (let i = 0, n = failProducts.length; i < n; i++) {
                        product_ids.push(failProducts[i].productId);
                    }
                    const landingurl = window.location.href;
                    let landingBaseUrl = '';
                    if (landingurl) {
                        landingBaseUrl = landingurl.split('?')[0];
                    }
                    let declineData = {
                        order_create_date: getCurrentDate(),
                        ip_address: _location.ip || '',
                        // affid: '',
                        // device: '',
                        internal_campaignname: prevItem.campaignName,
                        // device_timezone: '',
                        device_type: getDeviceType(),
                        device_vendor: window.navigator.vendor,
                        campaignname: prevItem.campaignName,
                        landingurl: landingurl,
                        landing_base_url: landingBaseUrl,
                        referringurl: document.referrer,
                        parentcampaign: window.localStorage.getItem('mainCampaignName'),
                        // external_payment_url: '',
                        // one_click_purchase_reference: '',
                        // total_usd: '',
                        // quantity: '',
                        product_ids: product_ids,
                        items: failProducts,
                        sku: sku
                        // order_status: '',
                        // tracking_number: ''
                    };
                    if (orderInfo) {
                        declineData = {
                            ...declineData,
                            order_id: orderInfo.orderNumber,
                            customer_id: orderInfo.customerId,
                            customer_language: document.querySelector('html').getAttribute('lang') || ''
                            // customer_language: orderInfo.cusCountry
                        };
                    }
                    blueshift.track('decline', declineData);
                }
            }
        } catch(e) {
            console.log(e);
        }
    }

    window.addEventListener('load', function() {
        init();
    });
})();
