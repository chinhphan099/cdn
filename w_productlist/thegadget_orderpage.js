const orderstPage = ((utils) => {
    if (!utils) {
        console.log('utils module is not found');
        return;
    }

    const productNameText = _q('.statistical .td-name').innerText;
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

    const handleProductListEvent = () => {
        const items = _qAll('.productRadioListItem input');
        for(let i = 0, n = items.length; i < n; i ++) {
            items[i].addEventListener('change', () => {
                loadStatistical();
            }, false);
        }
    };

    const loadStatistical = () => {
        const checkedItem = _q('.productRadioListItem input:checked'),
            productItem = getClosest(checkedItem, '.productRadioListItem'),
            data = JSON.parse(checkedItem.dataset.product),
            shippingFee = data.shippings[0].formattedPrice,
            taxes = data.productPrices.Surcharge.FormattedValue,
            grandTotal = (data.shippings[0].price + data.productPrices.DiscountedPrice.Value).toFixed(2);

        const fvalue = shippingFee.replace(/[,|.]/g, ''),
            pValue = data.shippings[0].price.toString().replace(/\./, ''),
            fCurrency = fvalue.replace(pValue, '######');

        _q('.statistical .td-name').innerText = productNameText + ' ' + productItem.querySelector('.product-name').innerText;
        _q('.statistical .td-price').innerText = utils.formatPrice(data.productPrices.DiscountedPrice.Value, fCurrency, taxes);
        _q('.statistical .td-shipping').innerText = shippingFee;
        _q('.statistical .td-taxes-fees').innerText = taxes;
        _q('.statistical .grand-total').innerText = utils.formatPrice(grandTotal, fCurrency, taxes);
    };

    const waitingOrderData = () => {
        utils.events.on('bindOrderPage', loadStatistical);
        utils.events.on('bindOrderPage', implementCoupon);
    };

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

        // Begin Coutdown
        let time_in_minutes = 5,
            currentTime = Date.parse(new Date()),
            deadline = new Date(currentTime + time_in_minutes * 60 * 1000);

        handleCountDown('timeCount', deadline);
        if(!!_qById('couponBtn')) {
            onActiveCoupon();
        }
        if(!!_qById('close-expopup')) {
            onCloseExitPopup();
        }
    };

    const handleMouseOut = (e) => {
        if ((e.pageY - window.pageYOffset) <= 0) {
            document.removeEventListener("mouseout", handleMouseOut);
            generateCountDown();
        }
    };

    const handleTouchMove = () => {
        const productListEle = _qById('js-widget-products');
        const rect = productListEle.getBoundingClientRect();
        let mobileTimer;
        if (rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)) {
            window.removeEventListener('touchmove', handleTouchMove);
            mobileTimer = setTimeout(() => {
                generateCountDown();
            }, 20000);
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

    const reImplementProductList = (discount) => {
        const items = _qAll('.productRadioListItem input');
        for(let i = 0, n = items.length; i < n; i ++) {
            if(!!items[i].dataset.product) {
                let dataProduct = JSON.parse(items[i].dataset.product),
                    currentPrice = dataProduct.productPrices.DiscountedPrice.Value,
                    currentPriceFormat = dataProduct.productPrices.DiscountedPrice.FormattedValue,
                    fvalue = dataProduct.shippings[0].formattedPrice.replace(/[,|.]/g, ''),
                    pValue = dataProduct.shippings[0].price.toString().replace(/\./, ''),
                    fCurrency = fvalue.replace(pValue, '######');

                dataProduct.productPrices.DiscountedPrice.Value = Number((currentPrice - discount).toFixed(2));
                dataProduct.productPrices.DiscountedPrice.FormattedValue = utils.formatPrice((currentPrice - discount).toFixed(2), fCurrency, dataProduct.shippings[0].formattedPrice);

                let priceElm = getClosest(items[i], '.productRadioListItem').querySelector('.productPrice .discountedPrice');
                let nameElm = getClosest(items[i], '.productRadioListItem').querySelector('.product-name p');
                nameElm.innerHTML = `${nameElm.innerHTML} ${window.additionText}`;
                priceElm.innerHTML = dataProduct.productPrices.DiscountedPrice.FormattedValue +
                                    ` <del style="color: grey; font-size: 0.9em;">${currentPriceFormat}</del>`;
                items[i].setAttribute('data-product', JSON.stringify(dataProduct));
            }
        }
    };

    let couponDiscount;
    const implementCoupon = (data) => {
        if(!!window.couponCodeId) {
            const promoText = _q('.w_exit_popup .w_promo_text');

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
            fetchUrl(apiGetCoupon, setting).then((data) => {
                if(!!data) {
                    const checkedItem = JSON.parse(_q('.checked-item input').dataset.product);
                    const fvalue = checkedItem.productPrices.DiscountedPrice.FormattedValue.replace(/[,|.]/g, ''),
                        pValue = checkedItem.productPrices.DiscountedPrice.Value.toFixed(2).toString().replace(/\./, ''),
                        fCurrency = fvalue.replace(pValue, '######');

                    let couponPriceFormat = utils.formatPrice(data.discount, fCurrency, data.formattedMinimalPurchase);
                    promoText.innerHTML = promoText.innerHTML.replace(/{couponPrice}/g, couponPriceFormat);
                    window.additionText = window.additionText.replace(/{couponPrice}/g, couponPriceFormat);

                    couponDiscount = data.discount;

                    if(typeof exitPopup !== 'undefined') {
                        if(utils.getQueryParameter('iep') === 'true' && !_qById('timeCount')) {
                            handleExitPopup();
                        }
                        else {
                            exitPopup.hidePopup();
                        }
                    }
                }
            });
        }
    };

    const afterActiveCoupon = () => {
        // Handle Product Price after apply Counpon
        _q('.coupon-apply').style.display = 'block';
        if(!_qById('couponCode')) {
            let couponCodeElm = document.createElement('input');
            couponCodeElm.id = 'couponCode';
            couponCodeElm.type = 'hidden';
            _q('body').appendChild(couponCodeElm);
        }
        _qById('couponCode').value = window.couponCodeId;

        exitPopup.hidePopup();
        _qById('couponBtn').disabled = false;
        window.removeEventListener('touchmove', exitPopup.handleTouchMove);
        window.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('mouseout', exitPopup.handleMouseOut);
        document.removeEventListener('mouseout', handleMouseOut);

        reImplementProductList(couponDiscount);
        loadStatistical();
    };

    const onActiveCoupon = () => {
        _qById('couponBtn').addEventListener('click', (e) => {
            e.target.disabled = true;
            afterActiveCoupon();
        }, false);
    };

    const onCloseExitPopup = () => {
        _qById('close-expopup').addEventListener('click', () => {
            exitPopup.hidePopup();
            window.removeEventListener('touchmove', exitPopup.handleTouchMove);
            window.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('mouseout', exitPopup.handleMouseOut);
            document.removeEventListener('mouseout', handleMouseOut);
        }, false);
    };

    const handleExitPopup = () => {
        if (utils.getQueryParameter('et') === '1') {
            return;
        }

        if (utils.isDevice()) {
            window.addEventListener('touchmove', exitPopup.handleTouchMove);
            window.addEventListener('touchmove', handleTouchMove);
        }
        document.addEventListener('mouseout', exitPopup.handleMouseOut);
        document.addEventListener('mouseout', handleMouseOut);
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
        onChangeMonth();
        onChangeYear();
        onFocusCreditCard();
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

    const initial = () => {
        listener();
        adjustLayout();
        waitingOrderData();
        implementYearDropdown();
        implementMonthDropdown();
        setExpirationValue();
    };

    return {
        initial: initial
    }
})(window.utils);


window.addEventListener('DOMContentLoaded', () => {
    orderstPage.initial();
});
