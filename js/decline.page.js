(function (utils) {
    if(top.window.opener) {
        top.window.opener.location = top.window.location.href;
        top.close();
    }

    if (!utils) {
        console.log('modules is not found');
        return;
    }

    //when paypal redirect to decline page, if has a order successfully then will redirect to confirm page
    function redirectToConfirmPage() {
        if(utils.localStorage().get('paypal_isMainOrder') && utils.localStorage().get('paypal_isMainOrder') === 'upsell') {
            //remove gtm upsell purchas event
            utils.localStorage().remove('fireUpsellForGTMPurchase');

            location.href = siteSetting.successUrl + location.search;
        } else { //remove paypal params
            //check if is redirected from Paypal
            if(utils.getQueryParameter('paymentId') || utils.getQueryParameter('token')) {
                const hrefSplit = location.href.split('?');
                if(hrefSplit.length > 1) {
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
        if(utils.localStorage().get('userPaymentType') && utils.localStorage().get('userPaymentType') === 'paypal') {
            _q('.js-paypal-decline-message').style.display = 'block';
            _q('.js-creditcard-decline-message').style.display = 'none';
        }
    }

    function handleGoBackBtn() {
        _qById('js-btn-go-back').addEventListener('click', function(e) {
            e.preventDefault();
            let mainOrder = 'order.html';
            if(utils.localStorage().get('mainOrderLink')) {
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
