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

    let upgradeItemId, defaultProduct, additionPriceValue, currentIndex, btnParamId,
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
            upgradeItem0 = defaultProduct;
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
        additionPriceValue = upgradeItem.productPrices.DiscountedPrice.Value - productData.productPrices.DiscountedPrice.Value;

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
            item.innerHTML = utils.formatPrice(additionPriceValue.toFixed(2), window.fCurrency, productData.shippings[0].formattedPrice);
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
        defaultProduct = productData;

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
                orderInfo.orderTotal = Number((orderInfo.orderTotal + additionPriceValue).toFixed(2));
                orderInfo.orderTotalFull = Number((orderInfo.orderTotalFull + additionPriceValue).toFixed(2));

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

    function activateCreditCardUpgrade(orderNumber, redirectUrl) {
        if (!!orderNumber) {
            submitDataUpgrade(orderNumber, redirectUrl);
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

        switch (window.paypalFlag) {
            case true:
                if (!!_qById('second_popup_buy_one_more')) {
                    window.showPopup('second_popup_buy_one_more');
                }
                else {
                    window.paypal.placeMainOrder();
                }
                break;
            case false:
                activateCreditCardUpgrade(orderNumber, window.urlRedirect);
                break;
        }

        if (!!diggyPopup) {
            window.closePopup('diggyPopup');
        }
    }

    //Event cancelling to upgrade product for Paypal & Creditcard
    function cancelUpgradeProduct() {
        if (!!_qById('second_popup_buy_one_more')) {
            renderPriceFor2ndPop(false);
        }

        if (!!diggyPopup) {
            window.closePopup('diggyPopup');
        }

        switch (window.paypalFlag) {
            case true:
                if (!!_qById('second_popup_buy_one_more')) {
                    window.showPopup('second_popup_buy_one_more');
                }
                else {
                    window.paypal.placeMainOrder();
                }
                break;
            case false:
                activateCreditCardUpgrade(false, window.urlRedirect);
                break;
        }
    };

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
    };

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

    //Enable Prevent Checkout of Paypal
    let injectCustomEvents = new utils.injectCustomEventsToCTABtn;

    injectCustomEvents.preventCheckout('paypal', function () {
        if (!_q('#js-paypal-oneclick-button .w_radio')) {
            return;
        }
        _q('#js-paypal-oneclick-button .w_radio').addEventListener('click', function () {
            if (!!diggyPopup) {
                window.showPopup('diggyPopup');
                countDownSeconds();
            }
        });
    });

    //Enable Emit event after purchase for Paypal
    injectCustomEvents.emitEventAfterCheckout('paypal', function () {
        let newOrderInfo = JSON.parse(utils.localStorage().get('orderInfo'));
        newOrderInfo.quantity = defaultProduct.quantity;

        utils.localStorage().set('orderInfo', JSON.stringify(newOrderInfo));
    });

    //Enable Emit event after purchase for CreditCard
    injectCustomEvents.emitEventAfterCheckout('cc', function (data) {
        window.orderNumber = data.result.orderNumber;
        window.urlRedirect = data.redirectUrl;
        window.orderData = data.orderData;

        //Hiding Message successed
        let customAjaxLoading = _q('.custom-loading');
        if (!!customAjaxLoading) {
            customAjaxLoading.classList.remove('successed');
        }

        //display popup
        if (!!diggyPopup) {
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
