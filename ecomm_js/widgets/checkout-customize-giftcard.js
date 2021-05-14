import { constants } from '../common/constant.js';
import Utils from '../common/utils.js';
import CreditCardPayment from '../common/creditcard_payment.js';
import PaypalPayment from '../common/paypal_payment.js';
import CheckoutValidate from '../common/checkoutValidation.js';

class Checkout {
    constructor() {
        this.cart = Utils.getCart();
        this.formatedPrice = '$0.00';
        if (this.cart && this.cart.length > 0) {
            this.formatedPrice = this.cart.items[0].formattedPrice;
        }
        //new CheckoutValidate().initValidation();
        //init validation
        this.checkoutValidation = new CheckoutValidate();
        this.checkoutValidation.initValidation();
        this.ecommjs = new EcommJS({
            webkey: siteSetting.WEBKEY,
            cid: siteSetting.CID
        });
    }

    bindEvents() {
        //checkout by credit card
        document.getElementById('btn-submit-cc').addEventListener('click', e => {
            e.preventDefault();
            document.querySelector('.w-customer-form').scrollIntoView({behavior: 'smooth'});
            if (this.checkoutValidation.isValid()) {
                const creditCardPayment = new CreditCardPayment();
                creditCardPayment.placeOrder();
            }
        });

        //checkout by paypal
        const btnPaypal = document.getElementById('btn-submit-paypal');
        if (btnPaypal) {
            btnPaypal.addEventListener('click', e => {
                e.preventDefault();
                const paypalPayment = new PaypalPayment();
                paypalPayment.placeOrder();
            });
        }

        //show or hide billing
        const chkSameAsShipping = document.getElementById('same-as-shipping');
        if (chkSameAsShipping) {
            chkSameAsShipping.addEventListener('change', e => {
                const frmBilling = document.getElementById('frmBilling');
                if (frmBilling) {
                    if (chkSameAsShipping.checked) {
                        frmBilling.classList.add('hidden');
                    } else {
                        frmBilling.classList.remove('hidden');
                    }
                }
            });
        }

        //bind states when shipping country select
        const shippingSelectCountry = document.getElementById('shipping_country');
        const shippingSelectState = document.getElementById('shipping_state');
        if (shippingSelectCountry && shippingSelectState) {
            shippingSelectCountry.addEventListener('change', () => {
                this.bindStates(shippingSelectCountry.value, shippingSelectState);
            });
        }
        //bind states when billing country select
        const billingSelectCountry = document.getElementById('billing_country');
        const billingSelectState = document.getElementById('billing_state');
        if (billingSelectCountry && billingSelectState) {
            billingSelectCountry.addEventListener('change', () => {
                this.bindStates(billingSelectCountry.value, billingSelectState);
            });
        }

        //apply coupon
        this.applyCoupon();

        //show/hide cvv popup
        this.openCvvPopup();
        this.hideCvvPopup();
    }

    bindProductList(products) {
        if (!this.cart || !this.cart.items || this.cart.items.length < 1) return;

        const productListUl = document.getElementById('checkout-products');
        if (!productListUl) return;

        const itemTmp = productListUl.innerHTML;
        let productItem, priceType = 'discountedPrice', listItems = '';
        if (this.cart.couponCode && this.cart.couponCode !== '') {
            priceType = 'appliedCouponPrice';
        }

        for (let item of this.cart.items) {
            productItem = itemTmp.replace('{productImageUrl}', item.productImageUrl)
                                .replace(/{productName}/g, item.productName)
                                .replace(/{productID}/g, item.productId)
                                .replace('{productPrice}', Utils.formatPrice(item[priceType], this.formatedPrice))
                                .replace('{productQuantity}', item.quantity);

            listItems += productItem;
        }
        productListUl.innerHTML = listItems;
    }

    getDiscountPriceByGiftCard() {
        const originTotalPrice = Number(Utils.getTotalPrice(this.cart.items, 'discountedPrice'));
        let canDiscountedPrice = originTotalPrice;
        let totalResumPrice = 0;
        if (window.GiftCardBalance >= originTotalPrice) {
            canDiscountedPrice = originTotalPrice;
            window.PaymentProcessorId = 62;
        }
        else {
            canDiscountedPrice = window.GiftCardBalance;
            totalResumPrice = originTotalPrice - canDiscountedPrice;
        }
        return {
            canDiscountedPrice: '-' + Utils.formatPrice(canDiscountedPrice, this.formatedPrice),
            totalResumPrice: Utils.formatPrice(totalResumPrice, this.formatedPrice)
        }
    }

