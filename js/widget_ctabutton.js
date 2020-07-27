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

    var getLifetimePrice = function (product) {
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
        if (_q('.widget-billing-form')) {
            const checkedRadio = _q('input[name="radio_choose_billing"]:checked');
            if (checkedRadio && checkedRadio.id === 'radio_different_shipping') {
                useShippingAddressForBilling = false;
            }
        }

        let firstName = _qById('customer_firstname') ? _qById('customer_firstname').value : _qById('shipping_firstname').value;
        let lastName = _qById('customer_lastname') ? _qById('customer_lastname').value : _qById('shipping_lastname').value;
        let phoneNumber = _qById('customer_phone') ? _qById('customer_phone').value : '';

        let billingAddress = null;
        if (!useShippingAddressForBilling) {
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
        if (expiredate) {
            expiration = expiredate.value.replace('/', '/20');
        } else if (expiremonth && expireyear) {
            expiration = expiremonth.value + '/' + expireyear.value;
        }

        const shippingIndex = (typeof window.shippingIndex === 'number' && window.shippingIndex !== -1) ? window.shippingIndex : 0;
        const orderData = {
            'couponCode': couponCode,
            'shippingMethodId': product.shippings.length > 0 ? product.shippings[shippingIndex].shippingMethodId : null,
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
            if (miniUpsell.checked) {
                orderData.miniUpsell = {
                    'productId': Number(miniUpsell.dataset.id),
                    'shippingMethodId': Number(_qById('txtMiniUpsellShippingID').dataset.id)
                };
            }
        }

        if(!!window.multipleMiniUpsells && window.multipleMiniUpsells.length > 0) {
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

    function saveInforForUpsellPage(orderResponse) {
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
            'upsellIndex': 0,
            'countryCode': siteSetting.countryCode, //siteSetting.countryCode is bind from widget_productlist.js
            'orderNumber': orderResponse.orderNumber,
            'cusEmail': _qById('customer_email').value,
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
            const checkCreditCardForm = utils.creditcardForm.isValid();
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
            if (!checkCustomerForm || !checkShippingForm || !checkCreditCardForm || !checkBillingForm || !checkProductListValue) {
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

    function placeMainOrder(paymenttype) {
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

        const orderData = getOrderData(paymenttype);
        eCRM.Order.webkey = siteSetting.webKey;

        eCRM.Order.placeOrder(orderData, paymenttype, function (result) {
            //make a flag is that has a order successfully, will be used in decline page
            utils.localStorage().set('mainOrderLink', location.pathname);

            if (result && result.success) {
                utils.localStorage().set('user_firstname', orderData.customer.firstName);
                utils.localStorage().set('user_lastname', orderData.customer.lastName);
                utils.localStorage().set('customerId', result.customerResult.customerId);
                saveInforForUpsellPage(result);
                //Display Message successed
                if (!!customAjaxLoading) {
                    customAjaxLoading.classList.add('successed');
                }
                //utils.fireMainOrderToGTMConversionV2();

                //Making delay time to showing successful message when checkout
                setTimeout(function () {
                    if (result.callBackUrl) {
                        document.location = result.callBackUrl;
                    }
                    else if (result.paymentContinueResult && result.paymentContinueResult.actionUrl !== '') {
                        document.location = result.paymentContinueResult.actionUrl;
                    }
                    else if (result.upsells.length > 0 && result.upsells[0].upsellUrl !== '') {
                        const redirectUrl = result.upsells[0].upsellUrl.substr(result.upsells[0].upsellUrl.lastIndexOf('/') + 1);

                        //Check flag: fireAfterSuccess - to emit event fireAfterSuccess
                        if (!!window.emitAfterSuccessCredit) {
                            utils.events.emit('fireAfterSuccessCC', {
                                result: result,
                                redirectUrl: redirectUrl,
                                orderData: orderData
                            });

                            //Prevent Redirect next Url
                            if (window.stopRedirect) return;
                        }
                        else if (!!window.emitAfterSuccess) {
                            utils.events.emit('fireAfterSuccess', {
                                result: result,
                                redirectUrl: redirectUrl,
                                orderData: orderData
                            });
                        }

                        if (!customAjaxLoading) {
                            window.location.href = redirectUrl;
                        }
                        else {
                            let page = _q('body');
                            let position = 0;
                            let op = 1;
                            let slpage = setInterval(function () {
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
                    }
                    else {
                        utils.redirectPage(siteSetting.successUrl);
                    }
                }, time);
            }
            else {
                if (location.href.indexOf('en/order-ac-dcl1.html') > 0 && _q('.js-cc-decline-message')) { //split test on the page en/order-ac-dcl1.html
                    _showCCDeclineMessage();
                } else if (location.href.indexOf('en/order-ac-dcl2.html') > 0 && _qById('js-cc-decline-popup')) { ////split test on the page en/order-ac-dcl2.html
                    _showCCDeclinePopup();
                } else {
                    utils.localStorage().set('userPaymentType', 'creditcard');
                    utils.redirectPage(siteSetting.declineUrl);
                }
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
            if(btnOK) {
                btnOK.addEventListener('click', e => {
                    e.preventDefault();
                    window.closePopup('js-cc-decline-popup');
                    _showErrorAndFocusCCForm();
                });
            }

            const iconClose = ccDeclinePopup.querySelector('.icon-close');
            if(iconClose) {
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

    function handleButtonClick() {
        const ctaButton = _qById('js-basic-cta-button');
        if (!ctaButton) return;

        ctaButton.addEventListener('click', function (e) {
            e.preventDefault();
            window.ccFlag = true;
            window.paypalFlag = false;
            if (!isValidInfos()) {
                return;
            }
            if (!!_q('.widget_modal_upsell')) {
                _q('.widget_modal_upsell').style.display = 'block';
            }
            else if (!!window.preventCheckoutCredit || !!window.preventCheckout) {
                return;
            }
            else {
                placeMainOrder('creditcard');

                //store into localStorage, when user back from decline page it will be autofill
                const customerInfo = {
                    email: _qById('customer_email').value,
                    fName: _qById('customer_firstname').value,
                    lName: _qById('customer_lastname').value,
                    phone: _qById('customer_phone').value,
                    address1: _qById('shipping_address1').value,
                    address2: _qById('shipping_address2').value,
                    city: _qById('shipping_city').value,
                    country: _qById('shipping_country').value,
                    state: _qById('shipping_province').value,
                    postcode: _qById('shipping_postal').value
                };
                utils.localStorage().set('customerInfo', JSON.stringify(customerInfo));
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        handleButtonClick();
    });

    window.cc = {
        placeMainOrder: placeMainOrder,
    };
})(window.utils);
