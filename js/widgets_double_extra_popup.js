(function(utils) {

    if (!utils) {
        console.log('modules is not found');
        return;
    }

    //init new methods from EmanageCRMJS
    const eCRM = new EmanageCRMJS({
        webkey: siteSetting.webKey,
        cid: siteSetting.CID,
        lang: '',
        isTest: utils.getQueryParameter('isCardTest') ? true : false
    });

    let doubleItemId, orderNumber, urlRedirect, orderData, campaigns, defaultProduct,
        extraPopup = _q('.extra-popup');

    //Render dynamic price for popup content while input changed
    let renderPrice = function() {

        let productData = JSON.parse(_q('input[name="product"]:checked').dataset.product),
            listPkgElm = _q('.js-list-group li.active'),
            listPidPkg = listPkgElm.dataset.package.split(','),
            listPidUpgrade = listPkgElm.dataset.pidupgrade.split(','),

            currentIndex = listPidPkg.indexOf(productData.productId.toString()),
            doublePid = Number(listPidUpgrade[currentIndex]),

            doubleItem = campaigns.filter(elm => elm.productId === doublePid)[0],
            fCurrency = window.fCurrency,
            savePriceValue = doubleItem.productPrices.DiscountedPrice.Value - productData.productPrices.DiscountedPrice.Value;

        console.log(campaigns);
        //display triple__layout or double__layout base on quantity
        extraPopup.classList.remove('triple-display', 'double-display');
        if (productData.quantity > 1) {
            extraPopup.classList.add('double-display');
        } else {
            extraPopup.classList.add('triple-display');

        }

        //Dynamic content
        let dynamicProductName = _qAll('.dynamic-name'),
            dynamicDescription = _qAll('.dynamic-desc');

        if (!!dynamicProductName) {
            let rootName = _q('input[name="product"]:checked').parentNode.querySelector('.root-name');
            for (let item of dynamicProductName) {
                item.innerHTML = rootName.innerHTML;
            }
        }

        if (!!dynamicDescription) {
            let rootDesc = _q('input[name="product"]:checked').parentNode.querySelector('.root-desc');
            for (let item of dynamicDescription) {
                item.innerHTML = rootDesc.innerHTML;
            }
        }


        //Drop dynamic data for {variable}
        let savingPrice = _qAll('.savePrice'),
            defaultQty = _qAll('.default-qty'),
            doubleQty = _qAll('.double-qty'),
            unitPrice = _qAll('.price-default'),
            unitFullPrice = _qAll('.unitFullPrice'),
            doubleUnitPrice = _qAll('.price-double');

        for (let item of savingPrice) {
            item.innerHTML = utils.formatPrice(savePriceValue.toFixed(2), fCurrency, productData.shippings[0].formattedPrice);
        }

        for (let item of defaultQty) {
            item.innerHTML = productData.quantity;
        }

        for (let item of doubleQty) {
            item.innerHTML = doubleItem.quantity;
        }

        for (let item of unitPrice) {
            item.innerHTML = productData.productPrices.DiscountedPrice.FormattedValue;
        }

        for (let item of unitFullPrice) {
            item.innerHTML = productData.productPrices.FullRetailPrice.FormattedValue;
        }

        for (let item of doubleUnitPrice) {
            item.innerHTML = doubleItem.productPrices.DiscountedPrice.FormattedValue;
        }

        //Assigne Double ID
        doubleItemId = doubleItem.productId;
        defaultProduct = productData;
    }


    //Call API to update new product Id - Upgrade API
    let submitDataUpgrade = function(orderNumber, redirectUrl) {

        let url = `${eCRM.Order.baseAPIEndpoint}/orders/${orderNumber}/${doubleItemId}`,
            orderDataUprage = orderData;

        //Assigne Data of Product Upgrade
        let productUpgrade = getUpgradeProductInfo();

        orderDataUprage.productId = productUpgrade.productId;
        orderDataUprage.shippingMethodId = productUpgrade.shippings.length > 0 ? productUpgrade.shippings[0].shippingMethodId : null,

            eCRM.Order.placeOrderWithUrl(url, orderDataUprage, 'creditcard', function(data) {
                if (data.success) {
                    let page = _q('body');
                    let position = 0;
                    let op = 1;
                    let slpage = setInterval(function() {
                        if (position === 350) {
                            clearInterval(slpage);
                            window.location.href = redirectUrl;
                        } else {
                            position += 10;
                            page.style.right = position + 'px';
                            page.style.opacity = op;
                            op = op - 0.05;
                        }
                    }, 10);
                } else {
                    utils.redirectPage(siteSetting.declineUrl);
                }

            })
    }

    let activateCreditCardUpgrade = function(orderNumber, redirectUrl) {
        if (!!orderNumber) {
            submitDataUpgrade(orderNumber, redirectUrl);
        } else {
            location.href = redirectUrl;
        }
    }

    //Event upgrade product for Paypal & Creditcard
    let upgradeProduct = function() {
        //remove current Item checked
        _q('input[name="product"]:checked').checked = false;

        //Assigne checked to upgrade product element corresponding with current item
        _q('#product_' + doubleItemId).checked = true;

        switch (window.paypalFlag) {
            case true:
                window.paypal.placeMainOrder();
                break;
            case false:
                activateCreditCardUpgrade(orderNumber, urlRedirect);
                break;
        }

        //Hinding popup
        if (!!extraPopup) {
            extraPopup.style.display = 'none';
        }
    }

    //Event cancelling to upgrade product for Paypal & Creditcard
    let cancelUpgradeProduct = function(paymentType) {
        switch (window.paypalFlag) {
            case true:
                window.paypal.placeMainOrder();
                break;
            case false:
                activateCreditCardUpgrade(false, urlRedirect);
                break;
        }

        //Hinding popup
        if (!!extraPopup) {
            extraPopup.style.display = 'none';
        }
    }

    //Attach event Upgrade and cancelUpgrade for button add & button-cancel
    let handleEventButton = function() {
        let btnAdd = _qAll('.extra-popup .btn-add'),
            btnCancel = _qAll('.extra-popup .btn-cancel, .extra-popup .btn-close');

        for (let item of btnAdd) {
            item.addEventListener('click', function(e) {
                e.preventDefault();

                upgradeProduct();
            })
        }

        for (let item of btnCancel) {
            item.addEventListener('click', function(e) {
                e.preventDefault();

                cancelUpgradeProduct();
            })
        }

        //Handle input change
        const inputs = _qAll('.productRadioListItem input');

        for (let item of inputs) {
            item.addEventListener('change', function(e) {
                renderPrice();
            });
        }
    }

    //Get information of Product to selected to upgrade
    let getUpgradeProductInfo = function() {
        let upgradeProduct = JSON.parse(_q('#product_' + doubleItemId).dataset.product);

        return upgradeProduct;
    }

    let initial = function() {
        //excute functional
        handleEventButton();
    }

    //register event bindOrderPage at first load
    utils.events.on('bindOrderPage', function() {

        //Filter current webkey of page
        campaigns = JSON.parse(utils.localStorage().get('campproducts')).camps.filter(function(elm) {
            return elm[siteSetting.webKey];
        })[0][siteSetting.webKey].prices;

        renderPrice();
    });

    //Enable Prevent Checkout of Paypal
    let injectCustomEvents = new utils.injectCustomEventsToCTABtn;

    injectCustomEvents.preventCheckout('paypal', function() {
        _q('#js-paypal-oneclick-button').addEventListener('click', function() {
            //display popup
            if (!!extraPopup) {
                extraPopup.style.display = 'block';
            }
        });
    });

    //Enable Emit event after purchase for Paypal
    injectCustomEvents.emitEventAfterCheckout('paypal', function() {
        //Re-Assigne quantity
        let newOrderInfo = JSON.parse(utils.localStorage().get('orderInfo'));
        newOrderInfo.quantity = defaultProduct.quantity;

        utils.localStorage().set('orderInfo', JSON.stringify(newOrderInfo));
    });

    //Enable Emit event after purchase for CreditCard
    injectCustomEvents.emitEventAfterCheckout('cc', function(data) {
        //Assign data after purchase
        orderNumber = data.result.orderNumber;
        urlRedirect = data.redirectUrl;
        orderData = data.orderData;

        //Hiding Message successed
        let customAjaxLoading = _q('.custom-loading');
        if (!!customAjaxLoading) {
            customAjaxLoading.classList.remove('successed');
        }

        //display popup
        if (!!extraPopup) {
            extraPopup.style.display = 'block';
        }
    }, true);

    document.addEventListener('DOMContentLoaded', function() {
        initial();
    });
})(window.utils);
