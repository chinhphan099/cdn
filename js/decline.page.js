(function (utils) {
    if (top.window.opener) {
        top.window.opener.location = top.window.location.href;
        top.close();
    }

    if (!utils) {
        console.log('modules is not found');
        return;
    }

    //when paypal redirect to decline page, if has a order successfully then will redirect to confirm page
    function redirectToConfirmPage() {
        let isMainOrderCompleted = false;
        if (utils.localStorage().get('paypal_isMainOrder')) {
            if (utils.localStorage().get('isMainOrder') === 'upsell') {
                isMainOrderCompleted = true;
            }
        } else if (utils.localStorage().get('isMainOrder')) {
            if (utils.localStorage().get('isMainOrder') === 'upsell') {
                isMainOrderCompleted = true;
            }
        }

        if (isMainOrderCompleted) {
            //remove gtm upsell purchas event
            utils.localStorage().remove('fireUpsellForGTMPurchase');

            const twoLastCharUrl = location.href.substring(location.href.length - 2);
            if (location.href.indexOf('?') > -1 && location.href.indexOf('=') > -1 && twoLastCharUrl === '=1') {
                location.href = siteSetting.successUrl + location.search.slice(0, -1) + '0';
                return;
            }
            location.href = siteSetting.successUrl + location.search;
        } else { //remove paypal params
            //check if is redirected from Paypal
            if (utils.getQueryParameter('paymentId') || utils.getQueryParameter('token')) {
                const hrefSplit = location.href.split('?');
                if (hrefSplit.length > 1) {
                    let declineUrl = hrefSplit[0];
                    let urlParams = hrefSplit[1];
                    urlParams = utils.removeParamFromUrl('paymentId', urlParams);
                    urlParams = utils.removeParamFromUrl('token', urlParams);
                    urlParams = utils.removeParamFromUrl('PayerID', urlParams);
                    declineUrl = urlParams !== '' ? declineUrl + '?' + urlParams : declineUrl;
                    location.href = declineUrl;
                }
            }
        }
    }
    redirectToConfirmPage();

    function displayMessage() {
        let orderInfo = utils.localStorage().get('orderInfo');
        let paymentName = '';
        if (orderInfo && utils.localStorage().get('userPaymentType')) {
            orderInfo = JSON.parse(orderInfo);
            switch (orderInfo.paymentProcessorId) {
                case 5 || 31:
                    paymentName = 'Paypal';
                    break;
                case 42:
                    paymentName = 'Ideal';
                    break;
                case 41:
                    paymentName = 'Sofort';
                    break;
                case 39:
                    paymentName = 'Afterpay';
                    break;
				case 40:
                    paymentName = 'Sezzle';
                    break;
                default:
                    paymentName = '';
            }
        }
        else{
            if (window.applePay){
                paymentName = 'Apple';
            }
            else if (window.googlePay){
                paymentName = 'Google';
            }
        }
        const messageElemnt = _q('.js-paypal-decline-message');
        messageElemnt.innerHTML = messageElemnt.innerHTML.replace('Paypal', paymentName);
        messageElemnt.innerHTML = messageElemnt.innerHTML.replace('PayPal', paymentName);
        _q('.js-creditcard-decline-message').style.display = 'none';
        _q('.js-paypal-decline-message').style.display = 'block';       
    }

    // function displayMessage() {
    //     if(utils.localStorage().get('userPaymentType')) {
    //         let paymentName = '';
    //         switch(utils.localStorage().get('userPaymentType')) {
    //             case 'paypal':
    //                 paymentName = 'Paypal';
    //                 break;
    //             case 'ideal':
    //                 paymentName = 'Ideal';
    //                 break;
    //             default:
    //                 paymentName = '';

    //         }

    //         const messageElemnt =  _q('.js-paypal-decline-message');
    //         messageElemnt.innerHTML = messageElemnt.innerHTML.replace('{paymentName}', paymentName);
    //         _q('.js-creditcard-decline-message').style.display = 'none';
    //         messageElemnt.style.display = 'block';            
    //     }
    // }

    function handleGoBackBtn() {
        _qById('js-btn-go-back').addEventListener('click', function (e) {
            e.preventDefault();
            let mainOrder = 'order.html';
            if (utils.localStorage().get('mainOrderLink')) {
                mainOrder = utils.localStorage().get('mainOrderLink');
            }
            utils.redirectPage(mainOrder);
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        displayMessage();
        handleGoBackBtn();
    });
})(window.utils);
