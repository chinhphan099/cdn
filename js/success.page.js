(function (utils) {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    //just use for stripe checkout
    const stripe_redirect_status_param = utils.getQueryParameter('redirect_status');
    if(stripe_redirect_status_param && stripe_redirect_status_param == 'failed') {
        utils.redirectPage(siteSetting.declineUrl);
    }

    //check has support localStorage
    // if (typeof localStorage === 'undefined') {
    //     const opts = {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify({
    //             url: location.href,
    //             device: navigator.userAgent
    //         })
    //     }
    //     fetch('https://log-success-page.firebaseio.com/nolocalstorage.json', opts);
    // }

    const successPage = {
        orderInfo: JSON.parse(utils.localStorage().get('orderInfo'))
    }

    let webkey = '';

    const userPaymentType = utils.localStorage().get('userPaymentType');

    if(userPaymentType) {
        if(userPaymentType === 'paypal') {
            webkey = utils.localStorage().get('webkey_to_check_paypal') ? utils.localStorage().get('webkey_to_check_paypal') : '';
        } else { //afterpay, ideal
            webkey = utils.localStorage().get('webkey_for_success_page') ? utils.localStorage().get('webkey_for_success_page') : '';
        }
    }

    const eCRM = new EmanageCRMJS({
        webkey: webkey,
        cid: siteSetting.CID,
        lang: '',
        isTest: utils.getQueryParameter('isCardTest') ? true : false
    });

    const upsellIndex = successPage.orderInfo.upsellIndex;

    let upsellRedirectUrl = '';
    try {
        upsellRedirectUrl = successPage.orderInfo.upsells[upsellIndex].upsellUrl;
    } catch (err) {
        upsellRedirectUrl = siteSetting.successUrl;
    }

    /*
        - afterpay
        - ideal
        - sofort
        - google and apple pay
    */
    const payments = {
        checkApprove: () => {
            const trackingNumber = utils.localStorage().get('trackingNumber') ? utils.localStorage().get('trackingNumber') : null;
            if(!trackingNumber) {
                console.log('Missing trackingNumber');
                return;
            }

            eCRM.Order.checkPaypalApprove(trackingNumber, {}, (result) => {
                if (result && result.success) {
                    if (upsellRedirectUrl.lastIndexOf('/') >= 0) { //for upsell link
                        const redirectUrl = upsellRedirectUrl.substring(upsellRedirectUrl.lastIndexOf('/') + 1, upsellRedirectUrl.indexOf('?') >= 0 ? upsellRedirectUrl.indexOf('?') : upsellRedirectUrl.length);
                        location.href = redirectUrl + location.search;
                    } else { //redirect to confirm page
                        location.href = upsellRedirectUrl + location.search;
                    }
                } else {
                    //remove gtm upsell purchas event
                    utils.localStorage().remove('fireUpsellForGTMPurchase');

                    //utils.localStorage().set('userPaymentType', 'ideal');
                    if (utils.localStorage().get('isMainOrder') === 'upsell') {
                        location.href = siteSetting.successUrl + location.search;
                    } else {
                        //redirect to decline page
                        location.href = siteSetting.declineUrl + location.search;
                    }
                }
            });
        }
    };

    const paypal = {
        getTransactionNumber: () => {
            return utils.getQueryParameter('paymentId'); //paypal
        },
        getToken: () => {
            return utils.getQueryParameter('token');
        },
        checkPaypalApprove: () => {
            const postData = {
                trackingCountryCode: '',
                trackingLanguageCountryCode: '',
                paymentProcessorId: successPage.orderInfo.paymentProcessorId
            };

            let trackingNumber = '';
            if (successPage.orderInfo.paymentProcessorId == '31') {
                trackingNumber = paypal.getToken();
            } else {
                trackingNumber = paypal.getTransactionNumber();
                if (!trackingNumber || trackingNumber === '') {
                    trackingNumber = paypal.getToken();
                }
            }

            eCRM.Order.checkPaypalApprove(trackingNumber, postData, (result) => {
                if (result && result.success) {
                    //use firstname and lastname in upsell
                    utils.localStorage().set('user_firstname', result.address.firstName);
                    utils.localStorage().set('user_lastname', result.address.lastName);

                    // if(!!result.address.email && successPage.orderInfo.paymentProcessorId == '31') {
                    if (!!result.address) {
                        if (!!result.address.email && !successPage.orderInfo.cusEmail) {
                            successPage.orderInfo.cusEmailPP = result.address.email || '';
                        }
                        if (!!result.address.firstName) {
                            successPage.orderInfo.cusFirstName = result.address.firstName || '';
                        }
                        if (!!result.address.lastName) {
                            successPage.orderInfo.cusLastName = result.address.lastName || '';
                        }
                        if (!!result.address.city) {
                            successPage.orderInfo.cusCity = result.address.city || '';
                        }
                        if (!!result.address.state) {
                            successPage.orderInfo.cusState = result.address.state || '';
                        }
                        if (!!result.address.country) {
                            successPage.orderInfo.cusCountry = result.address.country || '';
                        }
                        if (!!result.address.zipCode) {
                            successPage.orderInfo.cusZip = result.address.zipCode || '';
                        }
                    }
                    utils.localStorage().set('orderInfo', JSON.stringify(successPage.orderInfo));

                    //utils.fireMainOrderToGTMConversionV2();

                    if (upsellRedirectUrl.lastIndexOf('/') >= 0) { //for upsell link
                        const redirectUrl = upsellRedirectUrl.substring(upsellRedirectUrl.lastIndexOf('/') + 1, upsellRedirectUrl.indexOf('?') >= 0 ? upsellRedirectUrl.indexOf('?') : upsellRedirectUrl.length);
                        location.href = redirectUrl + location.search;
                    } else { //redirect to confirm page
                        location.href = upsellRedirectUrl + location.search;
                    }
                } else {
                    //remove gtm upsell purchas event
                    utils.localStorage().remove('fireUpsellForGTMPurchase');

                    utils.localStorage().set('userPaymentType', 'paypal');
                    if (utils.localStorage().get('paypal_isMainOrder') === 'upsell') {
                        location.href = siteSetting.successUrl + location.search;
                    } else {
                        //write log to firebase
                        // try {
                        //     const d = new Date();
                        //     const loggingInfo = JSON.parse(utils.localStorage().get('loggingInfo'));
                        //     const opts = {
                        //         method: 'POST',
                        //         headers: {
                        //             'Content-Type': 'application/json'
                        //         },
                        //         body: JSON.stringify({
                        //             time: d.toISOString() + ' - ' + d.toTimeString(),
                        //             url: location.href,
                        //             response: result,
                        //             device: navigator.userAgent,
                        //             orderNumber: loggingInfo.orderNumber,
                        //             trackingNumber: loggingInfo.trackingNumber,
                        //             callBackUrl: loggingInfo.callBackUrl
                        //         })
                        //     }
                        //     fetch('https://log-success-page.firebaseio.com/ajaxfail.json', opts);
                        // } catch(err) {
                        //     console.log('error logging');
                        // }

                        //redirect to decline page
                        location.href = siteSetting.declineUrl + location.search;
                    }
                }
            });
        }
    }

    if(userPaymentType) {
        if(userPaymentType === 'paypal') {
            paypal.checkPaypalApprove();
        } else if(userPaymentType === 'stripe' || userPaymentType === 'ideal' || userPaymentType === 'google_apple_pay') {
            payments.checkApprove();
        }
    }
})(window.utils);
