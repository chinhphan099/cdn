Element.prototype.appendBefore = function (element) {
    element.parentNode.insertBefore(this, element);
}, false;

Element.prototype.appendAfter = function (element) {
    element.parentNode.insertBefore(this, element.nextSibling);
}, false;

const orderStPage = ((utils) => {
    if (!utils) {
        console.log('utils module is not found');
        return;
    }

    const time_in_minutes = 5; // 5 minutes countdown
    let mobileTimer;
    let isShowCoupOn = false;
    let couponDiscount;

    const getClosest = (elem, selector) => {
        if (!Element.prototype.matches) {
        Element.prototype.matches =
            Element.prototype.matchesSelector ||
            Element.prototype.mozMatchesSelector ||
            Element.prototype.msMatchesSelector ||
            Element.prototype.oMatchesSelector ||
            Element.prototype.webkitMatchesSelector ||
            function(s) {
                let matches = (this.document || this.ownerDocument).querySelectorAll(s),
                    i = matches.length;
                while (--i >= 0 && matches.item(i) !== this) {}
                return i > -1;
            }
        }

        // Get the closest matching element
        for ( ; elem && elem !== document; elem = elem.parentNode ) {
            if (elem.matches(selector)) {
                return elem;
            }
        }
        return null;
    };

    const hidePopup = () => {
        _q('.w_modal').style.display = 'none';
        clearTimeout(mobileTimer);
        document.removeEventListener('mouseout', handleMouseOut);
        window.removeEventListener('touchmove', handleTouchMove);
    };

    const detectInputSelect = () => {
        const inputs = _qAll('input');
        for (let input of inputs) {
            input.addEventListener('click', function () {
                hidePopup();
            });
        }

        const selects = _qAll('select');
        for (let select of selects) {
            select.addEventListener('click', function () {
                hidePopup();
            });
        }
    };

    const fetchUrl = async (url, setting) => {
        const response = await fetch(url, setting)
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                })
                .catch(err => {
                    console.log('Error: ', err)
                });

        return response;
    };

    const handleProductListEvent = () => {
        const items = _qAll('input');
        for(let i = 0, n = items.length; i < n; i ++) {
            items[i].addEventListener('change', (e) => {
                if(!!e.target.dataset.product) {
                    loadStatistical();
                }
            }, false);
        }
    };

    const getWarrantyPrice = (fCurrency, taxes) => {
        let wPrice = 0, wFormatPrice = false;

        if(_qById('txtProductWarranty').checked) {
            const checkedItem = _q('.productRadioListItem input:checked'),
                data = JSON.parse(checkedItem.dataset.product),
                warrantyRate = [0.1, 0.2, 0.2, 0.2, 0.2, 0.3, 0.5, 0.15, 0.25, 0.35, 0.4, 0.45, 0.55, 0.6],
                funnelId = _qById('txtProductWarranty').value,
                funnelPrice = warrantyRate[parseInt(funnelId) - 1];

            let warrantyPrice = (Math.round(100 * data.productPrices.DiscountedPrice.Value * funnelPrice) / 100).toFixed(2);
            wPrice = Number(warrantyPrice);

            wFormatPrice = utils.formatPrice(warrantyPrice, fCurrency, taxes);
        }

        return {wPrice, wFormatPrice};
    };

    const onChangeWarranty = () => {
        _qById('txtProductWarranty').addEventListener('change', function (e) {
            loadStatistical();
        });
    };

    const productNameText = _q('.statistical .td-name').innerText;
    const loadStatistical = () => {
        const checkedItem = _q('.productRadioListItem input:checked'),
            productItem = getClosest(checkedItem, '.productRadioListItem'),
            data = JSON.parse(checkedItem.dataset.product),
            shippingFee = data.shippings[0].formattedPrice,
            taxes = data.productPrices.Surcharge.FormattedValue;

        const fvalue = shippingFee.replace(/[,|.]/g, ''),
            pValue = data.shippings[0].price.toFixed(2).toString().replace(/\./, ''),
            fCurrency = fvalue.replace(pValue, '######');

        const warranty = getWarrantyPrice(fCurrency, taxes),
            grandTotal = (data.shippings[0].price + data.productPrices.DiscountedPrice.Value + warranty.wPrice).toFixed(2);

        _q('.statistical .td-name').innerText = productNameText + ' ' + productItem.querySelector('.product-name').innerText;
        _q('.statistical .td-price').innerText = utils.formatPrice(data.productPrices.DiscountedPrice.Value, fCurrency, taxes);
        _q('.statistical .td-shipping').innerText = shippingFee;

        if(!!_q('.tr-warranty')) {
            let trWarranty = _q('.tr-warranty');
            trWarranty.parentNode.removeChild(trWarranty);
        }
        if(!!warranty.wFormatPrice) {
            let trShipping = getClosest(_q('.statistical .td-shipping'), 'tr'),
                warrantyElm = document.createElement('tr');

            warrantyElm.classList.add('tr-warranty');
            warrantyElm.innerHTML = `
                <td>${js_translate.warranty}</td>
                <td>${warranty.wFormatPrice}</td>
            `;

            warrantyElm.appendAfter(trShipping);
        }

        _q('.statistical .td-taxes-fees').innerText = taxes;
        _q('.statistical .grand-total').innerText = utils.formatPrice(grandTotal, fCurrency, taxes);
    };

    const waitingOrderData = () => {
        utils.events.on('bindOrderPage', loadStatistical);
        utils.events.on('bindOrderPage', implementCoupon);
    };

    // Month and Year Dropdown
    const implementYearDropdown = () => {
        const d = new Date(),
            curYear = d.getFullYear(),
            endYear = curYear + 20;

        for(let i = curYear; i < endYear; i++) {
            let opt = document.createElement('option');
            opt.value = i;
            opt.text = i;
            _qById('yearddl').appendChild(opt);
        }
    };
    const implementMonthDropdown = () => {
        const d = new Date(),
            curYear = d.getFullYear(),
            curMonth = d.getMonth() + 1,
            opts = _qAll('#monthddl option');

        for(let i = 0, n = opts.length; i < n; i++) {
            if(_qById('yearddl').value === curYear.toString()) {
                if(Number(opts[i].value) <= curMonth) {
                    opts[i].disabled = true;
                    opts[i].selected = false;
                }
            }
            else {
                opts[i].disabled = false;
            }
        }
    };
    const setExpirationValue = () => {
        _qById('creditcard_expirydate').value = _qById('monthddl').value + '/' + _qById('yearddl').value.toString().substr(2);
    };
    const onChangeMonth = () => {
        _qById('monthddl').addEventListener('change', function() {
            setExpirationValue();
        }, false);
    };
    const onChangeYear = () => {
        _qById('yearddl').addEventListener('change', function() {
            implementMonthDropdown();
            setExpirationValue();
        }, false);
    };
    // End Month and Year Dropdown

    // Count down
    const timeRemaining = (endtime) => {
        const t = Date.parse(endtime) - Date.parse(new Date()),
            seconds = Math.floor( (t / 1000) % 60 ),
            minutes = Math.floor( (t / 1000 / 60) % 60 );

        return {
            'total': t,
            'minutes': minutes,
            'seconds': seconds
        };
    };
    const handleCountDown = (id, endtime) => {
        const clock = document.getElementById(id),
            minuteElm = clock.querySelector('.ex-minute'),
            secondElm = clock.querySelector('.ex-second');

        function updateClock() {
            let t = timeRemaining(endtime);
            if(t.total <= 0) {
                clearInterval(timeinterval);
            }
            minuteElm.innerHTML = t.minutes < 10 ? '0' + t.minutes : t.minutes;
            secondElm.innerHTML = t.seconds < 10 ? '0' + t.seconds : t.seconds;
        }
        updateClock(); // Run on first time
        var timeinterval = setInterval(updateClock, 1000);
    };
    const generateCountDown = () => {
        const countdownElm = document.createElement('div');
        countdownElm.id = 'timeCount';
        countdownElm.innerHTML = `
            <div class="w_item">
                <div class="ex-minute"></div>
                <div class="minute-text">${js_translate.minutes}</div>
            </div>
            <div class="w_item">
                <div class="semicolon">:</div>
            </div>
            <div class="w_item">
                <div class="ex-second"></div>
                <div class="second-text">${js_translate.seconds}</div>
            </div>
        `;
        _q('.w_promo_text').insertBefore(countdownElm, document.getElementById('couponBtn'));

        isShowCoupOn = true;
        document.removeEventListener('mouseout', handleMouseOut);
        window.removeEventListener('touchmove', handleTouchMove);

        let checkPriceCoupOn = setInterval(function() {
            if(_qById('couponBtn').innerHTML.indexOf('{couponPrice}') === -1){
                clearInterval(checkPriceCoupOn);

                // Begin Coutdown
                let currentTime = Date.parse(new Date()),
                    deadline = new Date(currentTime + time_in_minutes * 60 * 1000);

                handleCountDown('timeCount', deadline);
                _q('.w_modal').style.display = 'block';
            }
        }, 50);
    };
    // End Count down

    const handleMouseOut = (e) => {
        if(isShowCoupOn === true) return;

        if ((e.pageY - window.pageYOffset) <= 0) {
            const product = _q('input[name="product"]:checked').dataset.product;
            if (!!product) {
                document.removeEventListener('mouseout', handleMouseOut);
                generateCountDown();
            }
        }
    };

    const handleTouchMove = () => {
        if(isShowCoupOn === true) return;

        const productListEle = _qById('js-widget-products'),
            rect = productListEle.getBoundingClientRect();

        if (rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)) {
            window.removeEventListener('touchmove', handleTouchMove);
            mobileTimer = setTimeout(() => {
                generateCountDown();
            }, 5000);
        }
    };

    const reImplementProductList = (discount) => {
        const items = _qAll('.productRadioListItem input');
        for(let i = 0, n = items.length; i < n; i ++) {
            if(!!items[i].dataset.product) {
                let dataProduct = JSON.parse(items[i].dataset.product),
                    currentPrice = dataProduct.productPrices.DiscountedPrice.Value,
                    currentPriceFormat = dataProduct.productPrices.DiscountedPrice.FormattedValue,
                    fvalue = dataProduct.shippings[0].formattedPrice.replace(/[,|.]/g, ''),
                    pValue = dataProduct.shippings[0].price.toFixed(2).toString().replace(/\./, ''),
                    fCurrency = fvalue.replace(pValue, '######');

                dataProduct.productPrices.DiscountedPrice.Value = Number((currentPrice - discount).toFixed(2));
                dataProduct.productPrices.DiscountedPrice.FormattedValue = utils.formatPrice((currentPrice - discount).toFixed(2), fCurrency, dataProduct.shippings[0].formattedPrice);

                let priceElm = getClosest(items[i], '.productRadioListItem').querySelector('.productPrice .discountedPrice');
                priceElm.innerHTML = `${dataProduct.productPrices.DiscountedPrice.FormattedValue} <del style="color: grey; font-size: 0.9em; font-weight: normal;">
                                        ${currentPriceFormat}
                                    </del>`;

                let nameElm = getClosest(items[i], '.productRadioListItem').querySelector('.product-name p');
                nameElm.innerHTML = `${nameElm.innerHTML} ${window.additionText}`;

                items[i].setAttribute('data-product', JSON.stringify(dataProduct));
            }
        }
    };

    const afterActiveCoupon = () => {
        _q('.coupon-apply').style.display = 'block';
        if(!_qById('couponCode')) {
            let couponCodeElm = document.createElement('input');
            couponCodeElm.id = 'couponCode';
            couponCodeElm.type = 'hidden';
            _q('body').appendChild(couponCodeElm);
        }
        _qById('couponCode').value = window.couponCodeId;

        reImplementProductList(couponDiscount);
        loadStatistical();
    };

    const onActiveCoupon = () => {
        _qById('couponBtn').addEventListener('click', (e) => {
            e.target.disabled = true;
            afterActiveCoupon();
            hidePopup();
        }, false);
    };

    const onCloseExitPopup = () => {
        _qById('close-expopup').addEventListener('click', () => {
            hidePopup();
        }, false);
    };

    const implementCoupon = (data) => {
        // if(!!window.couponCodeId && utils.getQueryParameter('iep') === 'true') {
        if(!!window.couponCodeId) {
            const eCRM = new EmanageCRMJS({
                webkey: siteSetting.webKey,
                cid: siteSetting.CID,
                lang: '',
                isTest: utils.getQueryParameter('isCardTest') ? true : false
            });

            let apiGetCoupon = `${eCRM.Campaign.baseAPIEndpoint}/campaigns/${siteSetting.webKey}/coupons/${window.couponCodeId}?currencyCode=${data.currencyCode}`;
            let setting = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X_CID': siteSetting.CID
                }
            };
            fetchUrl(apiGetCoupon, setting).then((dataCoupon) => {
                if(!!dataCoupon) {
                    let couponPriceFormat = utils.formatPrice(dataCoupon.discount, data.fCurrency, dataCoupon.formattedMinimalPurchase);

                    const promoText = _q('.w_exit_popup .w_promo_text');
                    promoText.innerHTML = promoText.innerHTML.replace(/{couponPrice}/g, couponPriceFormat);

                    const couponApplyText = _q('.coupon-apply');
                    couponApplyText.innerHTML = couponApplyText.innerHTML.replace(/{couponPrice}/g, couponPriceFormat);
                    window.additionText = window.additionText.replace(/{couponPrice}/g, couponPriceFormat);

                    couponDiscount = dataCoupon.discount;

                    if(!!_qById('couponBtn')) {
                        onActiveCoupon();
                    }
                    if(!!_qById('close-expopup')) {
                        onCloseExitPopup();
                    }
                }
            });
        }
    };

    const handleExitPopupEvents = () => {
        /*if(utils.getQueryParameter('iep') !== 'true') {
            return;
        }*/

        if (utils.isDevice()) {
            window.addEventListener('touchmove', handleTouchMove);
        }
        document.addEventListener('mouseout', handleMouseOut);
    };

    const adjustLayout = () => {
        let billingEmail = getClosest(_qById('billing_email'), '.form-group');
        billingEmail.parentNode.removeChild(billingEmail);

        let billingFullName = _q('.billing-full-name');
        billingFullName.parentNode.removeChild(billingFullName);

        let billingPhone = getClosest(_qById('billing_phone'), '.form-group');
        billingPhone.parentNode.removeChild(billingPhone);

        _qById('shipping_streetname').removeAttribute('required');
        _qById('billing_streetname').removeAttribute('required');
    };

    const onFocusCreditCard = () => {
        // For order-v3
        if(_q('.step-4-wrap')) {
            _qById('creditcard_creditcardnumber').addEventListener('focus', () => {
                _q('.step-4-wrap').classList.remove('hidden');
            }, false);
        }
    };

    const listener = () => {
        handleProductListEvent();
        onChangeWarranty();
        onChangeMonth();
        onChangeYear();
        onFocusCreditCard();
        detectInputSelect();
    };

    const initial = () => {
        waitingOrderData();
        adjustLayout();
        handleExitPopupEvents();
        implementYearDropdown();
        implementMonthDropdown();
        setExpirationValue();
        listener();
    };

    return {
        initial: initial
    };
})(window.utils);

window.addEventListener('DOMContentLoaded', () => {
    orderStPage.initial();
});
