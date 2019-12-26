import { constants } from '../common/constant.js';
import Utils from '../common/utils.js';
import CreditCardPayment from '../common/creditcard_payment.js';
import PaypalPayment from '../common/paypal_payment.js';
import CheckoutValidate from '../common/checkoutValidation.js';

class Checkout {
    constructor() {
        this.checkoutValidation = new CheckoutValidate();
        this.checkoutValidation.initValidation();
        this.ecommjs = new EcommJS({
            webkey: siteSetting.WEBKEY,
            cid: siteSetting.CID
        });
    }

    // Implement Expiration date
    implementYearDropdown() {
        const d = new Date(),
            curYear = d.getFullYear(),
            endYear = curYear + 20;

        for(let i = curYear; i < endYear; i++) {
            let opt = document.createElement('option');
            opt.value = i;
            opt.text = i;
            document.getElementById('yearddl').appendChild(opt);
        }
    }
    implementMonthDropdown() {
        const d = new Date(),
            curYear = d.getFullYear(),
            curMonth = d.getMonth() + 1,
            monthDdl = document.getElementById('monthddl');

        if(document.getElementById('yearddl').value === curYear.toString() && Number(monthDdl.value) < curMonth) {
            monthDdl.value = curMonth;
        }
    }
    setExpirationValue() {
        // Set value for creditcard_expirydate
        document.getElementById('creditcard_expirydate').value = document.getElementById('monthddl').value + '/' + document.getElementById('yearddl').value.toString().substr(2);
    }
    // End Implement Expiration date

    // bind countries for both shipping and billing
    async bindStates(countryCode, select = null) {
        let ddlStateElems;
        if(select) {
            ddlStateElems = [select];
        } else {
            ddlStateElems = document.querySelectorAll('.ddl-state');
        }

        //disable select box when binding
        for (let select of ddlStateElems) {
            select.setAttribute('disabled', 'disabled');
        }

        if(countryCode !== '') {
            this.ecommjs.Campaign.getStatesByCountryCode(countryCode, (err, result) => {
                if(err != null) {
                    for (let select of ddlStateElems) {
                        let options = '<option value="">---</option>';
                        select.innerHTML = options;
                        select.removeAttribute('disabled');
                        select.removeAttribute('required');
                    }
                    console.log('Error: can not fetch states: ', err);
                    return;
                }

                if(result) {
                    const states = Array.prototype.slice.call(result);
                    for (let select of ddlStateElems) {
                        select.setAttribute('required', '');
                        let options = '<option value="">---</option>';

                        if(states instanceof Error || typeof states === 'undefined') {
                            select.removeAttribute('required');
                            return;
                        }

                        for (let state of states) {
                            options += `<option value="${state.StateCode}">${state.StateName}</option>`;
                        };
                        select.innerHTML = options;
                        select.removeAttribute('disabled');
                    }
                }
            });
        } else {
            for (let select of ddlStateElems) {
                let options = '<option value="">---</option>';
                select.innerHTML = options;
                select.removeAttribute('disabled');
                select.removeAttribute('required');
            }
        }
    }
    getLocation() {
        let count = 1;
        this.ecommjs.Campaign.getLocation((err, result) => {
            if(err != null) {
                console.log(err);
                return;
            }

            if(result) {
                //select default country
                const selectShippingCountry = document.getElementById('shipping_country');
                const selectBillingCountry = document.getElementById('billing_country');

                if(selectShippingCountry) {
                    const timer = setInterval(() => {
                        if(count <= 15) {
                            if(selectShippingCountry.options.length > 0) {
                                if(selectShippingCountry.querySelector(`option[value="${result.countryCode}"]`)) {
                                    selectShippingCountry.value = result.countryCode;
                                    selectBillingCountry.value = result.countryCode;
                                    this.bindStates(result.countryCode);
                                }
                                else {
                                    this.bindStates('');
                                }
                                clearInterval(timer);
                            }
                        }
                        else {
                            clearInterval(timer);
                        }

                        count++;
                    }, 500);
                }
            }
        });
    }
    bindCountries(countries) {
        const ddlCountryElems = document.querySelectorAll('.ddl-country');
        for (let selectCountry of ddlCountryElems) {
            selectCountry.setAttribute('required', '');
            let options = '<option value="">---</option>';
            Array.prototype.slice.call(countries).forEach(country => {
                options += `<option value="${country.countryCode}">${country.countryName}</option>`
            });
            selectCountry.innerHTML = options;
        }
    }
    getCountries() {
        this.ecommjs.Campaign.getCountries(null, (err, countries) => {
            if(err != null) {
                console.log(err);
                return;
            }

            this.bindCountries(countries);
        });
    }
    // End bind countries for both shipping and billing

