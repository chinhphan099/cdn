(function (utils) {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    const eCRM = new EmanageCRMJS({
        webkey: siteSetting.webKey,
        cid: siteSetting.CID,
        lang: '',
        isTest: utils.getQueryParameter('isCardTest') ? true : false
    });

    let upgradeItemId, currentIndex, btnParamId,
        diggyPopup = _qById('diggyPopup'),
        dummyInput = _q('#product_00');

    function renderPriceFor2ndPop(isUpgradedOne) {
        let listPkgElm = _q('.js-list-group li.active'),
            upgradeItemPid0, upgradeItem0, listPidUpgrade1, upgradeItemPid1;

        if (isUpgradedOne) {
            upgradeItemPid0 = Number(listPkgElm.dataset.pidupgrade.split(',')[currentIndex]);
            upgradeItem0 = window.PRICES.filter(elm => elm.productId === upgradeItemPid0)[0];

            listPidUpgrade1 = listPkgElm.dataset.pidupgrade1.split(',');
        }
        else {
            upgradeItem0 = window.defaultProduct;
            listPidUpgrade1 = listPkgElm.dataset.pidupgrade2.split(',');
        }

        upgradeItemPid1 = Number(listPidUpgrade1[currentIndex]); // Get PID upgrade 1 or 2
        window.upgradeItem1 = window.PRICES.filter(elm => elm.productId === upgradeItemPid1)[0] || null; // Get Product upgrade 1 or 2

        window.additionPrice = window.upgradeItem1.productPrices.DiscountedPrice.Value - upgradeItem0.productPrices.DiscountedPrice.Value;
        if (!!window.upgradeItem1) {
            Array.prototype.slice.call(_qAll('#second_popup_buy_one_more .total-quantity')).forEach((elm) => {
                elm.textContent = !!window.isDoubleQuantity ? window.upgradeItem1.quantity / 2 : window.upgradeItem1.quantity;
            });
            Array.prototype.slice.call(_qAll('#second_popup_buy_one_more .addition-price')).forEach((elm) => {
                elm.textContent = utils.formatPrice(window.additionPrice.toFixed(2), window.fCurrency, window.upgradeItem1.productPrices.DiscountedPrice.FormattedValue);
            });
        }
    }

    //Render dynamic price for popup content while input changed
    function renderPrice() {
        let productData = JSON.parse(_q('input[name="product"]:checked').dataset.product),
            listPkgElm = _q('.js-list-group li.active'),
            listPidPkg = listPkgElm.dataset.package.split(','),
            listPidUpgrade = listPkgElm.dataset.pidupgrade.split(',');

        currentIndex = listPidPkg.indexOf(productData.productId.toString());

        let doublePid = Number(listPidUpgrade[currentIndex]),
            upgradeItem = window.PRICES.filter(elm => elm.productId === doublePid)[0];

        if (!upgradeItem) {
            console.log('Error: Double item not exist');
            return;
        }
        window.additionPriceValue = upgradeItem.productPrices.DiscountedPrice.Value - productData.productPrices.DiscountedPrice.Value;
        /* if (!!window.isPreOrder && !!productData.productPrices.hasOwnProperty('PreSaleAmount1') && !!upgradeItem.productPrices.hasOwnProperty('PreSaleAmount1')) {
            window.additionPriceValue = (upgradeItem.productPrices.DiscountedPrice.Value + upgradeItem.productPrices.PreSaleAmount1.Value) - (productData.productPrices.DiscountedPrice.Value + productData.productPrices.PreSaleAmount1.Value);
        }*/
        if (productData.quantity > 1) {
            diggyPopup.classList.add('plural-item');
        }
        else {
            diggyPopup.classList.remove('plural-item');
        }

        //Dynamic content
        let dynamicProductName = _qAll('.dynamic-name'),
            dynamicDescription = _qAll('.dynamic-desc'),
            selectedInputParent = _q('input[name="product"]:checked').parentNode;

        if (dynamicProductName.length > 0) {
            let rootName = selectedInputParent.querySelector('.root-name');
            for (let item of dynamicProductName) {
                //Detect using custom class
                if (!!rootName) {
                    item.innerHTML = rootName.innerHTML;
                }
                else if (!!selectedInputParent && selectedInputParent.querySelectorAll('.product-name p').length > 0) {
                    item.innerHTML = selectedInputParent.querySelectorAll('.product-name p')[0].innerHTML;
                }
            }
        }

        if (dynamicDescription.length > 0) {
            let rootDesc = selectedInputParent.querySelector('.root-desc');
            for (let item of dynamicDescription) {
                if (!!rootDesc) {
                    item.innerHTML = rootDesc.innerHTML;
                }
                else if (typeof dynamicProductDescription !== 'undefined') {
                    item.innerHTML = dynamicProductDescription[doublePid];
                }
            }
        }

        Array.prototype.slice.call(_qAll('#diggyPopup .additionPrice')).forEach(item => {
            item.innerHTML = utils.formatPrice(window.additionPriceValue.toFixed(2), window.fCurrency, productData.shippings[0].formattedPrice);
        });

        Array.prototype.slice.call(_qAll('#diggyPopup .typeProduct')).forEach(item => {
            if (_q('.js-list-group .active')) {
                item.textContent = _q('.js-list-group .active').textContent
            }
        });

        Array.prototype.slice.call(_qAll('#diggyPopup .additionDepositPrice')).forEach(item => {
            if (window.upsell.products.length > 0) {
                const miniItem = window.upsell.products[window.upsell_productindex]
                const miniDepositPrice = miniItem.productPrices.PreSaleAmount1.FormattedValue
                item.innerHTML = miniDepositPrice;
            }
        });

        Array.prototype.slice.call(_qAll('#diggyPopup .ordered-qty')).forEach(item => {
            item.innerHTML = !!window.isDoubleQuantity ? productData.quantity / 2 : productData.quantity;
        });

        Array.prototype.slice.call(_qAll('#diggyPopup .extra-qty')).forEach(item => {
            item.innerHTML = !!window.isDoubleQuantity ? upgradeItem.quantity / 2 : upgradeItem.quantity;
        });

        Array.prototype.slice.call(_qAll('#diggyPopup .ordered-price')).forEach(item => {
            item.innerHTML = productData.productPrices.DiscountedPrice.FormattedValue;
        });

        Array.prototype.slice.call(_qAll('#diggyPopup .ordered-full-price')).forEach(item => {
            item.innerHTML = productData.productPrices.FullRetailPrice.FormattedValue;
        });

        //Assigne Double ID
        upgradeItemId = upgradeItem.productId;
        window.defaultProduct = productData;

        //Assigne upgradeItem Data for dummy Input
        dummyInput.value = upgradeItem.productId;
        dummyInput.dataset.product = JSON.stringify(upgradeItem);
    }

    //Call API to update new product Id - Upgrade API
    function submitDataUpgrade(orderNumber, redirectUrl) {
        let url = `${eCRM.Order.baseAPIEndpoint}/orders/${orderNumber}/${upgradeItemId}`,
            orderDataUprage = window.orderData;

        //Assigne Data of Product Upgrade
        let productUpgrade = JSON.parse(dummyInput.dataset.product);

        orderDataUprage.productId = productUpgrade.productId;
        orderDataUprage.shippingMethodId = productUpgrade.shippings.length > 0 ? productUpgrade.shippings[0].shippingMethodId : null;

        eCRM.Order.placeOrderWithUrl(url, orderDataUprage, 'creditcard', function (data) {
            if (data.success) {
                let page = _q('body');
                let position = 0;
                let op = 1;

                let orderInfo = JSON.parse(utils.localStorage().get('orderInfo'));
                orderInfo.orderTotal = Number((orderInfo.orderTotal + window.additionPriceValue).toFixed(2));
                orderInfo.orderTotalFull = Number((orderInfo.orderTotalFull + window.additionPriceValue).toFixed(2));

                utils.localStorage().set('orderInfo', JSON.stringify(orderInfo));

                let slpage = setInterval(function () {
                    if (!!_qById('second_popup_buy_one_more')) {
                        clearInterval(slpage);
                        window.showPopup('second_popup_buy_one_more');
                        return;
                    }
                    if (position === 350) {
                        clearInterval(slpage);
                        window.location.href = redirectUrl;
                    }
                    else {
                        position += 10;
                        page.style.right = position + 'px';
                        page.style.opacity = op;
                        op = op - 0.05;
                    }
                }, 10);
            }
            else {
                utils.redirectPage(siteSetting.declineUrl);
            }
        })
    }

    const delayMiniUpsellWebkey = _qById('delayminiWebkey') ? _qById('delayminiWebkey').value : '';
    window.upsell_productindex = 0;

    function getDelayMiniUpsellProducts() {
        window.upsell = {
            orderResult: {},
            orderInfo: {},
            products: [],
            upsellcampaignname: '',
            mainWebKey: delayMiniUpsellWebkey,
            upsellWebKey: delayMiniUpsellWebkey,
            cid: siteSetting.CID
        };

        const eCRM2 = new EmanageCRMJS({
            webkey: upsell.upsellWebKey,
            cid: upsell.cid,
            lang: '',
            isTest: utils.getQueryParameter('isCardTest') ? true : false
        });

        eCRM2.Campaign.getProducts(function (products) {
            window.upsell.products = products.prices;
        });
    }
    if (delayMiniUpsellWebkey) {
        getDelayMiniUpsellProducts();
    }

    function setUpsellProductIndex() {
        try {
            const pidMini = Number(_q('.js-list-group .active').dataset.pidupgrade1);

            if (!!pidMini) {
                for (let i = 0, n = window.upsell.products.length; i < n; i++) {
                    if (window.upsell.products[i].productId === pidMini) {
                        window.upsell_productindex = i;
                        break;
                    }
                }
            }
        }
        catch (e) {
            console.log(e)
        }
    }

    function implementDelayMiniUpsell() {
        window.upsell.orderResult = window.result;
        window.upsell.orderInfo = JSON.parse(utils.localStorage().get('orderInfo'))
        upsell.orderInfo.upsellIndex = 0;
        setUpsellProductIndex();
    }

    function getUpsellData() {
        let pay = {
            cardId: upsell.orderInfo.cardId
        };

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
        pay.callBackParam = replacedParam !== '' ? '?' + replacedParam : '';

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

    function saveInfoToLocalForUpsells(responseData, upsell) {
        let _getUpParam = () => {
            let upParam = '';
            if (location.href.split('special-offer-', 2).length > 1) {
                upParam = 'up_' + location.href.split('special-offer-', 2)[1].split('.html', 1);
            }
            return upParam;
        };

        let _handleLastUpsellOrError = () => {
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
        };

        if (responseData != null && responseData.success) {
            //store param in localStorage to fire gtm event of purchase
            //const upsellCampaignName = typeof upsell.upsellCampaignName !== 'undefined' ? upsell.upsellCampaignName : _getUpParam();
            utils.localStorage().set('fireUpsellForGTMPurchase', _getUpParam());
            utils.localStorage().set('paypal_isMainOrder', 'upsell');
            utils.localStorage().set('upsellOrderNumber', responseData.orderNumber);

            // upsell.orderInfo.upsellIndex += 1;
            const savedOfUpsell = upsell.products[window.upsell_productindex].productPrices.FullRetailPrice.Value - upsell.products[window.upsell_productindex].productPrices.DiscountedPrice.Value;
            upsell.orderInfo.upsellPriceToUpgrade = upsell.products[window.upsell_productindex].productPrices.DiscountedPrice.Value;
            upsell.orderInfo.savedTotal += savedOfUpsell;
            upsell.orderInfo.isUpsellOrdered = 1;
            const { upsellUrls = [] } = upsell.orderInfo;
            upsellUrls.push({
                index: upsell.orderInfo.upsellIndex,
                orderNumber: responseData.orderNumber,
                url: location.pathname,
                price: upsell.products[window.upsell_productindex].productPrices.DiscountedPrice.Value
            });
            upsell.orderInfo.upsellUrls = upsellUrls;

            utils.localStorage().set('orderInfo', JSON.stringify(upsell.orderInfo));

            utils.localStorage().set('webkey_to_check_paypal', upsell.upsellWebKey);

            if (responseData.callBackUrl) {
                document.location = responseData.callBackUrl;
            }
            else if (responseData.paymentContinueResult && responseData.paymentContinueResult.actionUrl !== "") {
                document.location = responseData.paymentContinueResult.actionUrl;
            }
            else if (upsell.orderInfo.upsellIndex < upsell.orderInfo.upsells.length) {
                let upsellUrl = upsell.orderInfo.upsells[upsell.orderInfo.upsellIndex].upsellUrl;
                const redirectUrl = upsellUrl.substring(upsellUrl.lastIndexOf('/') + 1, upsellUrl.indexOf('?') >= 0 ? upsellUrl.indexOf('?') : upsellUrl.length);
                utils.redirectPage(redirectUrl);
            }
            else {
                _handleLastUpsellOrError();
            }
        }
        else {
            _handleLastUpsellOrError();
        }
    }

    // Submit Delay Mini Upsell
    function placeUpsellOrder() {
        const upsellData = getUpsellData();

        const eCRM = new EmanageCRMJS({
            webkey: upsell.mainWebKey,
            cid: siteSetting.CID,
            lang: '',
            isTest: utils.getQueryParameter('isCardTest') ? true : false
        });

        // utils.showAjaxLoading();
        eCRM.Order.placeUpsellOrder(upsellData, upsell.upsellWebKey, function (result) {
            saveInfoToLocalForUpsells(result, upsell);
        });
    }

    function activateCreditCardUpgrade(orderNumber, redirectUrl) {
        if (!!orderNumber) {
            if (!delayMiniUpsellWebkey) {
                submitDataUpgrade(orderNumber, redirectUrl);
            }
            else {
                placeUpsellOrder(orderNumber, redirectUrl);
            }
        }
        else {
            if (!!_qById('second_popup_buy_one_more')) {
                window.showPopup('second_popup_buy_one_more');
                return;
            }
            location.href = redirectUrl;
        }
    }

    //Append Identify Parameters
    function appendParamIntoUrl(id) {
        let currentUrl = window.location.href,
            param = currentUrl.indexOf('?') > -1 ? `&clickid=${id}` : `?clickid=${id}`;

        const newurl = currentUrl + param;
        btnParamId = param;
        window.urlRedirect += param;
        window.history.pushState({ path: newurl }, '', newurl);
    }

    //Event upgrade product for Paypal & Creditcard
    function upgradeProduct() {
        //remove current Item checked then check dummy checkbox
        _q('input[name="product"]:checked').checked = false;
        dummyInput.checked = true;

        if (!!_qById('second_popup_buy_one_more')) {
            renderPriceFor2ndPop(true);
        }

        if (window.gapFlag) {
            if (!!_qById('second_popup_buy_one_more')) {
                window.showPopup('second_popup_buy_one_more');
            }
            else {
                window.gap.handleAppleGoogleClick();
            }
        }
        if (window.paypalFlag) {
            if (!!_qById('second_popup_buy_one_more')) {
                window.showPopup('second_popup_buy_one_more');
            }
            else {
                window.paypal.placeMainOrder();
            }
        }
        if (window.ccFlag) {
            activateCreditCardUpgrade(orderNumber, window.urlRedirect);
        }

        if (!!diggyPopup) {
            window.closePopup('diggyPopup');
        }
    }

    //Event cancelling to upgrade product for Paypal & Creditcard
    function cancelUpgradeProduct() {
        window.additionPriceValue = 0;
        if (!!_qById('second_popup_buy_one_more')) {
            renderPriceFor2ndPop(false);
        }

        if (!!diggyPopup) {
            window.closePopup('diggyPopup');
        }

        if (window.gapFlag) {
            if (!!_qById('second_popup_buy_one_more')) {
                window.showPopup('second_popup_buy_one_more');
            }
            else {
                window.gap.handleAppleGoogleClick();
            }
        }
        if (window.paypalFlag) {
            if (!!_qById('second_popup_buy_one_more')) {
                window.showPopup('second_popup_buy_one_more');
            }
            else {
                window.paypal.placeMainOrder();
            }
        }
        if (window.ccFlag) {
            activateCreditCardUpgrade(false, window.urlRedirect);
        }
    }

    //Attach event Upgrade and cancelUpgrade for button add & button-cancel
    function handleEventButton() {
        _q('#diggyPopup .btn-add').addEventListener('click', function (e) {
            e.preventDefault();

            appendParamIntoUrl(e.currentTarget.dataset.btnid || 'btnadd');
            upgradeProduct();
        });

        Array.prototype.slice.call(_qAll('#diggyPopup .btn-cancel, #diggyPopup .icon-close')).forEach(closeElm => {
            closeElm.addEventListener('click', function (e) {
                e.preventDefault();

                appendParamIntoUrl(_q('#diggyPopup .btn-cancel').dataset.btnid || 'btncancel');
                cancelUpgradeProduct();
            });
        });

        // Render price on change product item
        Array.prototype.slice.call(_qAll('.productRadioListItem input')).forEach(inputElm => {
            inputElm.addEventListener('change', function (e) {
                renderPrice();
            });
        });
    }

    //Clear Parameter tracking double popup id
    function clearPopupParameters() {
        let currentUrl = window.location.href,
            sectionBtn = _q('#diggyPopup .footer-modal'),
            btnAddId = `clickid=${sectionBtn.dataset.btnaddid}`,
            btnCancelId = `clickid=${sectionBtn.dataset.btncancelid}`;

        if (currentUrl.indexOf(btnAddId) > - 1) {
            currentUrl = currentUrl.replace(currentUrl.substr(currentUrl.indexOf(btnAddId) - 1, btnAddId.length + 1), '');
        }
        else if (currentUrl.indexOf(btnCancelId) > - 1) {
            currentUrl = currentUrl.replace(currentUrl.substr(currentUrl.indexOf(btnCancelId) - 1, btnCancelId.length + 1), '');
        }

        const newurl = currentUrl;
        window.history.pushState({ path: newurl }, '', newurl);
    }

    function countDownSeconds() {
        try {
            const countDownSecondElms = diggyPopup.querySelector('.count-seconds');
            if (!countDownSecondElms) {
                return;
            }
            let seconds = Number(countDownSecondElms.textContent);
            let secondsInterval = setInterval(() => {
                if (seconds === 0) {
                    clearInterval(secondsInterval);
                    if (!!diggyPopup.querySelector('.btn-cancel')) {
                        diggyPopup.querySelector('.btn-cancel').click();
                    }
                }
                --seconds;
                countDownSecondElms.textContent = seconds < 10 ? `0${seconds}` : seconds;
            }, 1000);
        }
        catch (e) {
            console.log(e);
        }
    }

    function initial() {
        handleEventButton();
        clearPopupParameters();
    }

    //register event bindOrderPage at first load
    utils.events.on('bindOrderPage', renderPrice);

    //Enable Prevent Checkout of Google Apple Pay
    let injectCustomEvents = new utils.injectCustomEventsToCTABtn;

    injectCustomEvents.preventCheckout('gap', function () {
        if (_q('#btn-google-pay')) {
            _q('#btn-google-pay').addEventListener('click', function () {
                if (!!diggyPopup) {
                    renderPrice();
                    window.showPopup('diggyPopup');
                    countDownSeconds();
                }
            });
        }
        if (_q('#btn-apple-pay')) {
            _q('#btn-apple-pay').addEventListener('click', function () {
                if (!!diggyPopup) {
                    renderPrice();
                    window.showPopup('diggyPopup');
                    countDownSeconds();
                }
            });
        }
    });

    //Enable Emit event after purchase for Paypal
    injectCustomEvents.emitEventAfterCheckout('gap', function () {
        let newOrderInfo = JSON.parse(utils.localStorage().get('orderInfo'));
        newOrderInfo.quantity = window.defaultProduct.quantity;

        utils.localStorage().set('orderInfo', JSON.stringify(newOrderInfo));
    });

    //Enable Prevent Checkout of Paypal
    injectCustomEvents.preventCheckout('paypal', function () {
        if (!_q('#js-paypal-oneclick-button .w_radio')) {
            return;
        }
        _q('#js-paypal-oneclick-button .w_radio').addEventListener('click', function () {
            if (!!diggyPopup) {
                renderPrice();
                window.showPopup('diggyPopup');
                countDownSeconds();
            }
        });
    });

    //Enable Emit event after purchase for Paypal
    injectCustomEvents.emitEventAfterCheckout('paypal', function () {
        let newOrderInfo = JSON.parse(utils.localStorage().get('orderInfo'));
        newOrderInfo.quantity = window.defaultProduct.quantity;

        utils.localStorage().set('orderInfo', JSON.stringify(newOrderInfo));
    });

    //Enable Emit event after purchase for CreditCard
    injectCustomEvents.emitEventAfterCheckout('cc', function (data) {
        window.orderNumber = data.result.orderNumber;
        window.urlRedirect = data.redirectUrl;
        window.orderData = data.orderData;
        window.result = data.result;

        //Hiding Message successed
        let customAjaxLoading = _q('.custom-loading');
        if (!!customAjaxLoading) {
            customAjaxLoading.classList.remove('successed');
        }

        //display popup
        if (!!diggyPopup) {
            implementDelayMiniUpsell();
            renderPrice();
            window.showPopup('diggyPopup');
            countDownSeconds();
        }
    }, true);

    document.addEventListener('DOMContentLoaded', function () {
        initial();
    });

    window.extrapop = {
        renderPrice: renderPrice
    };
})(window.utils);
