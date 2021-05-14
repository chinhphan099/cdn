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
            //update
            if(!!document.querySelector('.loading-wrap'))
                document.querySelector('.loading-wrap').classList.add('active');
            else Utils.showAjaxPageLoading();
            const orderData = this.getOrderData();
            this.ecommjs.Checkout.CreditCardPayment.placeOrder(this.cart.sessionId, orderData, (err, result) => {
                if (err != null) {
                    //update
                    if(!!document.querySelector('.btn-order-popup')) {
                        document.querySelector('.loading-wrap').classList.remove('active');
                        document.querySelector('body').classList.add('open-modal');
                        return;
                    }

                    Utils.redirectPage(constants.DECLINE_URL);
                    return;
                }

                if (result && result.success) {
                    //update
                    if(!!document.querySelector('.loading-wrap') && document.querySelector('.payment-success'))
                        {
                            document.querySelector('.processe-loading').classList.add('hidden');
                            document.querySelector('.payment-success').classList.remove('hidden');
                        }

                    localStorage.removeItem(constants.CART);
                    localStorage.removeItem('isFiredConfirmTotal');
                    this.saveLocalStorage(result, 'creditcart');
                    Utils.redirectPage(constants.CONFIRM_URL);
                }
                else {
                    //update
                    if(!!document.querySelector('.btn-order-popup')) {
                        document.querySelector('.loading-wrap').classList.remove('active');
                        document.querySelector('body').classList.add('open-modal');
                        return;
                    }

                    Utils.redirectPage(constants.DECLINE_URL);
                }
            });
        //}
    }

    getOrderData() {
        const expiredate = document.getElementById('creditcard_expirydate');
        let expiration = expiredate.value.replace('/', '/20');
        let billingAddress = null;

        if(!document.getElementById('same-as-shipping').checked) {
            billingAddress = {
                'firstName': !!document.getElementById('billing_firstname') ? document.getElementById('billing_firstname').value : firstName,
                'lastName': !!document.getElementById('billing_lastname') ? document.getElementById('billing_lastname').value : lastName,
                'address1': document.getElementById('billing_address1').value,
                'address2': document.getElementById('billing_address2') != null ? document.getElementById('billing_address2').value : '',
                'city': document.getElementById('billing_city').value,
                'countryCode': document.getElementById('billing_country').value,
                'state': document.getElementById('billing_state').value,
                'zipCode': document.getElementById('billing_postcode').value,
                'phoneNumber': !!document.getElementById('billing_phone') ? document.getElementById('billing_phone').value : phoneNumber
            };
        }

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
            useShippingAddressForBilling: document.getElementById('same-as-shipping').checked ? true : false,
            payment: {
                'name': document.getElementById('shipping_firstname').value + ' ' + document.getElementById('shipping_lastname').value,
                'creditcard': document.getElementById('creditcard_creditcardnumber').value.toString().replace(/\-/g, ''),
                'creditCardBrand': "Visa", //TODO
                'expiration': expiration,
                'cvv': document.getElementById('creditcard_cvv').value
            },
            billingAddress: billingAddress
        }

        if (window.PaymentProcessorId === 62) {
            orderData.payment = {
                PaymentProcessorId: window.PaymentProcessorId
            }
        }
        if (window.GiftCardNumber) {
            orderData.GiftCardNumber = window.GiftCardNumber;
        }

        return orderData;
    }

    saveLocalStorage(result) {
        const address2 = document.getElementById('shipping_address2') ? document.getElementById('shipping_address2').value : '',
              city = document.getElementById('shipping_city').value,
              countryName = document.querySelector('#shipping_country option:checked').text,
              state = document.querySelector('#shipping_state option:checked').text,
              emailCustomer = document.getElementById('customer_email').value,
              zipCode = document.getElementById('shipping_postcode').value;
        let shippingAddress = this.getOrderData().shippingAddress, billingAddress = this.getOrderData().billingAddress;
        shippingAddress.customerCountryName = document.querySelector('#shipping_country option:checked').text;
        shippingAddress.stateName = state;
        if(!!this.getOrderData().billingAddress) {
           billingAddress.customerCountryName = document.querySelector('#billing_country option:checked').text;
           billingAddress.stateName = document.querySelector('#billing_state option:checked') ? document.querySelector('#billing_state option:checked').text : '';
        }

        const obj = {
            products: this.cart.items,
            email: `${emailCustomer}`,
            //zipCode: `${zipCode}`,
            cartNumber: result.shoppingCartNumber,
            //customerAddress: `${address1}`,
            //customerCity: `${city}, ${zipCode}, ${state}`,
            //customerCountryName: `${countryName}`,
            shippingAddress: shippingAddress,
            billingAddress: billingAddress,
            paymentMethod: result.descriptor,
            couponCode: this.cart.couponCode ? this.cart.couponCode : ''
        };
        localStorage.setItem(constants.CHECKOUT_SUCCESS, JSON.stringify(obj));
    }
}