    bindTotalPrice() {
        const originTotalPrice = Utils.getTotalPrice(this.cart.items, 'discountedPrice');
        const totalPriceElem = document.getElementById('total-price');

        if (this.cart.couponCode && this.cart.couponCode !== '') {
            const discountedTotalPrice = Utils.getTotalPrice(this.cart.items, 'appliedCouponPrice'); //applied coupon code
            const discountedPrice = originTotalPrice - discountedTotalPrice;
            if (totalPriceElem) {
                totalPriceElem.innerText = Utils.formatPrice(discountedTotalPrice, this.formatedPrice);
            }

            const discountedAppliedElem = document.querySelector('.discounted-applied');
            if (discountedAppliedElem) {
                discountedAppliedElem.innerHTML = '-' + Utils.formatPrice(discountedPrice, this.formatedPrice);
                discountedAppliedElem.parentNode.classList.remove('hidden');
            }
        }
        else if (window.GiftCardNumber) {
            document.querySelector('.giftcard-applied').textContent = this.getDiscountPriceByGiftCard().canDiscountedPrice;
            if (totalPriceElem) {
                totalPriceElem.textContent = this.getDiscountPriceByGiftCard().totalResumPrice;
            }
            document.querySelector('.row-item.giftcard').classList.remove('hidden');
        }
        else {
            if (totalPriceElem) {
                totalPriceElem.innerText = Utils.formatPrice(originTotalPrice, this.formatedPrice);
            }
        }
    }

    getGiftCardInfo(giftCardValue) {
        // A11B-YE1692Z-5D8A // 60
        // A11B-4I477ZO-I2Y1 // 30
        // A11B-7BM155K-ST34 // 20
        const url = `https://sales-api.tryemanagecrm.com/api/giftcards/balance/${giftCardValue}`;
        const options = {
            method: 'GET',
            headers: {
                X_CID: siteSetting.CID,
                'Content-Type': 'application/json',
                Authorization: 'iam-basic 6031F686-6C8F-42B2-B594-05340F2E6B37'
            }
        }

        Utils.callAjax(url, options).then((result) => {
            window.CanPayShipping = result.canPayShipping
            window.GiftCardBalance = result.balance;
            window.GiftCardNumber = giftCardValue;
            document.querySelector('.giftcard-box .success-message-giftcard').classList.remove('hidden');
            this.bindTotalPrice();
        }).catch(error => console.log(error));
    }

    bindGiftCard() {
        const giftCardBox = document.querySelector('.giftcard-box');
        const giftCardTxt = giftCardBox.querySelector('#giftcardTxt');
        const errorGiftCardElm = giftCardBox.querySelector('.error-message-giftcard');
        const successGiftCardElm = giftCardBox.querySelector('.success-message-giftcard');

        giftCardTxt.addEventListener('keyup', () => {
            errorGiftCardElm.classList.add('hidden');
            successGiftCardElm.classList.add('hidden');
        });

        giftCardBox.querySelector('button').addEventListener('click', () => {
            const giftCardValue = giftCardTxt.value;
            if (giftCardValue && giftCardValue.trim() !== '') {
                this.getGiftCardInfo(giftCardValue);
            }
            else {
                errorGiftCardElm.classList.remove('hidden');
            }
        });
    }

    getLocation() {
        let count = 1;
        this.ecommjs.Campaign.getLocation((err, result) => {
            if (err != null) {
                console.log(err);
                return;
            }

            if (result) {
                //select default country
                const selectShippingCountry = document.getElementById('shipping_country');
                const selectBillingCountry = document.getElementById('billing_country');

                if (selectShippingCountry) {
                    const timer = setInterval(() => {
                        if (count <= 15) {
                            if (selectShippingCountry.options.length > 0) {
                                if (selectShippingCountry.querySelector(`option[value="${result.countryCode}"]`)) {
                                    selectShippingCountry.value = result.countryCode;
                                    selectBillingCountry.value = result.countryCode;
                                    this.bindStates(result.countryCode);
                                } else {
                                    this.bindStates('');
                                }
                                clearInterval(timer);
                            }
                        } else {
                            clearInterval(timer);
                        }

                        count++;
                    }, 500);
                }
            }
        });
    }

    getCountries() {
        this.ecommjs.Campaign.getCountries(null, (err, countries) => {
            if (err != null) {
                console.log(err);
                return;
            }

            this.bindCountries(countries);
        });
    }

    //bind countries for both shipping and billing
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