    // Event Functions
    openCvvPopup() {
        const cvvIcon = document.getElementById('card-cvv-icon');
        if(!cvvIcon) return;

        cvvIcon.addEventListener('click', function (e) {
            e.preventDefault();
            const cvvpopup = document.getElementById('cvv-popup');
            if(cvvpopup) {
                cvvpopup.classList.add('open');
                document.querySelector('body').style.overflow = 'hidden';
            }
        });
    }
    hideCvvPopup() {
        const cvvpopup = document.getElementById('cvv-popup');
        if(cvvpopup) {
            cvvpopup.addEventListener('click', e => {
                document.querySelector('body').style.overflow = 'inherit';
                if(e.target.closest('.modal-content')) return;
                cvvpopup.classList.remove('open');
            });

            cvvpopup.querySelector('.icon-close').addEventListener('click', e => {
                document.querySelector('body').style.overflow = 'inherit';
                e.preventDefault();
                cvvpopup.classList.remove('open');
            });
        }
    }
    onChangeMonth() {
        document.getElementById('monthddl').addEventListener('change', () => {
            const currentMonth = new Date().getMonth() + 1,
                currentYear = new Date().getFullYear(),
                monthSelected = Number(document.getElementById('monthddl').value),
                yearSelected = Number(document.getElementById('yearddl').value);

            if(monthSelected < currentMonth && currentYear === yearSelected) {
                document.getElementById('yearddl').value = yearSelected + 1;
            }
            this.setExpirationValue();
        }, false);
    }
    onChangeYear() {
        document.getElementById('yearddl').addEventListener('change', () => {
            this.implementMonthDropdown();
            this.setExpirationValue();
        }, false);
    }
    // End Event Functions

