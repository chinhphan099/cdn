(function (utils) {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    if (!siteSetting) {
        console.log('window.siteSetting object is not found');
        return;
    }

    const eCRM = new EmanageCRMJS({
        webkey: siteSetting.webKey,
        cid: siteSetting.CID,
        lang: '',
        isTest: utils.getQueryParameter('isCardTest') ? true : false
    });

    try {
        eCRM.Order.getMidAndPrn((data) => {
            if (data) {
                initStripeButton(data);
            }
        }, 54);
    } catch (err) {
        console.log('can not get midid: ', err);
    }


    function initStripeButton(resData) {
        //store midid to be used for confirming payment
        window.sessionStorage.setItem('midId', resData.midId);

        const stripe = Stripe(resData.prnCode.split(';')[0], { stripeAccount: resData.prnCode.split(';')[1] });

        //init instance with default value
        window.paymentRequest = stripe.paymentRequest({
            country: 'US',
            currency: 'usd',
            total: {
                label: 'Sample Product',
                amount: 0,
            },
            requestPayerName: true,
            requestPayerEmail: true,
            requestPayerPhone: true
        });

        // Check the availability of the Payment Request API first.
        window.paymentRequest.canMakePayment().then(function (result) {
            if (result) {
                console.log(result);
                _q('body').classList.remove('google-in-progress', 'apple-in-progres')

                if (result.applePay) {
                    const btnApple = document.getElementById('btn-apple-pay');
                    if(btnApple) {
                        btnApple.classList.remove('hidden');
                        btnApple.addEventListener('click', e => {
                            e.preventDefault();
                            window.gapFlag = true;
                            window.paypalFlag = false;
                            window.ccFlag = false;
                            _q('body').classList.add('apple-in-progress');
                            if(!!_q('.widget_modal_upsell')) {
                                _q('.widget_modal_upsell').style.display = 'block';
                            }
                            else if(!!window.preventCheckoutGAP){
                                return;
                            }
                            else {
                                handleAppleGoogleClick();
                            }
                        });
                    }
                } else {
                    const btnGoogle = document.getElementById('btn-google-pay');
                    if(btnGoogle) {
                        btnGoogle.classList.remove('hidden');
                        btnGoogle.addEventListener('click', e => {
                            e.preventDefault();
                            window.gapFlag = true;
                            window.paypalFlag = false;
                            window.ccFlag = false;
                            _q('body').classList.add('google-in-progress');
                            if(!!_q('.widget_modal_upsell')) {
                                _q('.widget_modal_upsell').style.display = 'block';
                            }
                            else if(!!window.preventCheckoutGAP){
                                return;
                            }
                            else {
                                handleAppleGoogleClick();
                            }
                        });
                    }
                }

                const dividerCCLine = document.querySelector('.divider.or-cc');
                dividerCCLine.style.display = 'block';
            } else {
                console.log('not support');
            }
        });

        window.paymentRequest.on('cancel', function (event) {
            console.log(event);
            _q('.checked-item .js-unitDiscountRate').click();
        });
        window.paymentRequest.on('source', function (event) {
            console.log(event);
            event.complete('success');
            placeMainOrder('google_apple_pay', event);
        });
    }

    function handleAppleGoogleClick() {
        const prod = getSelectedProduct();
        const grandTotalElm = document.querySelector('.grand-total');
        let amount = 0;
        if (grandTotalElm) {
            amount = Number(grandTotalElm.innerText.replace(/[^0-9]/g, ''));
        }
        if (window.additionPriceValue) {
            let add = window.additionPriceValue.toFixed(2).replace(/[^0-9]/g, '');
            amount += Number(add);
        }
        window.paymentRequest.update({
            currency: utils.localStorage().get('currencyCode').toLowerCase(),
            total: {
                label: prod.productName,
                amount,
            }
        });
        window.paymentRequest.show();
    }

    let product = null,
        upsellIndex = 0;

    var getLifetimePrice = function (product) {
        const warrantyRate = [0.1, 0.2, 0.2, 0.2, 0.2, 0.3, 0.5, 0.15, 0.25, 0.35, 0.4, 0.45, 0.55, 0.6];
        const funnelId = document.querySelector('#txtProductWarranty').value;
        const funnelPrice = warrantyRate[parseInt(funnelId) - 1];
        var lifetimePrice = (Math.round(100 * product.productPrices.DiscountedPrice.Value * funnelPrice) / 100);
        return [lifetimePrice, funnelPrice];
    };

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

    function getOrderData(paymentData) {
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

        const source = paymentData.source;
        const fullName = paymentData.payerName.split(' ');

        const orderData = {
            'couponCode': couponCode,
            'shippingMethodId': product.shippings.length > 0 ? product.shippings[shippingIndex].shippingMethodId : null,
            'comment': '',
            'useShippingAddressForBilling': true,
            'productId': product.productId,
            'customer': {
                'email': paymentData.payerEmail,
                'phoneNumber': paymentData.payerPhone,
                'firstName': fullName[0],
                'lastName': fullName[1]
            },
            'payment': {
                "paymentProcessorId": 54
            },
            'shippingAddress': {
                'firstName': fullName[0],
                'lastName': fullName[1],
                'address1': source.owner.address.line1,
                'address2': source.owner.address.line2,
                'city': source.owner.address.city,
                'zipCode': source.owner.address.postal_code,
                'state': source.owner.address.state,
                'countryCode': source.owner.address.country,
                'phoneNumber': paymentData.payerPhone
            },
            'billingAddress': null,
            'funnelBoxId': !!_qById('txtProductWarranty') ? (_qById('txtProductWarranty').checked ? _qById('txtProductWarranty').value : 0) : 0
        };

        //Addtional Miniupsell Data
        const miniUpsell = _qById('txtMiniUpsellPID');
        if (miniUpsell) {
            if (miniUpsell.checked) {
                orderData.miniUpsell = {
                    'productId': Number(miniUpsell.dataset.id),
                    'shippingMethodId': Number(_qById('txtMiniUpsellShippingID').dataset.id)
                };
            }
        }

        if (!!window.multipleMiniUpsells && window.multipleMiniUpsells.length > 0) {
            orderData.multipleMiniUpsells = window.multipleMiniUpsells;
        }

        if (_qById('ddl_installpayment')) {
            orderData.payment.Instalments = _qById('ddl_installpayment').value;
        }

        //Adding Maropost Id - Tu Nguyen - CTAButton
        if (!!window.maroPostSettingId && maroPostSettingId.isSelected) {
            if (maroPostSettingId.id.trim() !== "") {
                orderData.additionalInfo = [{
                    "key": "MaropostSettingsId",
                    "value": maroPostSettingId.id
                }];
            }
        }

        return orderData;
    }

    function saveInforForUpsellPage(orderResponse, cusEmail) {
        var shippingFee = 0,
            lifetimePrice = 0,
            lifetimeRate = 0,
            productWarranty = 0;

        const fValue = product.productPrices.DiscountedPrice.FormattedValue.replace(/[,|.]/g, '');
        const pValue = product.productPrices.DiscountedPrice.Value.toString().replace(/\./, '');

        if (product.shippings != null && product.shippings.length > 0) {
            shippingFee = product.shippings[0].price;
        }

        if (_qById('txtProductWarranty') != null) {
            if (_qById('txtProductWarranty').checked === true) {
                let lifeTimeInfo = getLifetimePrice(product);
                lifetimePrice = lifeTimeInfo[0];
                lifetimeRate = lifeTimeInfo[1];
            }
        }
        if (_q('#txtMiniUpsellPID') != null) {
            if (_q('#txtMiniUpsellPID').checked === true) {
                if (!!_q('.warrantyDiscountPrice')) {
                    productWarranty = parseFloat(_q('.warrantyDiscountPrice').dataset.warrantydiscountprice);
                }
            }
        }

        const fCurrency = fValue.replace(pValue, '######').replace(/\d/g, '');
        var orderInfo = {
            'upsells': orderResponse.upsells,
            'upsellIndex': upsellIndex,
            'countryCode': siteSetting.countryCode, //siteSetting.countryCode is bind from widget_productlist.js
            'orderNumber': orderResponse.orderNumber,
            'cusEmail': cusEmail,
            'cusPhone': _qById('customer_phone') ? _qById('customer_phone').value : '',
            'cusFirstName': _qById('customer_firstname') ? _qById('customer_firstname').value : '',
            'cusLastName': _qById('customer_lastname') ? _qById('customer_lastname').value : '',
            'cusCity': _qById('shipping_city') ? _qById('shipping_city').value : '',
            'cusState': _qById('shipping_province') ? _qById('shipping_province').value : '',
            'cusCountry': _qById('shipping_country') ? _qById('shipping_country').value : '',
            'cusZip': _qById('shipping_postal') ? _qById('shipping_postal').value : '',
            'cardId': orderResponse.cardId,
            'cardType': !!_qById('creditcard_creditcardnumber') ? _qById('creditcard_creditcardnumber').dataset.cardtype : "",
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
                    type: 'main',
                    sku: product.sku,
                    pid: product.productId,
                    name: _qById('productname_' + product.productId) ? _qById('productname_' + product.productId).value : ''
                }
            ],
            installmentValue: _qById('ddl_installpayment') ? _qById('ddl_installpayment').value : '',
            installmentText: (window.widget && window.widget.installmentpayment) ? window.widget.installmentpayment.optionText : '',
            url: location.pathname
        };
        utils.localStorage().set('orderInfo', JSON.stringify(orderInfo));

        //success page will use this trackingNumber to call comfirm payment api
        utils.localStorage().set('trackingNumber', orderResponse.trackingNumber);
    }

    function isValidInfos() {
        const checkCustomerForm = utils.customerForm.isValid();
        // const payment = _q('input[name="paymentmethod"]:checked');
        const payment = true;
        if (!payment) {
            console.log('please select a payment method');
            return false;
        }
        else {
            //const checkCreditCardForm = utils.creditcardForm.isValid();
            const checkShippingForm = window.widget.shipping.isValid();
            const checkProductListValue = window.widget.productlist !== undefined ? window.widget.productlist.isValidProductList() : true;
            let checkBillingForm = true;

            //check billing if exist
            if (_q('.widget-billing-form')) {
                const checkedRadio = _q('input[name="radio_choose_billing"]:checked');
                if (checkedRadio && checkedRadio.id === 'radio_different_shipping') {
                    checkBillingForm = utils.billingForm.isValid();
                }
            }

            if (!checkCustomerForm || !checkShippingForm || !checkProductListValue) {
                console.log('invalid data');

                //Exute functiona focusErrorInputField
                utils.focusErrorInputField();
                return false;
            }
        }
        return true;
    }

    function recalculateCTAPosition() {
        let ctaButton = _qById('js-basic-cta-button'),
            wrapLoadingIcon = _q('.custom-loading .wrap-loading');

        wrapLoadingIcon.style.left = ctaButton.getBoundingClientRect().left + 'px';
        wrapLoadingIcon.style.top = ctaButton.getBoundingClientRect().top + 'px';
    }

    function _hideAjaxLoading() {
        const customAjaxLoading = _q('.custom-loading');
        if (customAjaxLoading) {
            customAjaxLoading.classList.add('hidden');
            _q('body').classList.remove('overflow');
        } else {
            const preloadingElem = _q('.preloading-wrapper');
            const preloadingNumber = utils.getQueryParameter('preloading') ? utils.getQueryParameter('preloading') : 1;
            const preloading = document.getElementById('preloading' + preloadingNumber);
            if (preloading) {
                preloading.style.display = 'none';
                preloading.style.opacity = '0';
            } else if (preloadingElem) {
                preloadingElem.style.display = 'none';
                preloadingElem.style.opacity = '0';
            }
        }
    }

    function placeMainOrder(paymenttype, source) {
        //Detect upsell url to skip warranty page - TuNguyen
        upsellIndex = !!window.warrantyParam ? warrantyParam.appendParameter() : 0;

        //Show Ajax Custom Loading
        //utils.showAjaxLoading();
        let customAjaxLoading = _q('.custom-loading'),
            time = 0;

        if (!!customAjaxLoading) {
            time = 100;
            customAjaxLoading.classList.remove('hidden');
            _q('body').classList.add('overflow');

            if (customAjaxLoading.classList.contains('black-screen')) {
                recalculateCTAPosition();
            }
        }
        else {
            utils.showAjaxLoading();
        }

        const orderData = getOrderData(source);
        eCRM.Order.webkey = siteSetting.webKey;

        eCRM.Order.placeOrder(orderData, paymenttype, function (result) {
            //make a flag is that has a order successfully, will be used in decline page
            utils.localStorage().set('mainOrderLink', location.pathname);
            utils.localStorage().set('userPaymentType', paymenttype);

            if (result && result.success) {
                utils.localStorage().set('isMainOrder', 'main');
                utils.localStorage().set('user_firstname', orderData.customer.firstName);
                utils.localStorage().set('user_lastname', orderData.customer.lastName);
                saveInforForUpsellPage(result, source.payerEmail);

                utils.localStorage().set('webkey_for_success_page', siteSetting.webKey);

                //Check flag: emitAfterSuccessRedirectCheckout - to emit event fireAfterSuccess
                if (!!window.emitAfterSuccessRedirectCheckout) {
                    utils.events.emit('fireAfterSuccessRedirectCheckout', {
                        result: result,
                        orderData: orderData
                    });
                }
                else if (!!window.emitAfterSuccess) {
                    utils.events.emit('fireAfterSuccess', {
                        result: result,
                        orderData: orderData
                    });
                }

                const midId = window.sessionStorage.getItem('midId');
                eCRM.Order.confirmGoogleApplePay(result.trackingNumber, source.source.id, midId, (dataResponse) => {
                    if (dataResponse && dataResponse.success) {
                        if (result.upsells.length > 0 && result.upsells[0].upsellUrl !== '') {
                            const redirectUrl = result.upsells[0].upsellUrl.substr(result.upsells[0].upsellUrl.lastIndexOf('/') + 1);
                            location.href = redirectUrl;
                        } else {
                            utils.redirectPage(siteSetting.successUrl);
                        }
                    } else {
                        utils.redirectPage(siteSetting.declineUrl);
                    }
                });
            } else {
                utils.redirectPage(siteSetting.declineUrl);
            }
        });
    }

    function _showCCDeclineMessage() {
        _hideAjaxLoading();

        const ccDeclineMessage = _q('.js-cc-decline-message');
        if (ccDeclineMessage) {
            ccDeclineMessage.classList.remove('hidden');

            _showErrorAndFocusCCForm();
        }
    }

    function _showErrorAndFocusCCForm() {
        const ccNumber = _qById('creditcard_creditcardnumber');
        if (ccNumber) {
            ccNumber.classList.remove('input-valid');
            ccNumber.classList.add('input-error');
            ccNumber.focus();
            if (window.navigator.userAgent.indexOf("MSIE ") > 0) { //IE
                ccDeclineMessage.scrollIntoView();
            } else {
                ccDeclineMessage.scrollIntoView({ behavior: "smooth" });
            }
        }

        const cvv = _qById('creditcard_cvv');
        if (cvv) {
            cvv.classList.remove('input-valid');
            cvv.classList.add('input-error');
        }
    }

    function _showCCDeclinePopup() {
        _hideAjaxLoading();

        const ccDeclinePopup = _qById('js-cc-decline-popup');
        if (ccDeclinePopup) {
            //bind close event
            const btnOK = ccDeclinePopup.querySelector('.btn_ok');
            if (btnOK) {
                btnOK.addEventListener('click', e => {
                    e.preventDefault();
                    window.closePopup('js-cc-decline-popup');
                    _showErrorAndFocusCCForm();
                });
            }

            const iconClose = ccDeclinePopup.querySelector('.icon-close');
            if (iconClose) {
                iconClose.addEventListener('click', e => {
                    e.preventDefault();
                    window.closePopup('js-cc-decline-popup');
                    _showErrorAndFocusCCForm();
                });
            }

            //show popup
            window.showPopup('js-cc-decline-popup');
        }
    }

    function _openCCDeclinePopup() {
        // _hideAjaxLoading();

        // const ccDeclinePopup = _qById('js-cc-decline-popup');
        // if(ccDeclinePopup) {
        //     ccDeclinePopup.classList.remove('hidden');
        // }

        // //focus cc number field
        // const ccNumber = _qById('creditcard_creditcardnumber');
        // if(ccNumber) {
        //     ccNumber.focus();
        //     window.scrollTo(ccNumber.getBoundingClientRect().left, ccNumber.getBoundingClientRect().top);
        // }
    }

    function saveCustomerInfo() {
        //store into localStorage, when user back from decline page it will be autofill
        const customerInfo = {
            email: !!_qById('customer_email') ? _qById('customer_email').value : '',
            fName: !!_qById('customer_firstname') ? _qById('customer_firstname').value : '',
            lName: !!_qById('customer_lastname') ? _qById('customer_lastname').value : '',
            phone: !!_qById('customer_phone') ? _qById('customer_phone').value : '',
            address1: !!_qById('shipping_address1') ? _qById('shipping_address1').value : '',
            address2: !!_qById('shipping_address2') ? _qById('shipping_address2').value : '',
            city: !!_qById('shipping_city') ? _qById('shipping_city').value : '',
            country: !!_qById('shipping_country') ? _qById('shipping_country').value : '',
            state: !!_qById('shipping_province') ? _qById('shipping_province').value : '',
            postcode: !!_qById('shipping_postal') ? _qById('shipping_postal').value : ''
        };
        utils.localStorage().set('customerInfo', JSON.stringify(customerInfo));
    }

    // function handleButtonClick() {
    //     const ctaButton = _qById('js-stripeco-button');
    //     if (!ctaButton) return;

    //     ctaButton.addEventListener('click', function (e) {
    //         e.preventDefault();
    //         //window.ccFlag = true;
    //         window.paypalFlag = false;

    //         if (!!_q('.widget_modal_upsell')) {
    //             if (!isValidInfos()) {
    //                 return;
    //             }

    //             _q('.widget_modal_upsell').style.display = 'block';
    //         }
    //         else if (!!window.preventCheckoutRedirect || !!window.preventCheckout) {
    //             return;
    //         }
    //         else {
    //             if (!isValidInfos()) {
    //                 return;
    //             }

    //             placeMainOrder('stripe');
    //             saveCustomerInfo();
    //         }
    //     });
    // }

    document.addEventListener('DOMContentLoaded', function () {
        //handleButtonClick();
    });

    window.gap = {
        isValidInfos: isValidInfos,
        // saveCustomerInfo: saveCustomerInfo, // Still split test and not apply yet, so don't export this function!
        placeMainOrder: placeMainOrder,
        handleAppleGoogleClick: handleAppleGoogleClick
    };
})(window.utils);
