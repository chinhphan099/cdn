(() => {
    window._blueshiftid='fa8307145a64f9484defb6d8a18940f0';window.blueshift=window.blueshift||[];if(blueshift.constructor===Array){blueshift.load=function(){var d=function(a){return function(){blueshift.push([a].concat(Array.prototype.slice.call(arguments,0)))}},e=["identify","track","click","pageload","capture","retarget","presale_load","interstitial_load", "upsell_load"];for(var f=0;f<e.length;f++)blueshift[e[f]]=d(e[f])};}
    blueshift.load();
    blueshift.pageload();

    const urlPath = window.location.pathname;
    if (urlPath.indexOf('/pre') > -1) {
        blueshift.presale_load();
    }
    if (urlPath.indexOf('/index') > -1) {
        blueshift.interstitial_load();
    }
    if (urlPath.indexOf('/special-offer-') > -1) {
        blueshift.upsell_load();
    }

    if(blueshift.constructor===Array){(function(){var b=document.createElement("script");b.type="text/javascript",b.async=!0,b.src=("https:"===document.location.protocol?"https:":"http:")+"//cdn.getblueshift.com/blueshift.js",b.defer=true;var c=document.getElementsByTagName("script")[0];c.parentNode.insertBefore(b,c);})()}

    let campaignName = JSON.parse(window.__CTR_FP_TRACKING_SETTINGS.FP_TRACKING_CUSTOM_DATA).campaignName;
    let campaignInfo;
    let orderFired = false;
    function getCurrentDate() {
        const date = new Date();
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
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
    function orderPageEvents() {
        window.localStorage.removeItem('isFiredMainOrderBlueshift');
        campaignInfo = __productListData.data.productList;

        console.log(1111, campaignInfo, window._EA_ID);
        if (!campaignInfo || !window._EA_ID || orderFired) {
            return;
        }
        console.log('orderPageEvents pass');
        orderFired = true;

        let phone_valid = '', phone_linetype = '', phone_carrier = '', international_format = '';
        function getIdentifyData() {
            return {
                // customer_id: '',
                email: document.querySelector('[name="email"]').value,
                firstname: document.querySelector('[name="firstName"]').value || '',
                lastname: document.querySelector('[name="lastName"]').value || '',
                // ers: '',
                // email_verified: '',
                // widget: false,
                phone_number: international_format || document.querySelector('[name="phoneNumber"]').value,
                phone_valid: phone_valid,
                phone_linetype: phone_linetype,
                phone_carrier: phone_carrier,
                // orig_affid: '',
                ship_city: document.querySelector('[name="city"]').value,
                ship_address: document.querySelector('[name="address1"]').value,
                ship_state: document.querySelector('[name="state"]').value,
                ship_zip: document.querySelector('[name="zipCode"]').value,
                ship_country: document.querySelector('[name="countryCode"]').value,
                joined_at: getCurrentDate(),
                fingerprint_id: window._EA_ID,
                referrer: document.referrer
            };
        }

        var inputs = Array.prototype.slice.call(document.querySelectorAll('[name="email"], [name="firstName"], [name="lastName"], [name="phoneNumber"]'));
        let identifyData = getIdentifyData();
        blueshift.identify(identifyData);

        inputs.forEach(function(input) {
            input.addEventListener('change', function (e) {
                identifyData = getIdentifyData();

                if (e.currentTarget.getAttribute('name') === 'email' && document.querySelector('[name="email"]').classList.contains('valid')) {
                    console.log('BlueShift - Fire identify')
                    blueshift.identify(identifyData);
                }

                if (e.currentTarget.getAttribute('name') === 'phoneNumber' && e.currentTarget.value !== '') {
                    const phoneNumber = e.currentTarget.value.match(/\d/g).join('');
                    const checkPhoneAPI = `//apilayer.net/api/validate?access_key=755a648d3837cf3adb128f29d322879a&number=${phoneNumber}`
                    window.ctrwowUtils
                        .callAjax(checkPhoneAPI)
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
                        })
                }
            });
        });

        window.ctrwowUtils.events.on('beforeSubmitOrder', function() {
            identifyData = getIdentifyData();
            blueshift.identify(identifyData);
            window.localStorage.setItem('identifyData', JSON.stringify(identifyData));

            const curItem = window.ctrwowCheckout.checkoutData.getProduct();
            curItem.campaignName = campaignName;
            window.localStorage.setItem('prevItem', JSON.stringify(curItem));

            console.log('BlueShift - Fire checkout');
            function getProductsInCart() {
                const currentItem = window.ctrwowCheckout.checkoutData.getProduct();
                const quantity = window.localStorage.getItem('doubleQuantity') ? currentItem.quantity / 2 : currentItem.quantity;
                const products = [
                    {
                        productId: currentItem.productId,
                        sku: currentItem.sku,
                        total_usd: (currentItem.productPrices.DiscountedPrice.Value + currentItem.shippings[window.shippingIndex || 0].price).toFixed(2),
                        quantity: quantity
                    }
                ];
                return products;
            }
            const items = getProductsInCart();
            const product_ids = [];
            for (let i = 0, n = items.length; i < n; i++) {
                product_ids.push(items[i].productId);
            }
            blueshift.track('checkout', {
                fingerprintId: window._EA_ID,
                referrer: document.referrer,
                countryCode: identifyData.ship_country,
                regionCode: identifyData.ship_state,
                ip: campaignInfo.location.ip,
                product_ids: product_ids,
                items: items,
                // sku
                // total_usd
                currency: window.localStorage.getItem('currencyCode')
                // quantity
            });
        });

        window.localStorage.setItem('location', JSON.stringify(campaignInfo.location)); // Save for Upsell

        var checkedItemData = window.ctrwowCheckout.checkoutData.getProduct();
        function getItemDataForCart(checkedItem) {
            const quantity = window.localStorage.getItem('doubleQuantity') ? checkedItem.quantity / 2 : checkedItem.quantity;
            return {
                // fingerprintId: window._EA_ID,
                product_ids: [checkedItem.productId],
                items: [
                    {
                        productId: checkedItem.productId,
                        sku: checkedItem.sku,
                        total_usd: (checkedItem.productPrices.DiscountedPrice.Value + checkedItem.shippings[window.shippingIndex || 0].price).toFixed(2),
                        quantity: quantity
                    }
                ],
                currency: window.localStorage.getItem('currencyCode'),
                // referrer: document.referrer,
                // countryCode: campaignInfo.location.countryCode,
                // regionCode: campaignInfo.location.regionCode,
                // ip: campaignInfo.location.ip
            }
        }

        // add_to_cart first time
        blueshift.track('add_to_cart', getItemDataForCart(checkedItemData));

        window.ctrwowCheckout.checkoutData.onProductChange(function() {
            var currentItem = window.ctrwowCheckout.checkoutData.getProduct();

            if (currentItem.productId === checkedItemData.productId) { return;}

            // remove_from_cart
            blueshift.track('remove_from_cart', getItemDataForCart(checkedItemData));
            // add_to_cart
            blueshift.track('add_to_cart', getItemDataForCart(currentItem));

            checkedItemData = window.ctrwowCheckout.checkoutData.getProduct();
        });
    }

    function init() {
        try {
            if (window.location.href.indexOf('/order') > -1) {
                orderPageEvents();
                const orderPage = setInterval(() => {
                    if (__productListData.data.productList && window._EA_ID) {
                        orderPageEvents();
                        clearInterval(orderPage);
                    }
                }, 300);
                window.ctrwowCheckout.productListData.onProductListChange((productList) => {
                    orderPageEvents();
                });
            }

            var orderInfo = window.localStorage.getItem('orderInfo');
            var _location = window.localStorage.getItem('location');
            var isFiredMainOrderBlueshift = window.localStorage.getItem('isFiredMainOrderBlueshift');
            var __EA_ID = window._EA_ID || window.localStorage.getItem('_vid');
            if (!window.localStorage.getItem('landing')) {
                window.localStorage.setItem('landing', document.referrer);
            }
            function getPurchasedData(orderInfo, upsellInfo) {
                let orderNumber = orderInfo.orderNumber,
                    quantity = window.localStorage.getItem('doubleQuantity') ? orderInfo.quantity / 2 : orderInfo.quantity;
                    items = [
                        {
                            productId: orderInfo.orderedProducts[0].pid,
                            sku: orderInfo.orderedProducts[0].sku,
                            total_usd: orderInfo.orderTotalFull,
                            quantity: quantity
                        }
                    ];

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
                    ];
                }
                const product_ids = [];
                for (let i = 0, n = items.length; i < n; i++) {
                    product_ids.push(items[i].productId);
                }
                const data = {
                    order_id: orderNumber,
                    customer_id: orderInfo.customerId,
                    email: orderInfo.cusEmail,
                    order_create_date: getCurrentDate(),
                    ip_address: _location.ip || '',
                    customer_language: orderInfo.cusCountry,
                    // affid
                    // device
                    // internal_campaignname
                    // device_timezone
                    device_type: getDeviceType(),
                    device_vendor: window.navigator.vendor,
                    campaignname: campaignName,
                    landingurl: window.localStorage.getItem('landing') || '',
                    referringurl: document.referrer,
                    parentcampaign: window.localStorage.getItem('mainCampaignName'),
                    // external_payment_url
                    // one_click_purchase_reference
                    product_ids: product_ids,
                    items: items,
                    // revenue
                    currency: window.localStorage.getItem('currencyCode'),
                    // order_status
                    // landing_base_url
                }
                return data;
            }
            if (orderInfo && __EA_ID) {
                let identifyData = window.localStorage.getItem('identifyData');
                if (identifyData) {
                    identifyData = JSON.parse(identifyData);
                    blueshift.identify(identifyData);
                }

                orderInfo = JSON.parse(orderInfo);
                _location = JSON.parse(_location || '{}');
                if (!isFiredMainOrderBlueshift) {
                    console.log('BlueShift - Fire Purchase');
                    if (orderInfo.upsellUrls && orderInfo.upsellUrls.length > 0) {
                        orderInfo.upsellUrls[0].isFired = 'noFired';
                    }
                    blueshift.track('purchase', getPurchasedData(orderInfo));
                    window.localStorage.setItem('isFiredMainOrderBlueshift', true);
                }
                else if (orderInfo.upsellUrls && orderInfo.upsellUrls.length > 0) {
                    const latestUpsellIndex = orderInfo.upsellUrls.length - 1;
                    const upsellInfo = orderInfo.upsellUrls[latestUpsellIndex];
                    if (!orderInfo.upsellUrls[latestUpsellIndex].isFired) {
                        blueshift.track('purchase', getPurchasedData(orderInfo, upsellInfo));
                        orderInfo.upsellUrls[latestUpsellIndex].isFired = 'fired';
                    }
                }
                window.localStorage.setItem('orderInfo', JSON.stringify(orderInfo));
            }

            window.ctrwowUtils.events.on('onBeforePlaceUpsellOrder', function() {
                const upsellItem = window.ctrwowUpsell.productListData.getProductList().prices[window.upsell_productindex];
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
                    ];
                    const product_ids = [];
                    for (let i = 0, n = failProducts.length; i < n; i++) {
                        product_ids.push(failProducts[i].productId);
                    }
                    let declineData = {
                        order_create_date: getCurrentDate(),
                        ip_address: _location.ip || '',
                        // affid: '',
                        // device: '',
                        // internal_campaignname: '',
                        // device_timezone: '',
                        device_type: getDeviceType(),
                        device_vendor: window.navigator.vendor,
                        campaignname: prevItem.campaignName,
                        landingurl: window.localStorage.getItem('landing') || '',
                        referringurl: document.referrer,
                        parentcampaign: window.localStorage.getItem('mainCampaignName'),
                        // external_payment_url: '',
                        // one_click_purchase_reference: '',
                        // sku: '',
                        // total_usd: '',
                        // quantity: '',
                        product_ids: product_ids,
                        items: failProducts,
                        // order_status: '',
                        // landing_base_url: '',
                        // tracking_number: ''
                    }
                    if (orderInfo) {
                        declineData = {
                            ...declineData,
                            order_id: orderInfo.orderNumber,
                            customer_id: orderInfo.customerId,
                            customer_language: orderInfo.cusCountry
                        }
                    }
                    blueshift.track('decline', declineData);
                }
            }
        } catch(e) {
            console.log(e)
        }
    }

    window.addEventListener('load', function() {
        init();
    });
})();
