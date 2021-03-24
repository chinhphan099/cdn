((utils) => {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    if (!siteSetting) {
        console.log('window.siteSetting object is not found');
        return;
    }

    //clear local storage
    // utils.localStorage().remove('orderInfo');
    // utils.localStorage().remove('mainOrderLink');
    // utils.localStorage().remove('user_firstname');
    // utils.localStorage().remove('user_lastname');
    // utils.localStorage().remove('paypal_isMainOrder');
    // utils.localStorage().remove('countryCode');
    // utils.localStorage().remove('currencyCode');
    // utils.localStorage().remove('isSpecialOffer');
    // utils.localStorage().remove('webkey_to_check_paypal');
    // utils.localStorage().remove('userPaymentType');
    // utils.localStorage().remove('loggingInfo');

    //Save Listicle Referrer Url  before clear all
    let listicleReferrerUrl = window.localStorage.getItem('referrerUrl');

    let ctrWowSurvey__id = window.localStorage.getItem('ctrWowSurvey__id');

    let campProducts = window.localStorage.getItem('campproducts');
    let customerInfo = window.localStorage.getItem('customerInfo');

    window.localStorage.clear(); //clear all items

    //Add Listicle Referrer Url  after clear all
    if (listicleReferrerUrl) {
        window.localStorage.setItem('referrerUrl', listicleReferrerUrl);
    }

    if (ctrWowSurvey__id) {
        window.localStorage.setItem('ctrWowSurvey__id', ctrWowSurvey__id);
    }

    if (campProducts) {
        window.localStorage.setItem('campproducts', campProducts);
    }

    if (customerInfo) {
        window.localStorage.setItem('customerInfo', customerInfo);
        if (document.body.getAttribute('class').indexOf('order-miniac-v1-info') > 0) {
            bindCustomerInfo();
        }
    }

    function bindCustomerInfo() {
        const customerInfoObject = JSON.parse(customerInfo);

        const email = _qById('customer_email');
        if (email) {
            email.value = customerInfoObject.email;
            email.parentElement.classList.add("focused");
        }

        const customer_firstname = _qById('customer_firstname');
        if (customer_firstname) {
            customer_firstname.value = customerInfoObject.fName;
            customer_firstname.parentElement.classList.add("focused");
        }

        const customer_lastname = _qById('customer_lastname');
        if (customer_lastname) {
            customer_lastname.value = customerInfoObject.lName;
            customer_lastname.parentElement.classList.add("focused");
        }

        const customer_phone = _qById('customer_phone');
        if (customer_phone) {
            customer_phone.value = customerInfoObject.phone;
            customer_phone.parentElement.classList.add("focused");
        }

        const shipping_address1 = _qById('shipping_address1');
        if (shipping_address1) {
            shipping_address1.value = customerInfoObject.address1;
            shipping_address1.parentElement.classList.add("focused");
        }

        const shipping_address2 = _qById('shipping_address2');
        if (shipping_address2) {
            shipping_address2.value = customerInfoObject.address2;
            shipping_address2.parentElement.classList.add("focused");
        }

        const shipping_city = _qById('shipping_city');
        if (shipping_city) {
            shipping_city.value = customerInfoObject.city;
            shipping_city.parentElement.classList.add("focused");
        }

        const shipping_country = _qById('shipping_country');
        if (shipping_country) {
            const timer = setInterval(() => {
                for (let option of shipping_country.options) {
                    if (option.value === customerInfoObject.country) {
                        shipping_country.value = customerInfoObject.country;
                        const event = document.createEvent('Event');
                        event.initEvent('change', true, true);
                        shipping_country.dispatchEvent(event);
                        clearInterval(timer);
                    }
                }
            }, 500);
        }

        const shipping_province = _qById('shipping_province');
        if (shipping_province) {
            const timer = setInterval(() => {
                for (let option of shipping_province.options) {
                    if (option.value === customerInfoObject.state) {
                        shipping_province.value = customerInfoObject.state;
                        clearInterval(timer);
                    }
                }
            }, 500);
            shipping_province.value = customerInfoObject.state;
        }

        const shipping_postal = _qById('shipping_postal');
        if (shipping_postal) {
            shipping_postal.value = customerInfoObject.postcode;
            shipping_postal.parentElement.classList.add("focused");
        }
    }

    function replaceBracketsStrings() {
        //sale off heading
        const saleoffHeading = _q('.js-sale-off-heading');
        if (saleoffHeading) {
            const iconPriceLoading = `<span class="js-img-loading">
                                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" width="20" height="10" data-src="//d16hdrba6dusey.cloudfront.net/sitecommon/images/loading-price-v1.gif">
                                      </span>`;
            saleoffHeading.innerHTML = saleoffHeading.innerHTML.replace('{price}', `<span class="textDiscountPrice">${iconPriceLoading}</span>`);
            saleoffHeading.innerHTML = saleoffHeading.innerHTML.replace('{fullprice}', `<span class="textFullPrice">${iconPriceLoading}</span>`);
        }

        //installment payment : bind installment month
        if (window.widget && window.widget.installmentpayment) {
            const maxMonth = window.widget.installmentpayment.defaultMonths[window.widget.installmentpayment.defaultMonths.length - 1];
            //top promo
            const topPromo = _q('.top-promo');
            if (topPromo) {
                topPromo.innerHTML = topPromo.innerHTML.replace('{installmentMonth}', maxMonth);
            }

            //sale off heading
            if (saleoffHeading) {
                saleoffHeading.innerHTML = saleoffHeading.innerHTML.replace('{installmentMonth}', maxMonth);
            }

            //credit card method : caption
            const w_cc_caption = _q('.w_creditcard .w_caption');
            if (w_cc_caption) {
                w_cc_caption.innerHTML = w_cc_caption.innerHTML.replace('{installmentMonth}', maxMonth);
            }
        }
    }
    replaceBracketsStrings();

    function registerEvents() {
        utils.events.on('bindOrderPage', bindOrderPage);
    }
    registerEvents();

    function checkIsSpecialItem() {
        if (!_q('input[name="product"]:checked')) return;
        const checkedItem = _q('input[name="product"]:checked');
        const proItem = _getClosest(checkedItem, '.productRadioListItem');
        if (proItem.classList.contains('special_offer')) {
            utils.localStorage().set('isSpecialOffer', 'true');
        }
        else {
            utils.localStorage().set('isSpecialOffer', 'false');
        }
    }
    checkIsSpecialItem();

    function handleInputChange() {
        const prodInputs = _qAll('.productRadioListItem input');
        for (const prodInput of prodInputs) {
            prodInput.addEventListener('click', function () {
                checkIsSpecialItem();
            });
        }
    }
    handleInputChange();

    function bindOrderPage(data) {
        if (data) {
            const textDiscountPriceElms = _qAll('.textDiscountPrice');
            for (const textDiscountPriceElm of textDiscountPriceElms) {
                textDiscountPriceElm.innerHTML = data.discountPrice;
            }

            const textFullPrices = _qAll('.textFullPrice');
            for (const textFullPrice of textFullPrices) {
                textFullPrice.innerHTML = data.fullPrice;
            }

            //Check and hide sentence : All pricing is in United States Dollar.
            if (!!data.currencyCode) {
                if ((data.currencyCode == '' || data.currencyCode.toLowerCase() !== 'usd' || (!!data.fCurrency && data.fCurrency.indexOf("$")) === -1)) {
                    if (_q('.js-currency-usd')) {
                        _q('.js-currency-usd').style.display = 'none';
                    }
                }
            } else {
                if (_q('.js-currency-usd')) {
                    _q('.js-currency-usd').style.display = 'none';
                }
            }
        }
    }

    function loadingIcons() {
        const iconloading = `<span class="js-img-loading">
                                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" width="20" height="10" data-src="//d16hdrba6dusey.cloudfront.net/sitecommon/images/loading-price-v1.gif">
                            </span>`;

        // Coupon
        if (!!_q('.coupon-popup-new')) {
            const promoText = _q('.coupon-popup-new .w_promo_text');
            if (!!promoText) {
                promoText.innerHTML = promoText.innerHTML.replace(/{couponPrice}/g, iconloading);
            }
        }
    }
    loadingIcons();

    function clearParameter(...params) {
        for(let param of params) {
            let url = document.location.href;
            const urlparts = url.split('?');

            if (urlparts.length >= 2) {
                const urlBase = urlparts.shift();
                const queryString = urlparts.join('?');

                const prefix = encodeURIComponent(param) + '=';
                const pars = queryString.split(/[&;]/g);
                for (let i = pars.length; i-->0;) {
                    if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                        pars.splice(i, 1);
                    }
                }
                url = urlBase + '?' + pars.join('&');
                window.history.pushState('', document.title, url);
            }
        }
    }
    clearParameter('10pop', '15pop', 'clickid', 'banner', 'shippro');

    /*--------start : run common order------------*/
    const CommonOrder = utils.CommonOrder;
    class Order extends CommonOrder {
    }
    const insOrder = new Order();
    insOrder.init();
    /*--------/end : run common order------------*/

})(window.utils);

