import { constants } from '../common/constant.js';
import Utils from './utils.js';

export default class PaypalPayment {
    constructor() {
        this.cart = Utils.getCart();
        this.ecommjs = new EcommJS({
            webkey: siteSetting.WEBKEY,
            cid: siteSetting.CID
        });
    }

    placeOrder() {
        const paypalLoading = document.getElementById('paypal-loading-overlay');
            if (paypalLoading) {
                paypalLoading.style.display = 'block';
            }

            const orderData = {
                payment: {
                    paymentProcessorId: 5
                }
            }

            if (window.PaymentProcessorId) {
                orderData.payment.PaymentProcessorId = window.PaymentProcessorId;
            }
            if (window.GiftCardNumber) {
                orderData.GiftCardNumber = window.GiftCardNumber;
            }

            this.ecommjs.Checkout.PaypalPayment.placeOrder(this.cart.sessionId, orderData, (err, result) => {
                if (err != null) {
                    Utils.redirectPage(constants.DECLINE_URL);
                    return;
                }

                if (result && result.success) {
                    localStorage.removeItem(constants.CART);
                    localStorage.removeItem('isFiredConfirmTotal')
                    //save params for success page when redirect to confirm page
                    if (location.href.indexOf('?') > 0) {
                        localStorage.setItem('paramsForConfirmPage', location.href.split('?')[1]);
                    }
                    this.saveLocalStorage(result, 'paypal');

                    if (result.callBackUrl) {
                        location.href = result.callBackUrl;
                    } else if (result.paymentContinueResult && result.paymentContinueResult.actionUrl !== '') {
                        location.href = result.paymentContinueResult.actionUrl;
                    } else {
                        Utils.redirectPage(constants.CONFIRM_URL);
                    }
                }else{
                    //show popup decline
                    if(document.querySelector('.btn-order-popup')) {
                        document.querySelector('body').classList.add('open-modal');
                        return;
                    }

                    Utils.redirectPage(constants.DECLINE_URL);
                }
            });
    }

    saveLocalStorage(result) {
        const obj = {
            products: this.cart.items,
            cartNumber: result.shoppingCartNumber,
            customerAddress: '',
            paymentMethod: result.descriptor,
            couponCode: this.cart.couponCode ? this.cart.couponCode : ''
        };
        localStorage.setItem(constants.CHECKOUT_SUCCESS, JSON.stringify(obj));
    }
}
