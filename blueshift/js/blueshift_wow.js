(() => {
    try {
        console.log('BlueShift');
        const getQueryParameter = function(param) {
            let href = '';
            if (location.href.indexOf('?')) {
                href = location.href.substr(location.href.indexOf('?'));
            }

            const value = href.match(new RegExp('[\?\&]' + param + '=([^\&]*)(\&?)', 'i'));
            return value ? value[1] : null;
        };
        const getCurrentDate = function() {
            const date = new Date();
            return date.toISOString();
        };
        const getDeviceType = function() {
            const ua = navigator.userAgent;
            if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
                return 'tablet';
            }
            if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
                return 'mobile';
            }
            return 'desktop';
        };

        const blueshiftID = getQueryParameter('isCardTest') === '1' ? 'fa8307145a64f9484defb6d8a18940f0' : '13c25a652e2a0c05cb06a3b1dba09a85';
        window._blueshiftid = blueshiftID;
        window.blueshift = window.blueshift || [];
        if(blueshift.constructor === Array) {
            blueshift.load = function() {
                var d = function(a) {
                    return function() { blueshift.push([a].concat(Array.prototype.slice.call(arguments,0))); };
                },
                e = ['identify', 'track', 'click', 'pageload', 'capture', 'retarget', 'presale_load', 'interstitial_load',  'upsell_load'];
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

        let campaignName = JSON.parse(window.__CTR_FP_TRACKING_SETTINGS.FP_TRACKING_CUSTOM_DATA).campaignName;
        let campaignInfo;
        window.orderFired = false;
        let countryCode = '';
        const orderPageEvents = function() {
            try {
                var regexInternationNumbers = new RegExp(/^(93|355|213|684|376|244|809|268|54|374|297|247|61|672|43|994|242|246|973|880|375|32|501|229|975|284|591|387|267|55|673|359|226|257|855|237|238|345|236|235|56|86|886|57|269|682|506|385|53|357|420|45|767|253|593|20|503|240|291|372|251|500|298|679|358|33|596|594|241|220|995|49|233|350|30|299|473|671|502|224|245|592|509|504|852|36|354|91|62|98|964|353|972|39|225|876|81|962|7|254|686|82|850|965|996|371|856|961|266|231|370|218|423|352|853|389|261|265|60|960|223|356|692|222|230|52|691|373|976|212|258|95|264|674|977|31|599|869|687|64|505|227|234|683|1670|47|968|92|680|507|675|595|51|63|48|351|1787|974|262|40|250|670|378|239|966|221|381|248|232|65|421|386|677|252|27|34|94|290|508|249|597|46|41|963|689|255|66|228|690|676|1868|216|90|993|688|256|380|971|44|598|1|678|58|84|1340|681|685|967|243|260|263)\d+/);
                const isInternationalNumbers = function(number) {
                    return regexInternationNumbers.test(number);
                };
                const getInternationalDialNumber = function(number) {
                    const find = number.match(regexInternationNumbers);
                    if (find) { return find[1]; }
                    return false;
                };

                window.localStorage.removeItem('isFiredMainOrderBlueshift');
                campaignInfo = window.__productListData.data.productList;

                if (!campaignInfo || !window._EA_ID || window.orderFired) { return; }
                console.log('BlueShift', campaignInfo, window._EA_ID);

                // countryCode = campaignInfo.location.countryCode;
                var checkedItemData = window.ctrwowCheckout.checkoutData.getProduct();
                window.orderFired = true;

                let phone_valid = '', phone_linetype = '', phone_carrier = '', international_format = '';
                const getIdentifyData = function() {
                    try {
                        const data = {
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
                        return {};
                    }
                };
                const getItemDataForCart = function(checkedItem) {
                    try {
                        const quantity = window.localStorage.getItem('doubleQuantity') ? checkedItem.quantity / 2 : checkedItem.quantity;
                        const landingurl = window.location.href;
                        const landingBaseUrl = landingurl.split('?')[0];
                        return {
                            // fingerprintId: window._EA_ID,
                            email: document.querySelector('[name="email"]').value || '',
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
                            // countryCode: campaignInfo.location.countryCode,
                            // regionCode: campaignInfo.location.regionCode,
                            // ip: campaignInfo.location.ip
                        };
                    } catch (e) {
                        console.log(e);
                        return {};
                    }
                };

                var inputs = Array.prototype.slice.call(document.querySelectorAll('[name="email"], [name="firstName"], [name="lastName"], [name="phoneNumber"]'));
                let identifyData = getIdentifyData();
                blueshift.identify(identifyData);

                const phoneNumberElm = $('input[name="phoneNumber"]');
                const countryDdl = document.querySelector('[name="shippingAddress"] [name="countryCode"]');
                let isTriggerCountryDDl = false;

                const callAPICheckPhone = function(isFromCountryDdl) {
                    try {
                        let phoneNumber = phoneNumberElm.val().match(/\d/g);
                        if (!phoneNumber) { return; }

                        phoneNumber = phoneNumber.join('');
                        let checkPhoneAPI = `//apilayer.net/api/validate?access_key=755a648d3837cf3adb128f29d322879a&number=${phoneNumber}`;
                        const isInternationalNumber = isInternationalNumbers(phoneNumber);
                        if (countryDdl && countryDdl.value) {
                            countryCode = countryDdl.value;
                        }
                        if (countryCode) {
                            if (!isInternationalNumber) {
                                checkPhoneAPI += `&country_code=${countryCode.toLowerCase()}`;
                            }
                            else if (isFromCountryDdl) {
                                if (isInternationalNumber) {
                                    const dialNumber = getInternationalDialNumber(phoneNumber);
                                    checkPhoneAPI = checkPhoneAPI.replace(dialNumber, '');
                                }
                                checkPhoneAPI += `&country_code=${countryCode.toLowerCase()}`;
                            }
                        }
                        if (getQueryParameter('validPhone') === '1') {
                            phoneNumberElm.rules('remove', 'cphone');
                        }
                        window.ctrwowUtils
                            .callAjax(checkPhoneAPI)
                            .then((result) => {
                                phone_valid = result.valid;
                                phone_linetype = result.line_type;
                                phone_carrier = result.carrier;
                                if (phone_valid) {
                                    phoneNumberElm.addClass('correct-phone');
                                    international_format = result.international_format;
                                    identifyData = getIdentifyData();
                                    blueshift.identify(identifyData);
                                    // blueshift.track('add_to_cart', getItemDataForCart(checkedItemData));
                                }
                                else if (getQueryParameter('validPhone') === '1') {
                                    phoneNumberElm.removeClass('correct-phone');
                                }

                                if (getQueryParameter('validPhone') === '1') {
                                    if (
                                        result.country_code &&
                                        countryDdl.value.toLowerCase() !== result.country_code.toLowerCase() &&
                                        countryDdl.querySelector(`option[value="${result.country_code}"]`) &&
                                        !isFromCountryDdl
                                    ) {
                                        isTriggerCountryDDl = true;
                                        countryDdl.value = result.country_code;
                                        countryDdl.dispatchEvent(new Event('change'));

                                        const shippingAddressFrm = $('form[name="shippingAddress"]').validate();
                                        shippingAddressFrm.element(countryDdl);
                                    }

                                    phoneNumberElm.rules('add', { cphone: true });
                                    const validator = $('form[name="customer"]').validate();
                                    validator.element(phoneNumberElm);

                                    isTriggerCountryDDl = false;
                                }
                            })
                            .catch((e) => {
                                console.log(e);
                            });
                    } catch (e) {
                        console.log(e);
                    }
                };

                if (getQueryParameter('validPhone') === '1') {
                    countryDdl && countryDdl.addEventListener('change', () => {
                        if (!isTriggerCountryDDl) {
                            callAPICheckPhone(true);
                        }
                    });
                }

                inputs.forEach(function(input) {
                    input.addEventListener('change', function (e) {
                        try {
                            identifyData = getIdentifyData();

                            if (e.currentTarget.getAttribute('name') === 'email' && document.querySelector('[name="email"]').classList.contains('valid')) {
                                console.log('BlueShift - Fire identify');
                                blueshift.identify(identifyData);
                                checkedItemData = window.ctrwowCheckout.checkoutData.getProduct();
                                blueshift.track('add_to_cart', getItemDataForCart(checkedItemData));
                            }

                            if (e.currentTarget.getAttribute('name') === 'phoneNumber') {
                                callAPICheckPhone();
                            }
                        } catch(x) {
                            console.log(x);
                        }
                    });
                });

                window.ctrwowUtils.events.on('onAfterActivePopup', function() {
                    try {
                        window.CC_Code = window.ctrwowCheckout.checkoutData.getCouponCode();
                        identifyData = getIdentifyData();
                        blueshift.identify(identifyData);
                    } catch (e) {
                        console.log(e);
                    }
                });

                window.ctrwowUtils.events.on('beforeSubmitOrder', function() {
                    try {
                        identifyData = getIdentifyData();
                        blueshift.identify(identifyData);
                        window.localStorage.setItem('identifyData', JSON.stringify(identifyData));

                        const curItem = window.ctrwowCheckout.checkoutData.getProduct();
                        curItem.campaignName = campaignName;
                        window.localStorage.setItem('prevItem', JSON.stringify(curItem));

                        console.log('BlueShift - Fire checkout');
                        const getProductsInCart = function() {
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
                            ip: campaignInfo.location.ip,
                            product_ids: product_ids,
                            items: items,
                            sku: productsInCart.sku,
                            // total_usd
                            currency: window.localStorage.getItem('currencyCode')
                            // quantity
                        });
                    } catch (e) {
                        console.log(e);
                    }
                });

                window.localStorage.setItem('location', JSON.stringify(campaignInfo.location)); // Save for Upsell

                window.ctrwowCheckout.checkoutData.onProductChange(function() {
                    try {
                        var currentItem = window.ctrwowCheckout.checkoutData.getProduct();

                        if (currentItem.productId === checkedItemData.productId) { return; }

                        if (
                            document.querySelector('[name="email"]') &&
                            document.querySelector('[name="email"]').classList.contains('valid')
                        ) {
                            // remove_from_cart
                            blueshift.track('remove_from_cart', getItemDataForCart(checkedItemData));
                            // add_to_cart
                            blueshift.track('add_to_cart', getItemDataForCart(currentItem));
                        }

                        checkedItemData = window.ctrwowCheckout.checkoutData.getProduct();
                    } catch (e) {
                        console.log(e);
                    }
                });
            } catch(e) {
                console.log(e);
            }
        };

        const init = function() {
            try {
                if (window.location.href.indexOf('/order') > -1) {
                    orderPageEvents();
                    let count = 0;
                    const orderPage = setInterval(() => {
                        count++;
                        if (window.__productListData.data.productList && window._EA_ID) {
                            orderPageEvents();
                            clearInterval(orderPage);
                        }
                        if (count === 50) { clearInterval(orderPage); }
                    }, 300);
                    window.ctrwowCheckout.productListData.onProductListChange(() => {
                        orderPageEvents();
                    });
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
                    try {
                        let orderNumber = orderInfo.orderNumber,
                            quantity = window.localStorage.getItem('doubleQuantity') ? Math.ceil(orderInfo.quantity / 2) : orderInfo.quantity,
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
                            ];
                            sku = upsellInfo.orderedProducts[0].sku;
                        }
                        const product_ids = [];
                        for (let i = 0, n = items.length; i < n; i++) {
                            product_ids.push(items[i].productId);
                        }
                        const landingurl = window.location.href;
                        const landingBaseUrl = landingurl.split('?')[0];
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
                    } catch (e) {
                        console.log(e);
                        return {};
                    }
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
                        ],
                        sku = prevItem.sku;
                        const product_ids = [];
                        for (let i = 0, n = failProducts.length; i < n; i++) {
                            product_ids.push(failProducts[i].productId);
                        }
                        const landingurl = window.location.href;
                        const landingBaseUrl = landingurl.split('?')[0];
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
        };

        const extendValidation = function() {
            try {
                const invalidPhoneNumberMsg = {
                    en: 'Please enter a valid phone number.',
                    de: 'Bitte geben Sie eine gültige Telefonnummer ein.',
                    fr: 'Veuillez saisir un numéro de téléphone valide.',
                    jp: '有効な電話番号を入力してください。',
                    cn: '请输入有效电话号码。',
                    br: 'Por favor insira um telefone válido.',
                    es: 'Por favor introduzca un número de teléfono válido.',
                    pt: 'Por favor insira um número de telefone válido.'
                };
                window.phoneMsg = invalidPhoneNumberMsg.en;
                const path = window.location.pathname;
                if (path.indexOf('/de/') > -1) { window.phoneMsg = invalidPhoneNumberMsg.de; }
                if (path.indexOf('/fr/') > -1) { window.phoneMsg = invalidPhoneNumberMsg.fr; }
                if (path.indexOf('/jp/') > -1) { window.phoneMsg = invalidPhoneNumberMsg.jp; }
                if (path.indexOf('/cn/') > -1) { window.phoneMsg = invalidPhoneNumberMsg.cn; }
                if (path.indexOf('/br/') > -1) { window.phoneMsg = invalidPhoneNumberMsg.br; }
                if (path.indexOf('/es/') > -1) { window.phoneMsg = invalidPhoneNumberMsg.es; }
                if (path.indexOf('/pt/') > -1) { window.phoneMsg = invalidPhoneNumberMsg.pt; }

                $.validator.addMethod('cphone', function(value, element) {
                    return $(element).hasClass('correct-phone');
                }, window.phoneMsg);
            } catch (e) {
                console.log(e);
            }
        };

        window.addEventListener('load', function() {
            init();
            if (getQueryParameter('validPhone') === '1') {
                extendValidation();
            }
        });
    } catch (e) {
        console.log(e);
    }
})();
