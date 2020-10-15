(function (utils) {
    if (!utils) {
        console.log('modules is not found');
        return;
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

    const eCRM = new EmanageCRMJS({
        webkey: utils.localStorage().get('webkey_to_check_paypal') ? utils.localStorage().get('webkey_to_check_paypal') : '',
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
                if(!trackingNumber || trackingNumber === '') {
                    trackingNumber = paypal.getToken();
                }
            }

            eCRM.Order.checkPaypalApprove(trackingNumber, postData, (result) => {
                if (result && result.success) {
                    //use firstname and lastname in upsell
                    utils.localStorage().set('user_firstname', result.address.firstName);
                    utils.localStorage().set('user_lastname', result.address.lastName);

                    // if(!!result.address.email && successPage.orderInfo.paymentProcessorId == '31') {
                    if(!!result.address.email) {
                        let orderInfo = JSON.parse(utils.localStorage().get('orderInfo'));
                        if(!orderInfo.cusEmail) {
                            orderInfo.cusEmail = result.address.email;
                            utils.localStorage().set('orderInfo', JSON.stringify(orderInfo));
                        }
                    }

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

    paypal.checkPaypalApprove();

})(window.utils);
