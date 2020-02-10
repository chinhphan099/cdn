(function (utils) {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    if (!siteSetting) {
        console.log('window.siteSetting object is not found');
        return;
    }

    var getLifetimePrice = function(product) {
        const warrantyRate = [0.1, 0.2, 0.2, 0.2, 0.2, 0.3, 0.5, 0.15, 0.25, 0.35, 0.4, 0.45, 0.55, 0.6];
        const funnelId = document.querySelector('#txtProductWarranty').value;
        const funnelPrice = warrantyRate[parseInt(funnelId) - 1];
        var lifetimePrice = (Math.round(100 * product.productPrices.DiscountedPrice.Value * funnelPrice) / 100);
        return [lifetimePrice, funnelPrice];
    };

    let product = null;

    const eCRM = new EmanageCRMJS({
        webkey: siteSetting.webKey,
        cid: siteSetting.CID,
        lang: '',
        isTest: utils.getQueryParameter('isCardTest') ? true : false
    });

    function handleButtonClick() {
        _q('#js-paypal-oneclick-button .w_radio').addEventListener('click', function (e) {
            e.preventDefault();
            placeMainOrder();
        });
    }

    function placeMainOrder() {
        const paymenttype = 'paypal';
        const paypalLoading = _q('.paypal-loading-overlay');
        const checkProductListValue = window.widget.productlist !== undefined ? window.widget.productlist.isValidProductList() : true;

        if (!checkProductListValue) {
            console.log('invalid data');
            return;
        }
        if (paypalLoading) {
            paypalLoading.style.display = 'block';
        }

        const orderData = getOrderData(paymenttype);

        eCRM.Order.placeOrder(orderData, paymenttype, function (result) {
            //make a flag is that has a order successfully, will be used in decline page
            utils.localStorage().set('mainOrderLink', location.pathname);
            utils.localStorage().set('userPaymentType', 'paypal');

            if (result && result.success) {
                utils.localStorage().set('paypal_isMainOrder', 'main');

                saveInforForUpsellPage(result);

                utils.localStorage().set('webkey_to_check_paypal', siteSetting.webKey);

                if (result.callBackUrl) {
                    document.location = result.callBackUrl;
                } else if (result.paymentContinueResult && result.paymentContinueResult.actionUrl !== "") {
                    document.location = result.paymentContinueResult.actionUrl;
                } else if (result.upsells.length > 0 && result.upsells[0].upsellUrl !== '') {
                    const redirectUrl = result.upsells[0].upsellUrl.substr(result.upsells[0].upsellUrl.lastIndexOf('/') + 1);
                    //utils.redirectPage(redirectUrl);
                    location.href = redirectUrl;
                } else {
                    utils.redirectPage(siteSetting.successUrl);
                }
            } else {
                utils.redirectPage(siteSetting.declineUrl);
            }
        });
    }

    function getOrderData(paymenttype) {
        //get couponCode
        let couponCode = '';
        const couponField = _qById('couponCode');
        if (couponField) {
            couponCode = couponField.value;
        } else {
            couponCode = utils.getQueryParameter('couponCode') !== '' ? utils.getQueryParameter('couponCode') : '';
        }

        product = getSelectedProduct();

        const shippingIndex = (typeof window.shippingIndex === 'number' && window.shippingIndex !== -1) ? window.shippingIndex : 0;
        const orderData = {
            "couponCode": couponCode,
            "shippingMethodId": ((product.shippings.length > 0) ? product.shippings[shippingIndex].shippingMethodId : null),
            "comment": "",
            "useShippingAddressForBilling": true,
            "productId": product.productId,
            "customer": {
                "email": null,
                "phoneNumber": null,
                "firstName": null,
                "lastName": null
            },
            "payment": {
                paymentProcessorId: !!window.paymentProcessorId ? window.paymentProcessorId : 5
            },
            "shippingAddress": null,
            "billingAddress": null,
            "funnelBoxId": !!_qById('txtProductWarranty') ? (_qById('txtProductWarranty').checked ? _qById('txtProductWarranty').value : 0) : 0
        }

        //Addtional Miniupsell Data
        // if(_qById('txtMiniUpsellPID') && _qById('txtMiniUpsellPID').checked) {
        //      orderData.miniUpsell ={
        //          "productId": Number(_qById('txtMiniUpsellPID').dataset.id),
        //          "shippingMethodId": Number(_qById('txtMiniUpsellShippingID').dataset.id)
        //      };
        // }

        //Addtional Miniupsell Data
        const miniUpsell = _qById('txtMiniUpsellPID');
        if (miniUpsell) {
            if(miniUpsell.checked) {
                orderData.miniUpsell = {
                    "productId": Number(miniUpsell.dataset.id),
                    "shippingMethodId": Number(_qById('txtMiniUpsellShippingID').dataset.id)
                };
            }
        }

        return orderData;
    }

    function getSelectedProduct() {
        if (!_q('input[name="product"]:checked')) return null;

        const product = _q('input[name="product"]:checked').dataset.product;
        if (product) {
            return JSON.parse(product);
        } else {
            return null;
        }
    }

    function saveInforForUpsellPage(orderResponse) {
        var shippingFee = 0,
            lifetimePrice = 0,
            lifetimeRate = 0,
            productWarranty = 0;

        const fValue = product.productPrices.DiscountedPrice.FormattedValue.replace(/[,|.]/g, '');
        const pValue = product.productPrices.DiscountedPrice.Value.toString().replace(/\./, '');

        if(product.shippings != null && product.shippings.length > 0) {
            shippingFee = product.shippings[0].price;
        }
        if(_qById('txtProductWarranty') != null) {
            if(_qById('txtProductWarranty').checked == true) {
                let lifeTimeInfo = getLifetimePrice(product);
                lifetimePrice = lifeTimeInfo[0];
                lifetimeRate = lifeTimeInfo[1];
            }
        }
        if(_q("#txtMiniUpsellPID") != null) {
            if(_q("#txtMiniUpsellPID").checked == true) {
                if(!!_q(".warrantyDiscountPrice")){
                    productWarranty = parseFloat(_q(".warrantyDiscountPrice").dataset.warrantydiscountprice);
                }
            }
        }

        const fCurrency = fValue.replace(pValue, '######').replace(/\d/g, '');
        var orderInfo = {
            'orderParams': location.search.substr(1),
            'upsells': orderResponse.upsells,
            'upsellIndex': 0,
            'countryCode': siteSetting.countryCode,
            'orderNumber': orderResponse.orderNumber,
            'cusEmail': _qById('customer_email').value === '' ? null : _qById('customer_email').value,
            'cardId': orderResponse.cardId,
            'paymentProcessorId': orderResponse.paymentProcessorId,
            'addressId': orderResponse.customerResult.shippingAddressId,
            'orderTotal': product.productPrices.DiscountedPrice.Value,
            'lifetimePrice': lifetimePrice,
            'lifetimeRate': lifetimeRate,
            'orderTotalFull': product.productPrices.DiscountedPrice.Value + shippingFee + lifetimePrice + productWarranty,
            'savedTotal': product.productPrices.FullRetailPrice.Value - product.productPrices.DiscountedPrice.Value,
            'quantity': product.quantity,
            'feeShipping': shippingFee,
            'fCurrency': fCurrency,
            'orderedProducts': [
                {
                    sku: product.sku,
                    pid: product.productId
                }
            ]
        }

        utils.localStorage().set('orderInfo', JSON.stringify(orderInfo));

        //TODO: DELETE
        const loggingInfo = {
            orderNumber: orderResponse.orderNumber,
            trackingNumber: orderResponse.trackingNumber,
            callBackUrl: orderResponse.callBackUrl
        }

        utils.localStorage().set('loggingInfo', JSON.stringify(loggingInfo));
    }

    document.addEventListener('DOMContentLoaded', function () {
        handleButtonClick();
    });
})(window.utils);