    // Place Order
    async fetchUrlsParallel(items) {
      const results = await Promise.all(
        items.map((item) => {
            const options = {
                body: {
                    productId: item.productId,
                    price: item.discountedPrice,
                    quantity: item.quantity,
                    shippingMethodId: item.shippingMethodId
                }
            };
            return Utils.postAjax(`shoppingcart/${siteSetting.WEBKEY}/add?sessionId=${this.cart.sessionId}`, options);
        })
      );
      return results;
    }
    placeOrder(type) {
        switch(type) {
            case 'cc':
                const creditCardPayment = new CreditCardPayment();
                creditCardPayment.placeOrder();
                break;
            case 'pp':
                const paypalPayment = new PaypalPayment();
                paypalPayment.placeOrder();
                break;
        }
    }
    updateLocalCartAfterAppliedCoupon(response) {
        let localProduct;
        for (let product of response.products) {
            localProduct = Utils.getObjectFromArray('productId', product.productId, this.cart.items);
            if (localProduct) {
                localProduct.appliedCouponPrice = product.price;
            }
        }

        localStorage.setItem(constants.CART, JSON.stringify(this.cart));
    }
    async submitAllRestProducts(type) {
        // this.cart.couponCode = 'IKEN2019'; // TEST
        if(!!this.cart.items && this.cart.items.length > 1) {
            const restItems = this.cart.items.slice(1);
            this.fetchUrlsParallel(restItems)
            .then(async(results) => {
                const data = results[0];
                try {
                    // Current not use
                    if(!!this.cart.couponCode) {
                        const postCouponCode = await Utils.postAjax(`shoppingcart/${siteSetting.WEBKEY}/applycoupon?sessionId=${this.cart.sessionId}&couponCode=${this.cart.couponCode}`);
                        this.updateLocalCartAfterAppliedCoupon(postCouponCode);
                    }
                }
                catch(e) {
                    console.log(e);
                }
                this.placeOrder(type);
            })
            .catch(err => {
                console.log(err);
            });
        }
        else {
            try {
                // Current not use
                if(!!this.cart.couponCode) {
                    const postCouponCode = await Utils.postAjax(`shoppingcart/${siteSetting.WEBKEY}/applycoupon?sessionId=${this.cart.sessionId}&couponCode=${this.cart.couponCode}`);
                    this.updateLocalCartAfterAppliedCoupon(postCouponCode);
                }
            }
            catch(e) {
                console.log(e);
            }
            this.placeOrder(type);
        }
    }
    submitFirstProduct(type) {
        this.cart = Utils.getCart();
        if(!!this.cart.items && this.cart.items.length > 0) {
            Utils.showAjaxPageLoading(true);
            const postData = {
                productId: this.cart.items[0].productId,
                price: this.cart.items[0].discountedPrice,
                quantity: this.cart.items[0].quantity,
                shippingMethodId: this.cart.items[0].shippingMethodId
            };

            this.ecommjs.Cart.initCart(postData, (err, sessionId) => {
                if(err != null) {
                    console.log(err);
                    return;
                }

                if(sessionId) {
                    this.cart.sessionId = sessionId;
                    localStorage.setItem(constants.CART, JSON.stringify(this.cart));
                    // Submit All Rest products
                    this.submitAllRestProducts(type);
                }
            });
        }
    }
    notChooseProduct() {
        if(!!document.querySelector('.prl-error')) {
            document.querySelector('.prl-error').classList.remove('hidden');
            document.querySelector('.product-list-wrap').scrollIntoView({behavior: 'smooth'});
        }
    }
    checkValidSelectedProducts() {
        let isValid = true;
        this.cart = Utils.getCart();
        if(!!this.cart) {
            switch(this.cart.items.length) {
                case 0:
                    this.notChooseProduct();
                    isValid = false;
                    break;
                case 1:
                    const isGiftItem = !!document.getElementById('product_' + this.cart.items[0].productId).closest('.productItem').classList.contains('gift-item');
                    if(isGiftItem) {
                        this.notChooseProduct();
                        isValid = false;
                    }
                    break;
            }
        }
        else {
            this.notChooseProduct();
            isValid = false;
        }
        return isValid;
    }
    // End Place Order

    // Bind Events
    bindEvents() {
        this.openCvvPopup();
        this.hideCvvPopup();
        this.onChangeMonth();
        this.onChangeYear();

        //checkout by credit card
        document.getElementById('btn-submit-cc').addEventListener('click', e => {
            e.preventDefault();
            if(this.checkValidSelectedProducts() && this.checkoutValidation.isValid()) {
                this.submitFirstProduct('cc');
            }
        });

        //checkout by paypal
        document.getElementById('btn-submit-paypal').addEventListener('click', e => {
            e.preventDefault();
            if(this.checkValidSelectedProducts()) {
                this.submitFirstProduct('pp');
            }
        });

        //show or hide billing
        const chkSameAsShipping = document.getElementById('same-as-shipping');
        if(chkSameAsShipping) {
            chkSameAsShipping.addEventListener('change', e => {
                const frmBilling = document.getElementById('frmBilling');
                if(frmBilling) {
                    if(chkSameAsShipping.checked) {
                        frmBilling.classList.add('hidden');
                    }
                    else {
                        frmBilling.classList.remove('hidden');
                    }
                }
            });
        }

        //bind states when shipping country select
        const shippingSelectCountry = document.getElementById('shipping_country'),
            shippingSelectState = document.getElementById('shipping_state');
        if(shippingSelectCountry && shippingSelectState) {
            shippingSelectCountry.addEventListener('change', () => {
                this.bindStates(shippingSelectCountry.value, shippingSelectState);
            });
        }

        //bind states when billing country select
        const billingSelectCountry = document.getElementById('billing_country'),
            billingSelectState = document.getElementById('billing_state');
        if(billingSelectCountry && billingSelectState) {
            billingSelectCountry.addEventListener('change', () => {
                this.bindStates(billingSelectCountry.value, billingSelectState);
            });
        }
    }

    // Init
    init() {
        this.getLocation();
        this.getCountries();
        this.implementYearDropdown();
        this.implementMonthDropdown();
        this.setExpirationValue();
        document.addEventListener('DOMContentLoaded', () => {
            this.bindEvents();
        });
    }
}

const checkout = new Checkout();
checkout.init();
