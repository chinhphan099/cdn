import { constants } from '../common/constant.js';
import Utils from '../common/utils.js';

export default class OrderSt {
    constructor() {
        this.isClickedInput = false;
        this.isClickedYesButton = false;
        this.isPopupShowing = false;
        this.time_in_minutes = window.time_in_minutes ? Number(window.time_in_minutes) : 5
    }

    generateEvents() {
        const event = {};
        this.events = {
            on: function(eventName, fn) {
                event[eventName] = event[eventName] || [];
                event[eventName].push(fn);
            },
            off: function(eventName, fn) {
                if (event[eventName]) {
                    for (let i = 0; i < event[eventName].length; i++) {
                        if (event[eventName][i] === fn) {
                            event[eventName].splice(i, 1);
                            break;
                        }
                    }
                }
            },
            emit: function(eventName, data) {
                let count = 0;
                const timer = setInterval(() => {
                    count++;
                    if (count >= 50) { //20 * 200 = 10 seconds
                        clearInterval(timer);
                    }

                    if (event[eventName]) {
                        clearInterval(timer);
                        Array.prototype.slice.call(event[eventName]).forEach(function (fn) {
                            fn(data);
                        });
                    }
                }, 200);
            }
        };
    }
    sliceArray() {
        return Function.prototype.call.apply(Array.prototype.slice, arguments);
    }
    clearCart() {
        localStorage.removeItem(constants.CART);
        localStorage.removeItem(constants.CHECKOUT_SUCCESS);
    }

    // Event Functions
    faqEvent() {
        if(!document.querySelector('.faq')) {
            return;
        }
        document.querySelector('.faq .text span').addEventListener('click', () => {
            if(document.querySelector('.faq .w_outer').classList.contains('visible')) {
                document.querySelector('.faq .w_outer').classList.remove('visible');
            }
            else {
                document.querySelector('.faq .w_outer').classList.add('visible');
                document.querySelector('.faq').scrollIntoView({behavior: 'smooth'});
            }
        });
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
    continueButtonEvent() {
        if(!document.querySelector('.btn-continue')) {
            return;
        }
        document.querySelector('.btn-continue').addEventListener('click', (e) => {
            if(this.checkValidSelectedProducts()) {
                e.currentTarget.classList.add('hidden');
                const checkoutFrm = document.querySelector('.checkout-form');
                checkoutFrm.classList.remove('hidden');
                checkoutFrm.scrollIntoView({behavior: 'smooth'});
            }
        });
    }
    customTabEvents() {
        const customTabItems = document.querySelectorAll('.custom-list-group li');
        this.sliceArray(customTabItems).forEach((customTabItem, index) => {
            customTabItem.addEventListener('click', (e) => {
                for(let elm of customTabItems) {
                    elm.classList.remove('active');
                }
                e.currentTarget.classList.add('active');
                document.querySelectorAll('.js-list-group li')[index].click();
            });
        });
    }
    // Event Functions

    // Exitpopup
    openExitPopup() {
        if (!document.querySelector('.widget_modal') || !!this.isPopupShowing) {
            return;
        }
        document.querySelector('.widget_modal').style.display = 'block';
        this.isPopupShowing = true;
    }
    hideExitPopup(isOver) {
        this.isPopupShowing = false;
        if(!!document.querySelector('.widget_modal')) {
            document.querySelector('.widget_modal').style.display = 'none';
        }
        clearInterval(this.timeinterval);
        if(!!isOver) {
            clearTimeout(this.mobileTimer);
            clearTimeout(this.timedPopup);
            document.removeEventListener('mouseout', this.mouseOut);
            window.removeEventListener('touchmove', this.touchMove);
        }
    }
    handleMouseOut(e) {
        if(!!this.isPopupShowing) {
            return;
        }
        if ((e.pageY - window.pageYOffset) <= 0) {
            document.removeEventListener('mouseout', this.mouseOut);
            this.openExitPopup();
        }
    }
    handleTouchMove() {
        if(!!this.isPopupShowing) {
            return;
        }
        const mbTimer = !!window.pendingTimeOnMobile ? Number(window.pendingTimeOnMobile) * 1000 : 5000;
        window.removeEventListener('touchmove', this.touchMove);
        this.mobileTimer = setTimeout(this.openExitPopup, mbTimer);
    }
    closeExitPopupEvent() {
        const closePopupElms = document.querySelectorAll('.close-exitpopup');
        this.sliceArray(closePopupElms).forEach(closePopupElm => {
            closePopupElm.addEventListener('click', () => {
                this.hideExitPopup(this.isClickedYestButton);
                if(!this.isClickedYestButton) {
                    this.isClickedYestButton = true;
                }
            }, false);
        });
    }
    handleExitPopupEvents() {
        if(Utils.getQueryParameter('iep') !== 'true' || !document.querySelector('.widget_modal') || Utils.getQueryParameter('et') === '1') {
            return;
        }
        if (Utils.isDevice()) {
            this.touchMove = this.handleTouchMove.bind(this);
            window.addEventListener('touchmove', this.touchMove);
        }
        else {
            this.mouseOut = this.handleMouseOut.bind(this);
            document.addEventListener('mouseout', this.mouseOut);
        }

        if(!!document.querySelector('.close-exitpopup')) {
            this.closeExitPopupEvent();
        }
    }
    // End Exitpopup

    onClickInputSelect() {
        const inputs = document.querySelectorAll('input');
        let checkQT = false;
        for (let input of inputs) {
            input.addEventListener('change', (e) => {
                if(!!Utils.getQueryParameter('qt') && !checkQT) {
                    checkQT = true;
                    return;
                }
                this.isClickedInput = true;
                this.hideExitPopup(true);
            }, false);
        }

        const selects = document.querySelectorAll('select');
        for (let select of selects) {
            select.addEventListener('click', () => {
                this.isClickedInput = true;
                this.hideExitPopup(true);
            });
        }
    }

    bindEvents() {
        this.faqEvent();
        this.continueButtonEvent();
        this.customTabEvents();
    }

    init() {
        this.clearCart();
        this.generateEvents();
        this.onClickInputSelect();
        this.handleExitPopupEvents();
        this.events.on('bindOrderPage', (data) => {
            // this.loadStatistical(data);
        });

        document.addEventListener('DOMContentLoaded', () => {
            this.bindEvents();
        });
    }
}
