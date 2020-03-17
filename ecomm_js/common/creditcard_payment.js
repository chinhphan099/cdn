import { constants } from '../common/constant.js';
import Utils from '../common/utils.js';
//import CheckoutValidate from '../common/checkoutValidation.js';

export default class CreditCardPayment {
    constructor() {
        //init validation
        //this.checkoutValidation = new CheckoutValidate();
        //this.checkoutValidation.initValidation();
        this.cart = Utils.getCart();
        this.ecommjs = new EcommJS({
            webkey: siteSetting.WEBKEY,
            cid: siteSetting.CID
        });
    }

    placeOrder() {
        //if (this.checkoutValidation.isValid()) {
            Utils.showAjaxPageLoading();
            const orderData = this.getOrderData();
            this.ecommjs.Checkout.CreditCardPayment.placeOrder(this.cart.sessionId, orderData, (err, result) => {
                if (err != null) {
                    Utils.redirectPage(constants.DECLINE_URL);
                    return;
                }

                if (result && result.success) {
                    localStorage.removeItem(constants.CART);
                    this.saveLocalStorage(result, 'creditcart');
                    if(!!siteSetting.confirmUrl) {
                        Utils.redirectPage(siteSetting.confirmUrl);
                    }
                    else {
                        Utils.redirectPage(constants.CONFIRM_URL);
                    }
                }else{
                    Utils.redirectPage(constants.DECLINE_URL);
                }
            });
        //}
    }

    getOrderData() {
        const expiredate = document.getElementById('creditcard_expirydate');
        let expiration = expiredate.value.replace('/', '/20');

        const orderData = {
            email: document.getElementById('customer_email').value,
            shippingAddress: {
                'firstName': document.getElementById('shipping_firstname').value,
                'lastName': document.getElementById('shipping_lastname').value,
                'address1': document.getElementById('shipping_address1').value,
                'address2': document.getElementById('shipping_address2') ? document.getElementById('shipping_address2').value : '',
                'city': document.getElementById('shipping_city').value,
                'zipCode': document.getElementById('shipping_postcode').value,
                'state': document.getElementById('shipping_state').value,
                'countryCode': document.getElementById('shipping_country').value,
                'phoneNumber': document.getElementById('customer_phone').value
            },
            useShippingAddressForBilling: true,
            payment: {
                'name': document.getElementById('shipping_firstname').value + ' ' + document.getElementById('shipping_lastname').value,
                'creditcard': document.getElementById('creditcard_creditcardnumber').value.toString().replace(/\-/g, ''),
                'creditCardBrand': "Visa", //TODO
                'expiration': expiration,
                'cvv': document.getElementById('creditcard_cvv').value
            },
            billingAddress: null
        }

        return orderData;
    }

    saveLocalStorage(result) {
        const address1 = document.getElementById('shipping_address1').value;
        const address2 = document.getElementById('shipping_address2') ? document.getElementById('shipping_address2').value : '';
        const city = document.getElementById('shipping_city').value;
        const countryName = document.querySelector('#shipping_country option:checked').text;

        const obj = {
            products: this.cart.items,
            cartNumber: result.shoppingCartNumber,
            customerAddress: `${address1}, ${city}, ${countryName}`,
            paymentMethod: result.descriptor,
            couponCode: this.cart.couponCode ? this.cart.couponCode : ''
        };
        localStorage.setItem(constants.CHECKOUT_SUCCESS, JSON.stringify(obj));
    }
}
