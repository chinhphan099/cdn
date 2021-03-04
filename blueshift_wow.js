window._blueshiftid='fa8307145a64f9484defb6d8a18940f0';window.blueshift=window.blueshift||[];if(blueshift.constructor===Array){blueshift.load=function(){var d=function(a){return function(){blueshift.push([a].concat(Array.prototype.slice.call(arguments,0)))}},e=["identify","track","click","pageload","capture","retarget"];for(var f=0;f<e.length;f++)blueshift[e[f]]=d(e[f])};}
blueshift.load();
blueshift.pageload();
if(blueshift.constructor===Array){(function(){var b=document.createElement("script");b.type="text/javascript",b.async=!0,b.src=("https:"===document.location.protocol?"https:":"http:")+"//cdn.getblueshift.com/blueshift.js",b.defer=true;var c=document.getElementsByTagName("script")[0];c.parentNode.insertBefore(b,c);})()}

function init() {
    try {
        if (window.location.href.indexOf('order') > -1) {
            window.localStorage.removeItem('isFiredPurchaseBlueshift');
            var campaignInfo = __productListData.data.productList;

            console.log(1111, campaignInfo, window._EA_ID);
            if (!campaignInfo || !window._EA_ID) {
                return;
            }

            var inputs = Array.prototype.slice.call(document.querySelectorAll('[name="email"], [name="firstName"], [name="lastName"]'));
            var isFireIdentify = false;
            blueshift.identify({
                fingerprintId: window._EA_ID,
                email: document.querySelector('[name="email"]').value || '',
                firstname: document.querySelector('[name="firstName"]').value || '',
                lastname: document.querySelector('[name="lastName"]').value || '',
                joined_at: new Date(),
                referrer: document.referrer
            });

            inputs.forEach(function(input) {
                input.addEventListener('change', function (e) {
                    if (document.querySelector('[name="email"]').classList.contains('valid') && !isFireIdentify) {
                        console.log('BlueShift - Fire identify')
                        isFireIdentify = true;
                        blueshift.identify({
                            fingerprintId: window._EA_ID,
                            email: document.querySelector('[name="email"]').value,
                            firstname: document.querySelector('[name="firstName"]').value || '',
                            lastname: document.querySelector('[name="lastName"]').value || '',
                            joined_at: new Date(),
                            referrer: document.referrer
                        });
                    }
                });
            });

            var productList = campaignInfo.prices;
            window.localStorage.setItem('location', JSON.stringify(campaignInfo.location)); // Save for Upsell

            var products = [];
            var productElms = Array.prototype.slice.call(document.querySelectorAll('.js-list-item'));
            productElms.forEach(function(productElm) {
                var productId = productElm.dataset.id;

                if (productId) {
                    var price = productList.find((pro) => {
                        return pro.productId === Number(productId);
                    })
                    products.push({
                        productId: price.productId,
                        sku: price.sku
                    })
                }
            });

            var checkedItemData = window.ctrwowCheckout.checkoutData.getProduct();
            window.ctrwowCheckout.checkoutData.onProductChange(function() {
                var currentItem = window.ctrwowCheckout.checkoutData.getProduct();

                if (currentItem.productId === checkedItemData.productId) {
                    return;
                }

                // remove_from_cart
                blueshift.track('remove_from_cart', {
                    fingerprintId: window._EA_ID,
                    productId: checkedItemData.productId,
                    sku: checkedItemData.sku,
                    referrer: document.referrer,
                    countryCode: campaignInfo.location.countryCode,
                    regionCode: campaignInfo.location.regionCode,
                    ip: campaignInfo.location.ip
                });

                // add_to_cart
                blueshift.track('add_to_cart', {
                    fingerprintId: window._EA_ID,
                    productId: currentItem.productId,
                    sku: currentItem.sku,
                    referrer: document.referrer,
                    countryCode: campaignInfo.location.countryCode,
                    regionCode: campaignInfo.location.regionCode,
                    ip: campaignInfo.location.ip
                });

                checkedItemData = window.ctrwowCheckout.checkoutData.getProduct();
            });

            console.log('BlueShift - Fire checkout');
            blueshift.track('checkout', {
                fingerprintId: window._EA_ID,
                products: products,
                referrer: document.referrer,
                countryCode: campaignInfo.location.countryCode,
                regionCode: campaignInfo.location.regionCode,
                ip: campaignInfo.location.ip
            });
        }

        var orderInfo = window.localStorage.getItem('orderInfo');
        var _location = window.localStorage.getItem('location');
        var isFiredPurchaseBlueshift = window.localStorage.getItem('isFiredPurchaseBlueshift');
        var __EA_ID = window._EA_ID || window.localStorage.getItem('_vid');
        if (orderInfo && !isFiredPurchaseBlueshift && __EA_ID) {
            orderInfo = JSON.parse(orderInfo);
            _location = JSON.parse(_location || '{}');
            console.log('BlueShift - Fire Purchase');
            blueshift.track('purchase', {
                fingerprintId: __EA_ID,
                email: orderInfo.cusEmail,
                phoneNumber: orderInfo.cusPhone,
                firstName: orderInfo.cusFirstName,
                lastName: orderInfo.cusLastName,
                order_id: orderInfo.orderNumber,
                total: orderInfo.orderTotalFull,
                referrer: document.referrer,
                countryCode: orderInfo.cusCountry,
                regionCode: orderInfo.cusState,
                ip: _location.ip || '',
                products: [
                    {
                        productId: orderInfo.orderedProducts[0].pid,
                        sku: orderInfo.orderedProducts[0].sku,
                        price: orderInfo.orderTotal,
                        quantity: orderInfo.quantity
                    }
                ]
            });
            window.localStorage.setItem('isFiredPurchaseBlueshift', true);
        }
    } catch(e) {
        console.log(e)
    }
}

window.addEventListener('load', function() {
    init();
});