((utils) => {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    let isChangeTab = false;
    const getVisibleItems = () => {
        let visibleElms = [];
        const productItems = _qAll('.productRadioListItem');

        for (let item of productItems) {
            if (window.getComputedStyle(item).display !== 'none') {
                visibleElms.push(item);
            }
        }
        return visibleElms;
    };

    const setActiveItem = () => {
        const visibleItems = getVisibleItems();
        let qt = utils.getQueryParameter('qt'),
            qtNumber = Number(qt);

        if (!!qt && qtNumber > 0 && qtNumber <= visibleItems.length) {
            qtNumber -= 1;
            if (utils.getQueryParameter('et') === '1') {
                qtNumber = 0;
            }

            const listProduct = _qAll('.productRadioListItem');
            for (let itemProduct of listProduct) {
                itemProduct.classList.remove('default', 'checked-item');
            }
            visibleItems[qtNumber].classList.add('default', 'checked-item');
            if (!isChangeTab) {
                visibleItems[qtNumber].querySelector('input').click();
                if (typeof exitPopup !== 'undefined') {
                    exitPopup.handleEvents();
                }
                _q('body').classList.add('wasteClick');
            }
        }
    };

    const waitingOrderData = () => {
        utils.events.on('bindOrderPage', setActiveItem);
    };

    const onClickTabPackage = () => {
        const tabItems = _qAll('.js-list-group li');
        if (!!tabItems.length) {
            for (let tabItem of tabItems) {
                tabItem.addEventListener('click', function () {
                    isChangeTab = true;
                    setActiveItem();
                }, false);
            }
        }
    };

    const onClickListAdapter = () => {
        const tabItems = _qAll('.list-adapters input');
        if (!!tabItems.length) {
            for (let tabItem of tabItems) {
                tabItem.addEventListener('change', function () {
                    isChangeTab = true;
                    setActiveItem();
                }, false);
            }
        }
    }

    const listener = () => {
        onClickTabPackage(); // NewProductListWidget
        onClickListAdapter(); // For Tu's widget
    };

    const initial = () => {
        listener();
    };

    waitingOrderData();
    window.addEventListener('DOMContentLoaded', () => {
        initial();
    });
})(window.utils);
