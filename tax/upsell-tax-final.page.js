(function (utils) {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    window.upsell_productindex = 0;
    window.fCurrency = utils.localStorage().get('jsCurrency') || '$######';
    const imgLoading = `<span class="js-img-loading">
                            <img src="//d16hdrba6dusey.cloudfront.net/sitecommon/images/loading-price-v1.gif" width="20" height="10" class="no-lazy"  style="width: 20px;">
                        </span>`;
    window.upsell = {
        orderInfo: JSON.parse(utils.localStorage().get('orderInfo')),
        products: [],
        upsellCampaignName: '',
        mainWebKey: siteSetting.webKey,
        upsellWebKey: window.upsellWebKey,
        CID: siteSetting.CID
    };

    if(upsell.orderInfo) {
        console.log(`used field useCreditCard ${upsell.orderInfo.useCreditCard}`);
    }

    const eCRM = new EmanageCRMJS({
        webkey: upsell.mainWebKey,
        cid: upsell.CID,
        lang: '',
        isTest: utils.getQueryParameter('isCardTest') ? true : false
    });

    function replaceBracketsStrings() {
        const allElements = _qAll('body *');
        for (let elem of allElements) {
            if (elem.children.length === 0 || elem.tagName.toLowerCase() === 'span') {
                elem.innerHTML = elem.innerHTML.replace(/{price}/g, '<span class="spanUpsellPrice"></span>');
                elem.innerHTML = elem.innerHTML.replace(/{FirstCharge}/g, '<span class="spanFirstCharge"></span>');
                elem.innerHTML = elem.innerHTML.replace(/{RemainAmount}/g, '<span class="spanRemainAmount"></span>');
                elem.innerHTML = elem.innerHTML.replace(/{fullprice}/g, '<span class="spanFullPrice"></span>');
                elem.innerHTML = elem.innerHTML.replace(/{shippingFee}/g, '<span class="spanShippingFee"></span>');
            }
        }
    }
    replaceBracketsStrings();

    function implementTax(selectedProduct) {
        const taxUpsellItem = window.taxArray.find((item) => item.productId === selectedProduct.productId);
        const shippingFee = selectedProduct.shippings[0].price;
        const shippingFeeFormatted = selectedProduct.shippings[0].formattedPrice;
        const totalPrice = taxUpsellItem.totalPrice + taxUpsellItem.taxAmount + shippingFee;

        Array.prototype.slice.call(_qAll('.spanUpsellPrice')).forEach(spanUpsellPrice => {
            spanUpsellPrice.textContent = utils.formatPrice(totalPrice.toFixed(2), fCurrency, shippingFeeFormatted);
        });

        Array.prototype.slice.call(_qAll('.unit-price, .spanUnitUpsellPrice')).forEach((elm) => {
            const qty = selectedProduct.quantity;
            const unitPrice = totalPrice / qty;
            elm.textContent = utils.formatPrice(unitPrice.toFixed(2), fCurrency, shippingFeeFormatted);
        });
    }

    function callTaxAjax(postData, selectedProduct) {
        const url = `${eCRM.Order.baseAPIEndpoint}/orders/CreateEstimate/${siteSetting.webKey}`;

        const options = {
            method: 'POST',
            headers: {
                'X_CID': siteSetting.CID
            },
            data: postData
        };

        renderTaxRow();
        utils.callAjax(url, options)
            .then((result) => {
                let items = [];
                if (!result) {
                    items = postData.items.map((item) => {
                        item.taxAmount = 0;
                        item.taxRate = 0;
                        return item
                    });
                }
                else {
                    items = result.items;
                }
                utils.events.emit('bindTax');
                window.taxArray = items;
                implementTax(selectedProduct);
            })
            .catch(() => {
                let items = postData.items.map((item) => {
                    item.taxAmount = 0;
                    item.taxRate = 0;
                    return item
                });
                utils.events.emit('bindTax');
                window.taxArray = items;
                implementTax(selectedProduct);
            });
    }

    function convertCurrency() {
        let jsCurrencyCode = window.fCurrency;
        if (!jsCurrencyCode) return;

        let currencyElms = Array.prototype.slice.call(_qAll('.jsCurrency, .jsCurrencyNumber'));
        currencyElms.forEach((currencyElm) => {
            currencyElm.textContent = jsCurrencyCode.replace("######", item.textContent);
        });
    }

    function implementData(products) {
        upsell.products = products.prices;
        upsell.upsellCampaignName = typeof products.campaignName !== 'undefined' ? products.campaignName : '';
        console.log(products);

        convertCurrency();

        Array.prototype.slice.call(_qAll('.spanUpsellPrice')).forEach((spanUpsellPrice) => {
            spanUpsellPrice.innerHTML = products.prices[0].productPrices.DiscountedPrice.FormattedValue;
        });

        Array.prototype.slice.call(_qAll('.spanFullPrice')).forEach((spanFullPrice) => {
            spanFullPrice.innerHTML = products.prices[0].productPrices.FullRetailPrice.FormattedValue;
        });

        Array.prototype.slice.call(_qAll('.spanShippingFee')).forEach((spanShippingFee) => {
            spanShippingFee.innerHTML = products.prices[0].shippings[0].formattedPrice;
        });

        Array.prototype.slice.call(_qAll('.spanFirstCharge')).forEach((spanFirstCharge) => {
            if (products.prices[0].productPrices.hasOwnProperty('PreSaleAmount1')) {
                spanFirstCharge.innerHTML = products.prices[0].productPrices.PreSaleAmount1.FormattedValue;
            }
            else {
                spanFirstCharge.innerHTML = products.prices[0].productPrices.DiscountedPrice.FormattedValue;
            }
        });

        Array.prototype.slice.call(_qAll('.spanRemainAmount')).forEach((spanRemainAmount) => {
            if (!products.prices[0].productPrices.hasOwnProperty('PreSaleAmount1')) {
                return;
            }
            let remainAmountNumber = products.prices[0].productPrices.DiscountedPrice.Value - products.prices[0].productPrices.PreSaleAmount1.Value;
            spanRemainAmount.innerHTML = utils.formatPrice(remainAmountNumber.toFixed(2), window.fCurrency, products.prices[0].productPrices.DiscountedPrice.FormattedValue);
        });

        // bind tax
        if (window.localStorage.getItem('bindTax') === 'true') {
            const selectedProduct = window.upsell.products[window.upsell_productindex];
            const postData = {
                items: [],
                customerAddress: JSON.parse(window.localStorage.getItem('customerAddress'))
            };

            /**
             * ! Post All Product Items
             */
            postData.items = window.upsell.products.map((item) => {
                const quantity = window.isDoubleQuantity ? item.quantity / 2 : item.quantity;
                return {
                    'productId': item.productId,
                    'sku': item.sku,
                    'quantity': quantity,
                    'unitPrice': item.productPrices.UnitDiscountRate.Value,
                    'totalPrice': item.productPrices.DiscountedPrice.Value,
                    'description': item.productName
                }
            });

            Array.prototype.slice.call(_qAll('.spanUpsellPrice')).forEach(spanUpsellPrice => {
                spanUpsellPrice.innerHTML = imgLoading;
            });

            callTaxAjax(postData, selectedProduct);
        }
    }

    function getProduct() {
        const eCRM2 = new EmanageCRMJS({
            webkey: upsell.upsellWebKey,
            cid: upsell.CID,
            lang: '',
            isTest: utils.getQueryParameter('isCardTest') ? true : false
        });

        eCRM2.Campaign.getProducts(function (products) {
            implementData(products);
        });
    }
    if (!window.isNotCallApiUpsell) {
        getProduct();
    }
    else {
        utils.events.on('triggerQuantity', implementData);
    }

    function handleBasicUpsellCTAButton() {
        const ctaButtons = _qAll('.js-btn-place-upsell-order');
        if (ctaButtons) {
            Array.prototype.slice.call(ctaButtons).forEach(ele => {
                ele.addEventListener('click', function (e) {
                    e.preventDefault();
                    placeUpsellOrder();
                });
            });
        }

        const noThankBtns = _qAll('.js-btn-no-thanks');
        for (let noThankBtn of noThankBtns) {
            noThankBtn.addEventListener('click', function (e) {
                e.preventDefault();
                cancelUpsellOrder();
            });
        }
    }

    function placeUpsellOrder() {
        const upsellData = getUpsellData();

        utils.showAjaxLoading();
        eCRM.Order.placeUpsellOrder(upsellData, upsell.upsellWebKey, function (result) {
            utils.saveInfoToLocalForUpsells(result, upsell);
        });
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
                //store param in localStorage to fire gtm event of purchase
                utils.localStorage().set('fireUpsellForGTMPurchase', upParam);
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

        /*
            5, 31 : paypal
            39: afterpay
            42: ideal,
            41: sofort
        */
        //if (upsell.orderInfo.paymentProcessorId == "5" || upsell.orderInfo.paymentProcessorId == "31") { old code
        if (!upsell.orderInfo.useCreditCard && upsell.orderInfo.paymentProcessorId) {
            pay = {
                paymentProcessorId: Number(upsell.orderInfo.paymentProcessorId)
            };
        }
        else {
            //add installment for upsell
            if (!!upsell.orderInfo.installmentValue && upsell.orderInfo.installmentValue !== "") {
                pay.Instalments = upsell.orderInfo.installmentValue;
            }
        }

        //add callback param to server to keep track
        let replacedParam = location.search.replace(/\?|\&*paymentId=[^&]*/g, '').replace(/\?|\&*token=[^&]*/g, '').replace(/\?|\&*PayerID=[^&]*/g, '');
        pay.callBackParam = replacedParam !== '' ? '?' + replacedParam + '&' + getUpParam() : '?' + getUpParam();

        let antiFraud;
        try {
            antiFraud = JSON.parse(utils.localStorage().get("antiFraud"));
        }
        catch (ex) {
            console.log(ex);
            antiFraud = null;
        }

        var upsellData = {
            campaignUpsell: {
                webKey: upsell.mainWebKey,
                relatedOrderNumber: upsell.orderInfo.orderNumber
            },
            shippingMethodId: upsell.products[window.upsell_productindex].shippings.length > 0 ? upsell.products[window.upsell_productindex].shippings[0].shippingMethodId : null,
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

        if (!!window.multipleMiniUpsells && window.multipleMiniUpsells.length > 0) {
            upsellData.multipleMiniUpsells = window.multipleMiniUpsells;
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
        if (!!window.clickNoSkipStep && Number(window.clickNoSkipStep) > 0) {
            upsell.orderInfo.upsellIndex += Number(window.clickNoSkipStep);
        }
        utils.localStorage().set('orderInfo', JSON.stringify(upsell.orderInfo));

        if (upsell.orderInfo.upsellIndex < upsell.orderInfo.upsells.length) {
            let upsellUrl = upsell.orderInfo.upsells[upsell.orderInfo.upsellIndex].upsellUrl;
            const redirectUrl = upsellUrl.substring(upsellUrl.lastIndexOf('/') + 1, upsellUrl.indexOf('?') >= 0 ? upsellUrl.indexOf('?') : upsellUrl.length);
            utils.redirectPage(redirectUrl + '?' + upParam);
        } else {
            handleLastUpsellOrError();
        }
    }

    utils.checkAffAndFireEvents();

    /*
    utils.fireCakePixel();
    utils.fireEverFlow();
    utils.firePicksell();
    */

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