    applyCoupon() {
        const btnCoupon = document.getElementById('btn-apply-coupon');
        if (btnCoupon) {
            btnCoupon.addEventListener('click', e => {
                e.preventDefault();
                const couponCode = document.getElementById('coupon-code');
                if (couponCode && couponCode.value.trim() !== '') {
                    //display error message
                    couponCode.classList.remove('input-error');
                    const errMsg = couponCode.parentNode.parentNode.querySelector('.error-message');
                    if (errMsg) {
                        errMsg.classList.add('hidden');
                    }

                    //call ajax
                    Utils.showAjaxPageLoading(true);
                    this.ecommjs.Checkout.applyCoupon(this.cart.sessionId, couponCode.value, (err, result) => {
                        if (err != null) {
                            if (errMsg) {
                                errMsg.innerText = 'You can only use one coupon at a time.';
                                errMsg.classList.remove('hidden');
                            }
                            Utils.hideAjaxPageLoading();
                            console.log(err);
                            return;
                        }

                        if (result) {
                            //update local cart
                            this.updateLocalCartAfterAppliedCoupon(result);
                            //update total price
                            this.bindTotalPrice();
                            //update product list
                            this.bindProductList();
                        }
                        Utils.hideAjaxPageLoading();
                    });
                } else {
                    couponCode.classList.add('input-error');
                    const errMsg = couponCode.parentNode.parentNode.querySelector('.error-message');
                    if (errMsg) {
                        errMsg.innerText = 'Please enter valid code.';
                        errMsg.classList.remove('hidden');
                    }
                }
            })
        }
    }

    //update local cart after applied coupon
    updateLocalCartAfterAppliedCoupon(response) {
        let localProduct;
        for (let product of response.products) {
            localProduct = Utils.getObjectFromArray('productId', product.productId, this.cart.items);
            if (localProduct) {
                localProduct.appliedCouponPrice = product.price;
            }
        }

        this.cart.couponCode = response.couponCode;
        localStorage.setItem(constants.CART, JSON.stringify(this.cart));
    }

    async bindStates(countryCode, select = null) {
        let ddlStateElems;
        if (select) {
            ddlStateElems = [select];
        } else {
            ddlStateElems = document.querySelectorAll('.ddl-state');
        }

        //disable select box when binding
        for (let select of ddlStateElems) {
            select.setAttribute('disabled', 'disabled');
        }

        if (countryCode !== '') {
            this.ecommjs.Campaign.getStatesByCountryCode(countryCode, (err, result) => {
                if (err != null) {
                    for (let select of ddlStateElems) {
                        let options = '<option value="">---</option>';
                        select.innerHTML = options;
                        select.removeAttribute('disabled');
                        select.removeAttribute('required');
                    }
                    console.log('Error: can not fetch states: ', err);
                    return;
                }

                if (result) {
                    const states = Array.prototype.slice.call(result);
                    for (let select of ddlStateElems) {
                        select.setAttribute('required', '');
                        let options = '<option value="">---</option>';

                        if (states instanceof Error || typeof states === 'undefined') {
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

    openCvvPopup() {
        const cvvIcon = document.getElementById('card-cvv-icon');
        if (!cvvIcon) return;

        cvvIcon.addEventListener('click', function (e) {
            e.preventDefault();
            const cvvpopup = document.getElementById('cvv-popup');
            if (cvvpopup) {
                cvvpopup.classList.add('open');
                document.querySelector('body').style.overflow = 'hidden';
            }
        });
    }

    hideCvvPopup() {
        const cvvpopup = document.getElementById('cvv-popup');
        if (cvvpopup) {
            cvvpopup.addEventListener('click', e => {
                document.querySelector('body').style.overflow = 'inherit';
                if (e.target.closest('.modal-content')) return;
                cvvpopup.classList.remove('open');
            });

            cvvpopup.querySelector('.icon-close').addEventListener('click', e => {
                document.querySelector('body').style.overflow = 'inherit';
                e.preventDefault();
                cvvpopup.classList.remove('open');
            });
        }
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

    init() {
        if (!this.cart || this.cart.items.length < 1) {
            Utils.redirectPage('cart.html');
        }
        this.bindProductList();
        this.bindTotalPrice();
        this.bindGiftCard();
        this.getLocation();
        this.getCountries();
        this.implementYearDropdown();
        this.implementMonthDropdown();
        this.setExpirationValue();
        this.onChangeMonth();
        this.onChangeYear();
        document.addEventListener('DOMContentLoaded', () => {
            this.bindEvents();
        });
    }
}

const checkout = new Checkout();
checkout.init();
