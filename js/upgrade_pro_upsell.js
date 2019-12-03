(function (utils) {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    window.upsell_productindex = 0;

    let upsell = {
        orderInfo: JSON.parse(utils.localStorage().get('orderInfo')),
        products: [],
        mainWebKey: siteSetting.webKey,
        upsellWebKey: window.upsellWebKey,
        CID: siteSetting.CID
    };

    const eCRM = new EmanageCRMJS({
        webkey: upsell.mainWebKey,
        cid: upsell.CID,
        lang: '',
        isTest: utils.getQueryParameter('isCardTest') ? true : false
    });

    function replaceBracketsStrings() {
        const allElements = _qAll('body *');
        for(let elem of allElements) {
            if(elem.children.length === 0 || elem.tagName.toLowerCase() === 'span') {
                elem.innerHTML = elem.innerHTML.replace(/{price}/g, '<span class="spanUpsellPrice"></span>');
                elem.innerHTML = elem.innerHTML.replace(/{fullprice}/g, '<span class="spanFullPrice"></span>');
            }
        }
    }
    replaceBracketsStrings();

    function getProduct() {
        const eCRM2 = new EmanageCRMJS({
            webkey: upsell.upsellWebKey,
            cid: upsell.CID,
            lang: '',
            isTest: utils.getQueryParameter('isCardTest') ? true : false
        });

        eCRM2.Campaign.getProducts(function (products) {
            const fvalue = products.prices[0].shippings[0].formattedPrice.replace(/[,|.]/g, ''),
                pValue = products.prices[0].shippings[0].price.toFixed(2).toString().replace(/\./, ''),
                fCurrency = fvalue.replace(pValue, '######');

            upsell.products = products.prices.filter((price) => {
                if(upsell.orderInfo.quantity === price.quantity) {
                    if(utils.localStorage().get('isSpecialOffer') === 'true') {
                        if(price.sku.match(/_/g).length === 2) {
                            return true;
                        }
                    }
                    else if(!price.sku.match(/_/g) || price.sku.match(/_/g).length < 2) {
                        return true;
                    }
                }
                else {
                    return false;
                }
            });
            console.log(upsell.products);
            _q('.js-basic-upsell-cta-button').classList.remove('disabled');

            const spanUpsellPriceElems = _qAll('.spanUpsellPrice');
            for(let spanUpsellPrice of spanUpsellPriceElems) {
                let upgradeDiscountPrice = upsell.products[0].productPrices.DiscountedPrice.Value - upsell.orderInfo.orderTotal;
                upgradeDiscountPrice = upgradeDiscountPrice + upgradeDiscountPrice * upsell.orderInfo.lifetimeRate;
                spanUpsellPrice.innerHTML = utils.formatPrice(upgradeDiscountPrice.toFixed(2), fCurrency, upsell.products[0].shippings[0].formattedPrice);
            }

            const spanFullPriceElems = _qAll('.spanFullPrice');
            for(let spanFullPrice of spanFullPriceElems) {
                let upgradeFullPrice = upsell.products[0].productPrices.FullRetailPrice.Value;
                upgradeFullPrice = upgradeFullPrice + upgradeFullPrice * upsell.orderInfo.lifetimeRate;
                spanFullPrice.innerHTML = utils.formatPrice(upgradeFullPrice.toFixed(2), fCurrency, upsell.products[0].shippings[0].formattedPrice);
            }
        });
    }
    getProduct();

    function handleBasicUpsellCTAButton() {
        const ctaButtons = _qAll('.js-btn-place-upsell-order');
        if(ctaButtons) {
            Array.prototype.slice.call(ctaButtons).forEach(ele => {
                ele.addEventListener('click', function (e) {
                    e.preventDefault();
                    upgradeOrder();
                });
            });
        }

        _q('.js-btn-no-thanks').addEventListener('click', function (e) {
            e.preventDefault();
            cancelUpsellOrder();
        });
    }
    let Helpers = {
        _ajaxError: function(response) {
            switch (response.status) {
                case 400:
                    return Promise.reject(new Error("Bad Request The request could not be understood or was missing required parameters."));
                    break;
                case 401:
                    return Promise.reject(new Error("Unauthorized Authentication failed or user doesn't have permissions for requested operation."));
                    break;
                default:
                    return Promise.reject(new Error(response.statusText));
                    break;
            }
        },
        callAjax: function(url, options = {}) {
            let setting = {
                method: typeof options.method === 'undefined' ? 'GET' : options.method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (setting.method === 'POST') {
                setting.body = typeof options.data === 'undefined' ? null : JSON.stringify(options.data);
            }

            if (typeof options.cid !== 'undefined') {
                setting.headers.X_CID = typeof options.cid === 'undefined' ? '' : options.cid;
            }

            const promise = new Promise((resolve, reject) => {
                fetch(url, setting)
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            this._ajaxError(response);
                        }
                    })
                    .then(result => {
                        resolve(result);
                    })
                    .catch(error => {
                        reject(error);
                    })
            })

            return promise;
        }
    };

    function saveInforForUpsellPage(orderResponse) {
        var orderInfo = JSON.parse(utils.localStorage().get('orderInfo'));
        orderInfo.upsellIndex += 1;
        upsell.orderInfo.upsellIndex += 1;
        // orderInfo.cardId = orderResponse.cardId;
        // orderInfo.paymentProcessorId = orderResponse.paymentProcessorId;
        orderInfo.orderTotal = upsell.products[0].productPrices.DiscountedPrice.Value;
        orderInfo.savedTotal = upsell.products[0].productPrices.FullRetailPrice.Value - orderInfo.orderTotal;
        orderInfo.orderedProducts.sku = upsell.products[0].sku;
        /*orderInfo = {
            'upsells': orderResponse.upsells,
            'upsellIndex': 0,
            'countryCode': siteSetting.countryCode, //siteSetting.countryCode is bind from widget_productlist.js
            'orderNumber': orderResponse.orderNumber,
            'cusEmail': _qById('customer_email').value,
            'cardId': orderResponse.cardId,
            'paymentProcessorId': orderResponse.paymentProcessorId,
            'addressId': orderResponse.customerResult.shippingAddressId,
            'orderTotal': product.productPrices.DiscountedPrice.Value,
            'savedTotal': product.productPrices.FullRetailPrice.Value - product.productPrices.DiscountedPrice.Value,
            'quantity': product.quantity,
            'orderedProducts': [
                {
                    type: 'main',
                    sku: product.sku,
                    name: _qById('productname_' + product.productId) ? _qById('productname_' + product.productId).value : ''
                }
            ],
            installmentValue: _qById('ddl_installpayment') ? _qById('ddl_installpayment').value : '',
            installmentText: (window.widget && window.widget.installmentpayment) ? window.widget.installmentpayment.optionText : ''
        };*/

        utils.localStorage().set('orderInfo', JSON.stringify(orderInfo));
        return orderInfo;
    }

    function upgradeOrder() {
        // const upsellData = getUpsellData();
        let pay = {
            cardId: upsell.orderInfo.cardId
        };

        if (upsell.orderInfo.paymentProcessorId == "5") {
            pay = {
                paymentProcessorId: 5
            };
        }
        let replacedParam = location.search.replace(/\?|\&*paymentId=[^&]*/g, '').replace(/\?|\&*token=[^&]*/g, '').replace(/\?|\&*PayerID=[^&]*/g, '');
        pay.callBackParam = replacedParam !== '' ? '?' + replacedParam + '&' + getUpParam() : '?' + getUpParam();

        let antiFraud;
        try {
            antiFraud = JSON.parse(utils.localStorage().get("antiFraud"));
        } catch (ex) {
            console.log(ex);
            antiFraud = null;
        }

        utils.showAjaxLoading();

        // Chinh
        const postAPI = `${eCRM.Order.baseAPIEndpoint}/orders/${upsell.orderInfo.orderNumber}/${upsell.products[0].productId}`;
        const orderData = {
            "productId": upsell.orderInfo.orderedProducts[0].pid,
            "shippingMethodId": upsell.products[window.upsell_productindex].shippings.length > 0 ? upsell.products[window.upsell_productindex].shippings[0].shippingMethodId: null,
            "comment": "",
            "useShippingAddressForBilling": true,
            "customer": {
                email: upsell.orderInfo.cusEmail
            },
            "payment": pay,
            "funnelBoxId": 0,
            "shippingAddress": upsell.orderInfo.addressId != null ? { id: upsell.orderInfo.addressId } : null,
            "billingAddress": null,
            "antiFraud": {
                "sessionId": antiFraud ? antiFraud.sessionId : ''
            }
        };
        Helpers.callAjax(postAPI, {
            cid: eCRM.Order.cid,
            method: 'POST',
            data: orderData
        })
        .then(result => {
            if (result && result.success) {
                //store param in localStorage to fire gtm event of purchase
                utils.localStorage().set('fireUpsellForGTMPurchase', getUpParam().split('=')[0]);

                let orderInfo = saveInforForUpsellPage(result);
                utils.localStorage().set('paypal_isMainOrder', 'main');
                utils.localStorage().set('webkey_to_check_paypal', upsell.upsellWebKey);

                if(result.upsells.length < 1 && orderInfo.upsells.length > 0) {
                    result.upsells = orderInfo.upsells;
                }
                if (result.callBackUrl) {
                    document.location = result.callBackUrl;
                }
                else if (result.paymentContinueResult && result.paymentContinueResult.actionUrl !== "") {
                    document.location = result.paymentContinueResult.actionUrl;
                }
                else if (upsell.orderInfo.upsellIndex < upsell.orderInfo.upsells.length) {
                    /*const redirectUrl = result.upsells[orderInfo.upsellIndex].upsellUrl.substr(result.upsells[orderInfo.upsellIndex].upsellUrl.lastIndexOf('/') + 1);
                    location.href = redirectUrl + '&' + getUpParam();*/
                    let upsellUrl = upsell.orderInfo.upsells[upsell.orderInfo.upsellIndex].upsellUrl;
                    const redirectUrl = upsellUrl.substring(upsellUrl.lastIndexOf('/') + 1, upsellUrl.indexOf('?') >= 0 ? upsellUrl.indexOf('?') : upsellUrl.length);
                    utils.redirectPage(redirectUrl + '?' + getUpParam());
                }
                else {
                    utils.redirectPage(siteSetting.successUrl);
                }
            }
            else {
                utils.redirectPage(siteSetting.successUrl);
            }
        }).catch(err => {
            utils.redirectPage(siteSetting.declineUrl);
        });
        // End chinh
    }

    function getUpParam() {
        let upParam = '';
        if (location.href.split('special-offer-', 2).length > 1) {
            upParam = 'up_' + location.href.split('special-offer-', 2)[1].split('.html', 1) + '=1';
        }
        return upParam;
    }

    function handleLastUpsellOrError() {
        let upParam = '';
        if (location.href.split('special-offer-', 2).length > 1) {
            upParam = '?up_' + location.href.split('special-offer-', 2)[1].split('.html', 1);

            if (upsell.orderInfo.isUpsellOrdered == 1) {
                upParam += '=1';
            } else {
                upParam += '=0';
            }
        }

        let redirectUrl = siteSetting.successUrl;
        utils.redirectPage(redirectUrl + upParam);
    }

    function getUpsellData() {
        let pay = {
            cardId: upsell.orderInfo.cardId
        };

        if (upsell.orderInfo.paymentProcessorId == "5") {
            pay = {
                paymentProcessorId: 5
            };
        }

        //add callback param to server to keep track
        let replacedParam = location.search.replace(/\?|\&*paymentId=[^&]*/g, '').replace(/\?|\&*token=[^&]*/g, '').replace(/\?|\&*PayerID=[^&]*/g, '');
        pay.callBackParam = replacedParam !== '' ? '?' + replacedParam + '&' + getUpParam() : '?' + getUpParam();

        let antiFraud;
        try {
            antiFraud = JSON.parse(utils.localStorage().get("antiFraud"));
        } catch (ex) {
            console.log(ex);
            antiFraud = null;
        }

        var upsellData = {
            campaignUpsell: {
                webKey: upsell.mainWebKey,
                relatedOrderNumber: upsell.orderInfo.orderNumber
            },
            shippingMethodId: upsell.products[window.upsell_productindex].shippings.length > 0 ? upsell.products[window.upsell_productindex].shippings[0].shippingMethodId: null,
            comment: '',
            useShippingAddressForBilling: true,
            productId: upsell.products[window.upsell_productindex].productId,
            customer: { email: upsell.orderInfo.cusEmail },
            payment: pay,
            shippingAddress: upsell.orderInfo.addressId != null ? { id: upsell.orderInfo.addressId } : null,
            funnelBoxId: 0,
            antiFraud: {
                sessionId: antiFraud ? antiFraud.sessionId : ''
            }
        }

        return upsellData;
    }

    function cancelUpsellOrder() {
        //update localStorage
        upsell.orderInfo.isUpsellOrdered = 0;

        let upParam = '';
        if (location.href.split('special-offer-', 2).length > 1) {
            upParam = 'up_' + location.href.split('special-offer-', 2)[1].split('.html', 1) + '=0';
        }

        upsell.orderInfo.upsellIndex += 1;
        utils.localStorage().set('orderInfo', JSON.stringify(upsell.orderInfo));

        if (upsell.orderInfo.upsellIndex < upsell.orderInfo.upsells.length) {
            let upsellUrl = upsell.orderInfo.upsells[upsell.orderInfo.upsellIndex].upsellUrl;
            const redirectUrl = upsellUrl.substring(upsellUrl.lastIndexOf('/') + 1, upsellUrl.indexOf('?') >= 0 ? upsellUrl.indexOf('?') : upsellUrl.length);
            utils.redirectPage(redirectUrl + '?' + upParam);
        } else {
            handleLastUpsellOrError();
        }
    }

    //Fire Cake Pixel
    utils.fireCakePixel();
    utils.fireEverFlow();
    utils.firePicksell();

    /*--------start : run common upsell------------*/
    const CommonUpsell = utils.CommonUpsell;
    class Upsell extends CommonUpsell {
    }
    const insUpsell = new Upsell();
    insUpsell.init();
    /*--------/end : run common upsell------------*/

    document.addEventListener('DOMContentLoaded', function () {
        handleBasicUpsellCTAButton();
    });
})(window.utils);
