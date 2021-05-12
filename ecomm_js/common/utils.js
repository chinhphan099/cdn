//using es6-promise and isomorphic-fetch just for build tool
try {
    require('es6-promise').polyfill();
    require('isomorphic-fetch');
} catch(err) {
    //console.log(err);
}

import { constants } from '../common/constant.js';
import CustomPolyfill from '../common/custom_polyfill.js';

//init custom polyfill
const customPolyfill = new CustomPolyfill();
customPolyfill.init();

export default class Utils {
    static async getAjax(url) {
        const options = {
            headers: {
                'X_CID': siteSetting.CID
            }
        };

        try {
            const res = await fetch(`${constants.GET_BASE_ENDPOINT}/${url}`, options);
            if (res.ok) {
                try {
                    const jsonData = await res.json();
                    return jsonData;
                } catch (err) {
                    return Promise.resolve('Post ajax successfully');
                }
            } else {
                return Promise.reject(`Error code : ${res.status} - ${res.statusText}`);
            }
        } catch (err) {
            return Promise.reject(err);
        }
    }

    static async postAjax(url, opts = {}) {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X_CID': siteSetting.CID
            }
        };

        if (opts.method) {
            options.method = opts.method;
        }

        if (opts.body) {
            options.body = JSON.stringify(opts.body);
        }

        try {
            const res = await fetch(`${constants.POST_OR_PUT_BASE_ENDPOINT}/${url}`, options);
            if (res.ok) {
                try {
                    const jsonData = await res.json();
                    return jsonData;
                } catch (err) {
                    return Promise.resolve('Post ajax successfully');
                }
            } else {
                return Promise.reject(`Error code : ${res.status} - ${res.statusText}`);
            }
        } catch (err) {
            return Promise.reject(err);
        }
    }

    static async callAjax(url, opts = {}) {
        try {
            const res = await fetch(url, opts);
            if(res.ok) {
                try {
                    const jsonData = await res.json();
                    return jsonData;
                } catch(err) {
                    return Promise.resolve('Parse JSON fail');
                }
            }
        } catch(err) {
            return Promise.reject(err);
        }
    }

    /**
     * Get value of url query string by parameter
     * @param {string} param - url parameter
     */
    static getQueryParameter(param) {
        let href = '';
        if (location.href.indexOf('?')) {
            href = location.href.substr(location.href.indexOf('?'));
        }

        const value = href.match(new RegExp("[\?\&]" + param + "=([^\&]*)(\&?)", "i"));
        return value ? value[1] : null;
    }

    static convertHref() {
        const links = document.querySelectorAll('a');
        for (let link of links) {
            if (link.classList.contains('no-tracking')) continue;
            let href = link.getAttribute('href');
            if (href && href.trim() !== '' && href.indexOf('javascript') < 0) {
                const currentQueryString = location.href.split('?').length > 1 ? location.href.split('?')[1] : '';
                if (href.indexOf("?") > 0) {
                    href += (currentQueryString !== '' ? '&' + currentQueryString : '');
                } else {
                    href += (currentQueryString !== '' ? '?' + currentQueryString : '');
                }
                link.href = href;
            }
        }
    }

    /**
     * This method is used to redirect to specific page with keep all parameters of current page
     * @param {string} page - url will be redirected to
     * @param {string} target - example : _blank, _self, ...
     */
    static redirectPage(page, target) {
        const currentQueryString = location.search.length > 0 ? location.search.substr(1) : "";
        //const pageQueryString = (page.indexOf("?") > 0) ? page.substr(page.indexOf("?") + 1) : "";

        if (page.indexOf("?") > 0) {
            page += (currentQueryString !== '' ? '&' + currentQueryString : '');
        } else {
            page += (currentQueryString !== '' ? '?' + currentQueryString : '');
        }

        if (typeof target !== 'undefined' && target == "_blank") {
            window.open(page);
        } else {
            location.href = page;
        }
        return false;
    }

    static getObjectFromArray(key, value, arr) {
        let obj = arr.filter(o => o[key] == value)[0];
        return obj;
    }

    static addToLocalCart(item, sessionId = '') {
        const localCart = localStorage.getItem(constants.CART);
        if (localCart) {
            const cartJSON = JSON.parse(localCart);
            cartJSON.items.push(item);
            localStorage.setItem(constants.CART, JSON.stringify(cartJSON));
        } else {
            localStorage.setItem(constants.CART, JSON.stringify({
                sessionId: sessionId,
                items: [item]
            }));
        }
    }

    static loadLazyImages() {
        new Blazy({
            selector: 'img:not(.no-lazy)', // all images
            loadInvisible: true,
            offset: 1000,
            breakpoints: [{
                width: 767, // max-width
                src: 'data-src-small'
            }//,
            // {
            //     width: 991, // max-width
            //     src: 'data-src-medium'
            // }
            ],
            error: function (ele, msg) {
                console.log('lazy load image error: ', ele)
            },
            success: function (ele) {
                //console.log('success: ', ele);
            }
        });
    }

    static validateInput(input) {
        if (input.attributes['required'] != undefined && input.value.trim() === '') {
            Utils.addInputError(input);
        } else if (input.attributes['email'] != undefined) { //validate email
            if (Utils.isEmail(input.value)) {
                Utils.removeInputError(input);
            } else {
                Utils.addInputError(input);
            }
        } else if ((input.id.indexOf('_postal') > 0 || input.id.indexOf('_cep') > 0) && typeof input.pattern !== 'undefined') {
            if (new RegExp(input.pattern.toLowerCase()).test(input.value.toLowerCase())) {
                Utils.removeInputError(input);
            } else {
                Utils.addInputError(input);
            }
        } else {
            Utils.removeInputError(input);
        }
    }

    static isEmail(str) {
        if (str.trim().length === 0) return false;
        const filter = /^([\w-\.\+]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,8}|[0-9]{1,3})(\]?)$/;
        if (filter.test(str)) {
            return true;
        } else {
            return false;
        }
    }

    static addInputError(input) {
        input.classList.add('input-error');
        if (input.closest('.form-group').querySelector('.error-message')) {
            input.closest('.form-group').querySelector('.error-message').classList.remove("hidden");
        }
    }

    static removeInputError(input) {
        input.classList.remove('input-error');
        if (input.closest('.form-group').querySelector('.error-message')) {
            input.closest('.form-group').querySelector('.error-message').classList.add("hidden");
        }
    }

    static formatString(str, format) {
        let value = '';
        switch (format) {
            case '0000-0000-0000-0000':
                var vls = [];
                for (let i = 0; i < str.length; i += 4) {
                    if (vls.length < 4) {
                        vls.push(str.substring(i, i + 4));
                    }
                }
                value = vls.join('-');
                break;
            case '0000-0000-0000-0000-000':
                var vls = [];
                for (var i = 0; i < str.length; i += 4) {
                    if (vls.length == 4) {
                        vls.push(str.substring(i, i + 3));
                    } else {
                        vls.push(str.substring(i, i + 4));
                    }
                }
                value = vls.join('-');
                break;
            case '0000':
                value = (str.length > 4) ? str.substring(0, 4) : str;
                break;
            case '00/00':
                var vls = []
                for (let i = 0; i < str.length; i += 2) {
                    if (vls.length < 2) {
                        vls.push(str.substring(i, i + 2));
                    }
                }

                value = vls.join('/');
                break;
            case '0000-****-****-0000':
                var vls = [];
                for (let i = 0; i < str.length; i += 4) {
                    if (vls.length < 4) {
                        if (vls.length > 0 && vls.length < 3) {
                            vls.push("****");
                        } else {
                            vls.push(str.substring(i, i + 4));
                        }
                    }
                }
                value = vls.join('-');
                break;
            case '00000-000':
                var vls = [];
                for (let i = 0; i < str.length; i += 5) {
                    if (vls.length < 5) {
                        vls.push(str.substring(i, i + 5));
                    }
                }
                value = vls.join('-');
                break;
            default:
                value = str;
                break;
        }
        return value;
    }

    static maskNumber(input, formatString) {
        input.addEventListener('keypress', e => {
            const code = e.which || e.keyCode;
            let value = '';
            if ((code > 47 && code < 58) //number
                || code == 8 || code == 46 //del
                || (code > 36 && code < 41) //forword
                || (code > 15 && code < 19) //shift ctrl atl
                || code == 9 || code == 13 //tab enter
            ) {
                value = input.value.toString().replace(/\-/g, '').replace(/\//g, '').substring(0, formatString.length);
            } else {
                e.preventDefault();
                return;
            }

            input.value = Utils.formatString(value, formatString);
            if (value.length >= formatString.length) e.preventDefault();
        });
    }

    static getCart() {
        return localStorage.getItem(constants.CART) ? JSON.parse(localStorage.getItem(constants.CART)) : null;
    }

    static getCheckoutSuccessInfo() {
        return localStorage.getItem(constants.CHECKOUT_SUCCESS) ? JSON.parse(localStorage.getItem(constants.CHECKOUT_SUCCESS)) : null;
    }

    static bindCartIconOnHeader() {
        const iconCount = document.querySelectorAll('.menu-cart-count');
        if (!iconCount) return;

        const cart = Utils.getCart();
        if (cart) {
            let count = 0;
            for (let item of cart.items) {
                count += parseInt(item.quantity);
            }

            for (let item of iconCount) {
                if(count > 0) {
                    item.innerText = count;
                    item.style.display = 'inline-block';
                } else {
                    item.innerText = '';
                    item.style.display = 'none';
                }
            }
        }
    }

    static closeMiniCart() {
        const btnCloseMenuCart = document.getElementById('close-mini-cart');
        const overLay = document.querySelector('.overlay');
        if (btnCloseMenuCart && overLay) {
            [btnCloseMenuCart, overLay].forEach(elem => {
                elem.addEventListener('click', e => {
                    e.preventDefault();
                    document.querySelector('body').classList.remove('open-mini-cart');
                });
            });
        }
    }

    static updateItemInCart(sessionId, productId, quantity, cb) {
        const options = {
            method: 'PUT'
        };

        const cart = Utils.getCart();
        const product = Utils.getObjectFromArray('productId', productId, cart.items);
        if(product) {
            product.quantity = Number(product.quantity) + Number(quantity);
            Utils.postAjax(`shoppingcart/${siteSetting.WEBKEY}/update?sessionId=${sessionId}&productId=${productId}&quantity=${product.quantity}`, options).then(() => {
                localStorage.setItem('cart', JSON.stringify(cart));
                Utils.bindCartIconOnHeader();
                console.log('Update item in cart successfully!');

                //open mini cart
                if (typeof cb === 'function') {
                    cb();
                }
            });
        }
    }

    static showAjaxPageLoading(isNotPage = false) {
        let ajaxPageLoadingDiv = document.getElementById('ajax-page-loading-wrapper');
        if (ajaxPageLoadingDiv) {
            ajaxPageLoadingDiv.classList.remove('hidden');
        } else {
            let opacity = '1';
            let text = `<span>
                            Please wait while your
                            <br>
                            order is being processed.
                        </span>`;
            if (isNotPage) {
                opacity = '0.8';
                text = '';
            }

            ajaxPageLoadingDiv = document.createElement('div');
            ajaxPageLoadingDiv.classList.add('ajax-page-loading-wrapper')
            ajaxPageLoadingDiv.style.opacity = opacity;
            ajaxPageLoadingDiv.id = 'ajax-page-loading-wrapper';
            ajaxPageLoadingDiv.innerHTML = `<img src="//d16hdrba6dusey.cloudfront.net/sitecommon/images/loading_success.gif" alt="ajax page loading">${text}`;
            document.querySelector('body').appendChild(ajaxPageLoadingDiv);
        }
    }

    static hideAjaxPageLoading() {
        const ajaxPageLoadingDiv = document.getElementById('ajax-page-loading-wrapper');
        if (ajaxPageLoadingDiv) {
            ajaxPageLoadingDiv.classList.add('hidden');
        }
    }

    static isDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    static isMobileUI() {
        if (window.innerWidth < 992) {
            return true;
        } else {
            return false;
        }
    }

    static getTotalPrice(products = [], priceProperty = 'price') {
        let totalPrice = 0;
        for (let prod of products) {
            totalPrice += Number(prod.quantity) * Number(prod[priceProperty]);
        }
        return totalPrice.toFixed(2);
    }

    static async checkExpire() {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            Utils.redirectPage('customerlogin.html');
        }

        const options = {
            headers: {
                'Authorization': 'Bearer ' + authToken,
                'X_CID': siteSetting.CID
            }
        };

        const res = await fetch('https://emanage-prod-csm-api.azurewebsites.net/order/list', options);
        if (res.ok) {
            const result = res.json();
            return Promise.resolve(result);
        } else {
            localStorage.removeItem('authToken');
            Utils.redirectPage('customerlogin.html');
        }
    }

    static showMenuByAuth() {
        document.addEventListener('DOMContentLoaded', () => {
            const signInLinks = document.querySelectorAll('.sign-in');
            const signOutLinks = document.querySelectorAll('.sign-out');
            const accountLinks = document.querySelectorAll('a.account');
            const cartIcon = document.getElementById('icon-menu-cart');

            for (let item of signInLinks) {
                item.classList.add('hidden');
            }

            for (let item of signOutLinks) {
                item.classList.remove('hidden');
            }

            for (let item of accountLinks) {
                item.classList.remove('hidden');
            }

            if (cartIcon) {
                cartIcon.classList.add('hidden');
            }
        });
    }

    static signOut() {
        const btnSignOuts = document.querySelectorAll('.sign-out');
        for(let item of btnSignOuts) {
            item.addEventListener('click', e => {
                e.preventDefault();
                localStorage.removeItem('authToken');
                Utils.redirectPage('customerlogin.html');
            });
        }
    }

    static formatPrice(number, formattedValue) {
        try {
            const VALUE_PLACEHOLDER = 'XXXX'
            let separator = '.'
            let formatNumber = Number(number).toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')

            const pattern = formattedValue.replace(/(\d+.*,*)(.|,)(\d{2})/, (match, p1, p2) => {
                separator = p2
                return VALUE_PLACEHOLDER
            });

            if (separator === ',') {
                formatNumber = Number(number)
                    .toFixed(2)
                    .replace('.', ',')
                    .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
            }

            return pattern.replace(VALUE_PLACEHOLDER, formatNumber)
        }
        catch (e) {
            return number
        }
    }
}
