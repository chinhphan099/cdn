(function (utils) {
    window.localStorage.clear();
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    let product = null;
    //set webkey temp
    const eCRM = new EmanageCRMJS({
        webkey: siteSetting.webKey,
        x_cid: siteSetting.CID,
        lang: '',
        isTest: utils.getQueryParameter('isCardTest') ? true : false
    });

    function handleButtonClickChina() {
        let ctabtn = _qById('js-basic-cta-button') ? _qById('js-basic-cta-button'): null ;
        if(!ctabtn) return false;
        ctabtn.addEventListener('click', function (e) {
            e.preventDefault();
            if(utils.localStorage().get('china-pay') > 0) {
                let srcIcon = '//d16hdrba6dusey.cloudfront.net/sitecommon/images/';
                if(utils.localStorage().get('china-pay') < 34)
                {
                    srcIcon = srcIcon + 'alipay.png';
                }
                else {
                    srcIcon = srcIcon + 'wechat.png';
                }
                _q('.logo-content img').setAttribute('src',srcIcon);
                orderWithWeChat();
                return true;
            }
            placeMainOrder('creditcard');
        });
    }

    function orderWithWeChat (){
        const postOrderData = {
            "ShippingMethodId":getSelectedProduct().shippings.length > 0 ? getSelectedProduct().shippings[0].shippingMethodId : null,
            "UseShippingAddressForBilling":true,
            "ProductId":getSelectedProduct().productId ? getSelectedProduct().productId : '',
            "Customer":getCustomerInfo(),
            "Payment":{
                "PaymentProcessorId":utils.localStorage().get('china-pay') > 0 ? utils.localStorage().get('china-pay') : ''
            },
            "ShippingAddress":window.widget.shipping.getShippingAddress(),
            "Analytics":{
                "LandingUrl":"index.html",
                "Browser":navigator.vendor,
                "Os":navigator.platform,
                "ScreenResolution":screen.width +'x'+ screen.height,
                "Device":navigator.appVersion
            },
            "AntiFraud":{
                "SessionId":utils.localStorage().get('antiFraud') ? JSON.parse(utils.localStorage().get('antiFraud')).sessionId : ''
            }
        };

        if(checkDataforOrder()){
            //set tamp wait config
            //siteSetting.webKey = '424e051c-2714-4d28-8acd-9c29ad021f95';
            let urlOrder = "https://sales-api.ecrm-prod-environment.p.azurewebsites.net/api/orders/{webkey}";
            urlOrder = urlOrder.replace('{webkey}', siteSetting.webKey);
            utils.showAjaxLoading();
            callAPIwithUrl(urlOrder, postOrderData , function(result) {
                if (result && result.success) {
                    _qById('qrcode').innerHTML = "";
                    var qrcode = new QRCode("qrcode", {
                        text: result.callBackUrl,
                        width: 250,
                        height: 250,
                        colorDark : "#000000",
                        colorLight : "#ffffff",
                        correctLevel : QRCode.CorrectLevel.H
                    });
                    getInforOfQRCode();
                    showPopup();
                } else if (result){
                    utils.localStorage().set('mainOrderLink',location.pathname);
                    utils.redirectPage(siteSetting.declineUrl);
                }

            });
        }
    }

    function showPopup() {
        _q('.parent-popup').classList.remove('hidden');
        _q('.loaded .preloading-wrapper').classList.add('hidden');
    }
    function getInforOfQRCode() {

        //show price wantity
        let priceWantiti =  _q('.spanWarrantyPrice').innerHTML;
        _q('.lifetimequantity').innerHTML = priceWantiti;

        //price selected
        let productSelect =JSON.parse(_q('input[name="product"]:checked').dataset.product).productPrices.DiscountedPrice.FormattedValue ;
        _q('.layer-price .price').innerHTML = productSelect;
        //get Time reduce content
        getTimReduce();
        //get number product
        let number =JSON.parse(_q('input[name="product"]:checked').dataset.product).quantity ;
        _q('.layer-price .number').innerHTML = number;
    }
    function getTimReduce(){
        const expirationtime = 1/6;
        if (expirationtime) {
            // Set the date we're counting down to
            var countDownDate = new Date().getTime();
            countDownDate += (expirationtime * 1000 * 60 * 60);

            // Update the count down every 1 second
            var timer = setInterval(function () {

                // Get todays date and time
                var now = new Date().getTime();

                // Find the distance between now and the count down date
                var distance = countDownDate - now;

                // Time calculations for days, hours, minutes and seconds
                //var days = Math.floor(distance / (1000 * 60 * 60 * 24));
                var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                var seconds = Math.floor((distance % (1000 * 60)) / 1000);

                // Output the result in an element with id="demo"
                _q('.cm_hours').innerHTML = hours.toString().length === 1 ? '0' + hours : hours;
                _q('.cm_minutes').innerHTML = minutes.toString().length === 1 ? '0' + minutes : minutes;
                _q('.cm_seconds').innerHTML = seconds.toString().length === 1 ? '0' + seconds : seconds;

                // If the count down is over, write some text
                if (distance < 0 || (hours == 0 && minutes == 0 && seconds == 0)) {
                    clearInterval(timer);
                    const timerContent = _q('.js-timer-content');
                    timerContent.parentNode.removeChild(timerContent);
                    _q('.js-expire-message').style.display = 'block';
                }
            }, 1000);
        }
    }

    function getCustomerInfo(){

        const firstName = _qById('customer_firstname') ? _qById('customer_firstname').value : _qById('shipping_firstname').value;
        const lastName = _qById('customer_lastname') ? _qById('customer_lastname').value : _qById('shipping_lastname').value;

        let cpf = '';
        if (_qById('customer_cpf')) {
            cpf = _qById('customer_cpf').value;
        }

        const customerInfo = {
            "CustomerIdentificationValue":"",
            "Email": _qById('customer_email').value,
            "PhoneNumber": _qById('customer_phone').value,
            "FirstName": firstName,
            "LastName": lastName,
            "IP" :utils.localStorage().get('IPClient') ? utils.localStorage().get('IPClient'): ''
        };
        if (cpf !== '') {
            customerInfo.customerIdentificationValue = cpf;
            customerInfo.customerIdentificationTypeId = 1; //always 1
            customerInfo.phoneNumber = _qById('customer_phone').value.replace(/\(|\)|\ |\-|\+/gi, '');
        }

        return customerInfo;
    };

    getIp('https://ipinfo.io/?callback', function(result) {

        if (result) {
            utils.localStorage().set('IPClient',result.ip)
        } else {
            console.log('false when get IP');
        }

    });

    function checkDataforOrder (){
        const checkCustomerForm = utils.customerForm.isValid();
        let checkCreditCardForm = '';
        if(utils.localStorage().get('china-pay') > 0) checkCreditCardForm = true;
        else checkCreditCardForm = utils.creditcardForm.isValid();
        const checkShippingForm = window.widget.shipping.isValid();
        let checkBillingForm = true;

        //check billing if exist
        if(_q('.widget-billing-form')) {
            const checkedRadio = _q('input[name="radio_choose_billing"]:checked');
            if(checkedRadio && checkedRadio.id === 'radio_different_shipping') {
                checkBillingForm = utils.billingForm.isValid();
            }
        }
        if (!checkCustomerForm || !checkShippingForm || !checkCreditCardForm || !checkBillingForm) {
            console.log('invalid data');
            return false;
        } else return true;
    }

    function placeMainOrder(paymenttype) {
        if(!checkDataforOrder()) return;
        utils.showAjaxLoading();
        const orderData = getOrderData(paymenttype);
        eCRM.Order.cid = siteSetting.CID;
        eCRM.Order.placeOrder(orderData, paymenttype, function (result) {
            //make a flag is that has a order successfully, will be used in decline page
            utils.localStorage().set('mainOrderLink', location.pathname);

            if (result && result.success) {
                utils.localStorage().set('user_firstname', orderData.customer.firstName);
                utils.localStorage().set('user_lastname', orderData.customer.lastName);
                saveInforForUpsellPage(result);

                if (result.callBackUrl) {
                    document.location = result.callBackUrl;
                } else if (result.paymentContinueResult && result.paymentContinueResult.actionUrl !== "") {
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
    //order data for Creditcard
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

        let useShippingAddressForBilling = true;
        if(_q('.widget-billing-form')) {
            const checkedRadio = _q('input[name="radio_choose_billing"]:checked');
            if(checkedRadio && checkedRadio.id === 'radio_different_shipping') {
                useShippingAddressForBilling = false;
            }
        }

        let firstName = _qById('customer_firstname') ? _qById('customer_firstname').value : _qById('shipping_firstname').value;
        let lastName = _qById('customer_lastname') ? _qById('customer_lastname').value : _qById('shipping_lastname').value;

        let billingAddress = null;
        if(!useShippingAddressForBilling) {
            billingAddress = {
                "firstName": _qById('billing_firstname').value,
                "lastName": _qById('billing_lastname').value,
                "address1": _qById('billing_address1').value,
                "address2": "",
                "city": _qById('billing_city').value,
                "countryCode": _qById('billing_country').value,
                "state": _qById('billing_province').value,
                "zipCode": _qById('billing_postal').value,
                "phoneNumber": _qById('billing_phone').value
            }
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
            "couponCode": couponCode,
            "shippingMethodId": ((product.shippings.length > 0) ? product.shippings[0].shippingMethodId : null),
            "comment": "",
            "useShippingAddressForBilling": useShippingAddressForBilling,
            "productId": product.productId,
            "customer": window.widget.customer.getCustomerInfo(),
            "payment": {
                "name": firstName + ' ' + lastName,
                "creditcard": _qById('creditcard_creditcardnumber').dataset.cardnumber,
                "creditCardBrand": _qById('creditcard_creditcardnumber').dataset.cardtype,
                "expiration": expiration,
                "cvv": _qById('creditcard_cvv').value
            },
            "shippingAddress": window.widget.shipping.getShippingAddress(),
            "billingAddress": billingAddress,
            "funnelBoxId": _qById('txtProductWarranty').checked ? _qById('txtProductWarranty').value : 0
        }

        if(_qById('ddl_installpayment')) {
            orderData.payment.Instalments = _qById('ddl_installpayment').value;
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

    function selectCreditCard() {
        const chinaRadio = _qAll('.new-pay');
        if(!chinaRadio) return;
        if (chinaRadio) {
            Array.prototype.slice.call(chinaRadio).forEach(function (elem) {
                selectChinaPay(elem);
            });
        }

    }
    function selectChinaPay(paymentChina){
        paymentChina.onclick = function (e) {
            //show customer info form
            if (_q('.widget-customer-form')) {
                _q('.widget-customer-form').classList.remove('hidden');
                _q('.widget-customer-form').scrollIntoView();
            }

            //show installment payment form
            if (_q('.widget-installpayment-form')) {
                _q('.widget-installpayment-form').classList.remove('hidden');
            }

            //show credit card form
            if (_q('.widget-creditcard-form') && utils.localStorage().set('china-pay') < 1) {
                _q('.widget-creditcard-form').classList.remove('hidden');
            }
            else  _q('.widget-creditcard-form').classList.add('hidden');
            //show shipping form
            if (_q('.widget-shipping-form')) {
                _q('.widget-shipping-form').classList.remove('hidden');
            }

            //show billing form
            if(_q('.widget-billing-form') && utils.localStorage().set('china-pay') < 1) {
                _q('.widget-billing-form').classList.remove('hidden');
            }
            else  _q('.widget-billing-form').classList.add('hidden');

            //hide paypal button
            if(_qById('js-basic-paypal-cta-button')) {
                _qById('js-basic-paypal-cta-button').classList.add('hidden');
            }

            //show credit submit button
            if(_qById('js-basic-cta-button')) {
                _qById('js-basic-cta-button').classList.remove('hidden');
                _qById('js-basic-cta-button').style.display = 'block';
            }
        }
    }


    function saveInforForUpsellPage(orderResponse) {
        var orderInfo = {
            'upsells': orderResponse.upsells,
            'upsellIndex': 0,
            'countryCode': siteSetting.countryCode, //siteSetting.countryCode is bind from widget_productlist.js
            'orderNumber': orderResponse.orderNumber,
            'cusEmail': _qById('customer_email').value,
            'cardId': orderResponse.cardId,
            'paymentProcessorId': orderResponse.paymentProcessorId,
            'addressId': orderResponse.customerResult.shippingAddressId,
            'savedTotal': product.productPrices.FullRetailPrice.Value - product.productPrices.DiscountedPrice.Value,
            'orderedProducts': [
                {
                    type: 'main',
                    sku: product.sku,
                    name: _qById('productname_' + product.productId) ? _qById('productname_' + product.productId).value : ''
                }
            ],
            installmentValue: _qById('ddl_installpayment') ? _qById('ddl_installpayment').value : '',
            installmentText: (window.widget && window.widget.installmentpayment) ? window.widget.installmentpayment.optionText : ''
        }

        utils.localStorage().set('orderInfo', JSON.stringify(orderInfo));
    }

    function callAPIwithUrl(url, postOrderData,cb){
        callAjax(url, {
            cid: siteSetting.CID,
            method: 'POST',
            data:postOrderData
        }).then(result => {
            if (typeof cb === 'function') {
            cb(result);
        }
    }).catch(err => {
            if (typeof cb === 'function') {
            cb(err);
        }
    });
    }
    function getIp(url,cb) {
        callAjaxIP(url, {
            method: 'GET',
        }).then(result => {
            if (typeof cb === 'function') {
            cb(result);
        }
    }).catch(err => {
            if (typeof cb === 'function') {
            cb(err);
        }
    });
    }

    function callAjaxIP(url, options = {}) {
        let setting = {
            method: typeof options.method === 'undefined' ? 'GET' : options.method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

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

    function callAjax(url, options = {}) {
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

    function clickOnPayment(){

        _q('.wechat').addEventListener('click', function (e) {
            //selectChinaPay(this);
            utils.localStorage().set('china-pay', '34');
            activeClick(this);
        });

        _q('.creditcard-normal').addEventListener('click', function (e) {
            utils.localStorage().set('china-pay', '0');
            const payment = _qAll('.new-pay');
            removeactive(payment);
        });

        _q('.alipay').addEventListener('click', function (e) {
            //selectChinaPay(this);
            utils.localStorage().set('china-pay', '33');
            activeClick(this);
        });
    }

    function activeClick(selected) {
        const payment = _qAll('.new-pay');
        removeactive(payment);
        selected.classList.add('active');
    }

    function removeactive (payment){
        if (payment) {
            Array.prototype.slice.call(payment).forEach(function (elem) {
                elem.classList.remove('active');
            });
        }
    }
    function closePopUp() {
        _qById('close-popup').addEventListener('click', function (e) {
            _q('.parent-popup').classList.add('hidden');
        });
    }
    document.addEventListener('DOMContentLoaded', function () {
        selectCreditCard();
        clickOnPayment();
        handleButtonClickChina();
        closePopUp();
    });
})(window.utils);