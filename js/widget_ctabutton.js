(function (utils) {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    if (!siteSetting) {
        console.log('window.siteSetting object is not found');
        return;
    }

    let product = null;

    var getLifetimePrice = function(product) {
        const warrantyRate = [0.1, 0.2, 0.2, 0.2, 0.2, 0.3, 0.5, 0.15, 0.25, 0.35, 0.4, 0.45, 0.55, 0.6];
        const funnelId = document.querySelector('#txtProductWarranty').value;
        const funnelPrice = warrantyRate[parseInt(funnelId) - 1];
        var lifetimePrice = (Math.round(100 * product.productPrices.DiscountedPrice.Value * funnelPrice) / 100);
        return [lifetimePrice, funnelPrice];
    };

    const eCRM = new EmanageCRMJS({
        webkey: siteSetting.webKey,
        cid: siteSetting.CID,
        lang: '',
        isTest: utils.getQueryParameter('isCardTest') ? true : false
    });

    function getSelectedProduct() {
        if (!_q('input[name="product"]:checked')) {
            return null;
        }

        const product = _q('input[name="product"]:checked').dataset.product;
        if (product) {
            return JSON.parse(product);
        } else {
            return null;
        }
    }

    function getOrderData() {
        //get couponCode
        let couponCode = '';
        const couponField = _qById('couponCode');
        if (couponField) {
            couponCode = couponField.value;
        } else {
            couponCode = utils.getQueryParameter('couponCode') !== '' ? utils.getQueryParameter('couponCode') : '';
        }

        product = getSelectedProduct();

        let useShippingAddressForBilling = true;
        if(_q('.widget-billing-form')) {
            const checkedRadio = _q('input[name="radio_choose_billing"]:checked');
            if(checkedRadio && checkedRadio.id === 'radio_different_shipping') {
                useShippingAddressForBilling = false;
            }
        }

        let firstName = _qById('customer_firstname') ? _qById('customer_firstname').value : _qById('shipping_firstname').value;
        let lastName = _qById('customer_lastname') ? _qById('customer_lastname').value : _qById('shipping_lastname').value;
        let phoneNumber = _qById('customer_phone') ? _qById('customer_phone').value : '';

        let billingAddress = null;
        if(!useShippingAddressForBilling) {
            billingAddress = {
                'firstName': !!_qById('billing_firstname') ? _qById('billing_firstname').value : firstName,
                'lastName': !!_qById('billing_lastname') ? _qById('billing_lastname').value : lastName,
                'address1': _qById('billing_address1').value,
                'address2': _qById('billing_address2') != null ? _qById('billing_address2').value : '',
                'city': _qById('billing_city').value,
                'countryCode': _qById('billing_country').value,
                'state': _qById('billing_province').value,
                'zipCode': _qById('billing_postal').value,
                'phoneNumber': !!_qById('billing_phone') ? _qById('billing_phone').value : phoneNumber
            };
        }

        //expiration date
        const expiredate = _qById('creditcard_expirydate');
        const expiremonth = _qById('cardExpirationMonth');
        const expireyear = _qById('cardExpirationYear');
        let expiration = '';
        if(expiredate) {
            expiration = expiredate.value.replace('/', '/20');
        } else if(expiremonth && expireyear) {
            expiration = expiremonth.value + '/' + expireyear.value;
        }

        const orderData = {
            'couponCode': couponCode,
            'shippingMethodId': product.shippings.length > 0 ? product.shippings[0].shippingMethodId : null,
            'comment': '',
            'useShippingAddressForBilling': useShippingAddressForBilling,
            'productId': product.productId,
            'customer': window.widget.customer.getCustomerInfo(),
            'payment': {
                'name': firstName + ' ' + lastName,
                'creditcard': _qById('creditcard_creditcardnumber').dataset.cardnumber,
                'creditCardBrand': _qById('creditcard_creditcardnumber').dataset.cardtype,
                'expiration': expiration,
                'cvv': _qById('creditcard_cvv').value
            },
            'shippingAddress': window.widget.shipping.getShippingAddress(),
            'billingAddress': billingAddress,
            'funnelBoxId': !!_qById('txtProductWarranty') ? (_qById('txtProductWarranty').checked ? _qById('txtProductWarranty').value : 0) : 0
        };

        //Addtional Miniupsell Data
        const miniUpsell = _qById('txtMiniUpsellPID');
        if (miniUpsell) {
            if(miniUpsell.checked) {
                orderData.miniUpsell = {
                    'productId': Number(miniUpsell.dataset.id),
                    'shippingMethodId': Number(_qById('txtMiniUpsellShippingID').dataset.id)
                };
            }
        }

        if(_qById('ddl_installpayment')) {
            orderData.payment.Instalments = _qById('ddl_installpayment').value;
        }

        return orderData;
    }

    function saveInforForUpsellPage(orderResponse) {
        var shippingFee = 0,
            lifetimePrice = 0,
            lifetimeRate = 0,
            productWarranty = 0;

        if(product.shippings != null && product.shippings.length > 0) {
            shippingFee = product.shippings[0].price;
        }
        if(_qById('txtProductWarranty') != null) {
            if(_qById('txtProductWarranty').checked === true) {
                let lifeTimeInfo = getLifetimePrice(product);
                lifetimePrice = lifeTimeInfo[0];
                lifetimeRate = lifeTimeInfo[1];
            }
        }
        if(_q('#txtMiniUpsellPID') != null) {
            if(_q('#txtMiniUpsellPID').checked === true) {
                productWarranty = parseFloat(_q('.warrantyDiscountPrice').dataset.warrantydiscountprice);
            }
        }
        var orderInfo = {
            'upsells': orderResponse.upsells,
            'upsellIndex': 0,
            'countryCode': siteSetting.countryCode, //siteSetting.countryCode is bind from widget_productlist.js
            'orderNumber': orderResponse.orderNumber,
            'cusEmail': _qById('customer_email').value,
            'cardId': orderResponse.cardId,
            'paymentProcessorId': orderResponse.paymentProcessorId,
            'addressId': orderResponse.customerResult.shippingAddressId,
            'orderTotal': product.productPrices.DiscountedPrice.Value,
            'lifetimePrice': lifetimePrice,
            'lifetimeRate': lifetimeRate,
            'orderTotalFull': product.productPrices.DiscountedPrice.Value + shippingFee + lifetimePrice + productWarranty,
            'savedTotal': product.productPrices.FullRetailPrice.Value - product.productPrices.DiscountedPrice.Value,
            'quantity': product.quantity,
            'orderedProducts': [
                {
                    type: 'main',
                    sku: product.sku,
                    pid: product.productId,
                    name: _qById('productname_' + product.productId) ? _qById('productname_' + product.productId).value : ''
                }
            ],
            installmentValue: _qById('ddl_installpayment') ? _qById('ddl_installpayment').value : '',
            installmentText: (window.widget && window.widget.installmentpayment) ? window.widget.installmentpayment.optionText : ''
        };

        utils.localStorage().set('orderInfo', JSON.stringify(orderInfo));
    }

    function placeMainOrder(paymenttype) {
        const checkCustomerForm = utils.customerForm.isValid();
        // const payment = _q('input[name="paymentmethod"]:checked');
        const payment = true;
        if (!payment) {
            console.log('please select a payment method');
            return;
        } else {
            const checkCreditCardForm = utils.creditcardForm.isValid();
            const checkShippingForm = window.widget.shipping.isValid();
            const checkProductListValue = window.widget.productlist !== undefined ? window.widget.productlist.isValidProductList() : true;
            let checkBillingForm = true;

            //check billing if exist
            if(_q('.widget-billing-form')) {
                const checkedRadio = _q('input[name="radio_choose_billing"]:checked');
                if(checkedRadio && checkedRadio.id === 'radio_different_shipping') {
                    checkBillingForm = utils.billingForm.isValid();
                }
            }
            if (!checkCustomerForm || !checkShippingForm || !checkCreditCardForm || !checkBillingForm || !checkProductListValue) {
                console.log('invalid data');

                //Exute functiona focusErrorInputField
                utils.focusErrorInputField();
                return;
            }
        }

        utils.showAjaxLoading();

        const orderData = getOrderData(paymenttype);

        eCRM.Order.placeOrder(orderData, paymenttype, function (result) {
            //make a flag is that has a order successfully, will be used in decline page
            utils.localStorage().set('mainOrderLink', location.pathname);

            if (result && result.success) {
                utils.localStorage().set('user_firstname', orderData.customer.firstName);
                utils.localStorage().set('user_lastname', orderData.customer.lastName);
                saveInforForUpsellPage(result);

                //utils.fireMainOrderToGTMConversionV2();

                if (result.callBackUrl) {
                    document.location = result.callBackUrl;
                } else if (result.paymentContinueResult && result.paymentContinueResult.actionUrl !== '') {
                    document.location = result.paymentContinueResult.actionUrl;
                } else if (result.upsells.length > 0 && result.upsells[0].upsellUrl !== '') {
                    const redirectUrl = result.upsells[0].upsellUrl.substr(result.upsells[0].upsellUrl.lastIndexOf('/') + 1);
                    location.href = redirectUrl;
                } else {
                    utils.redirectPage(siteSetting.successUrl);
                }
            } else {
                utils.localStorage().set('userPaymentType', 'creditcard');
                utils.redirectPage(siteSetting.declineUrl);
            }
        });
    }

    function handleButtonClick() {
        _qById('js-basic-cta-button').addEventListener('click', function (e) {
            e.preventDefault();
            placeMainOrder('creditcard');
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        handleButtonClick();
    });
})(window.utils);
