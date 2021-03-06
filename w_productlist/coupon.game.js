const orderGamePage = ((utils) => {
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
        _q('body').classList.remove('show-gamefied');
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

    const productNameText = _q('.statistical .td-name').innerText;
    const loadStatistical = () => {
        const checkedItem = _q('.productRadioListItem input:checked'),
            productItem = getClosest(checkedItem, '.productRadioListItem'),
            data = JSON.parse(checkedItem.dataset.product),
            shippingFee = data.shippings[0].formattedPrice,
            taxes = data.productPrices.Surcharge.FormattedValue,
            grandTotal = (data.shippings[0].price + data.productPrices.DiscountedPrice.Value).toFixed(2);

        const fvalue = shippingFee.replace(/[,|.]/g, ''),
            pValue = data.shippings[0].price.toFixed(2).toString().replace(/\./, ''),
            fCurrency = fvalue.replace(pValue, '######');

        _q('.statistical .td-name').innerText = productNameText + ' ' + productItem.querySelector('.product-name').innerText;
        _q('.statistical .td-price').innerText = utils.formatPrice(data.productPrices.DiscountedPrice.Value, fCurrency, taxes);
        _q('.statistical .td-shipping').innerText = shippingFee;
        _q('.statistical .td-taxes-fees').innerText = taxes;
        _q('.statistical .grand-total').innerText = utils.formatPrice(grandTotal, fCurrency, taxes);
    };

    const waitingOrderData = () => {
        utils.events.on('bindOrderPage', gamefield);
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
        _q('.gamefiedWrap .content-2').insertBefore(countdownElm, document.getElementById('couponBtn'));

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
                _q('body').classList.add('show-gamefied');
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
                _q('body').classList.add('show-gamefied');
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
                _q('body').classList.add('show-gamefied');
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
        _qById('gamefied-no').addEventListener('click', () => {
            hidePopup();
        }, false);
    };

    const implementCoupon = (data) => {
        if(!!window.couponCodeId && utils.getQueryParameter('iep') !== '0') {
        //if(!!window.couponCodeId) {
            const eCRM = new EmanageCRMJS({
                webkey: siteSetting.webKey,
                cid: siteSetting.CID,
                lang: '',
                isTest: utils.getQueryParameter('isCardTest') ? true : false
            });

            let apiGetCoupon = `${eCRM.Campaign.baseAPIEndpoint}/campaigns/${siteSetting.webKey}/coupons/${window.couponCodeId}?currencyCode=${data.currencyCode}`;
            //let apiGetCoupon = 'https://websales-api.tryemanagecrm.com/api/campaigns/99b1a8df-defa-4018-8ba0-4ffb4a7f0595/coupons/TGRG2019102?currencyCode=USD';
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

                    const promoText = _q('.gamefiedWrap .content-2');
                    promoText.innerHTML = promoText.innerHTML.replace(/{couponPrice}/g, couponPriceFormat);

                    const couponApplyText = _q('.coupon-apply');
                    couponApplyText.innerHTML = couponApplyText.innerHTML.replace(/{couponPrice}/g, couponPriceFormat);
                    window.additionText = window.additionText.replace(/{couponPrice}/g, couponPriceFormat);

                    couponDiscount = dataCoupon.discount;

                    if(!!_qById('couponBtn')) {
                        onActiveCoupon();
                    }
                    if(!!_qById('gamefied-no')) {
                        onCloseExitPopup();
                    }
                }
            });
        }
    };

    const handleExitPopupEvents = () => {
        if(utils.getQueryParameter('iep') === '0') {
            return;
        }

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

    const gamefield = (data) => {
        let currency = data.fCurrency;
        let newSlices = slices.map((obj) => {
            if(obj.text.indexOf('$') > -1) {
                let tmp = obj.text.replace('$', '').split(' ');
                obj.text = currency.replace('######', tmp[0]) + ' ' + tmp[1];
            }
            return obj;
        });
        $('.gamefied').superWheel({
            slices: slices,
            text : {
                size: 20,
                color: '#fff',
                offset: 8,
                letterSpacing: 0,
                orientation: 'v',
                arc: true
            },
            selector: 'value',
            frame: 1,
            type: 'spin',
            outer: {
                color: '#a01313',
                width: 4
            },
            marker: {
                background: '#fff',
                animate: 1
            },
            width: 660,
            duration: 3000,
            line: {
                width: 1,
                color: '#fff'
            },
            inner: {
                width: 3,
                color: '#fff'
            },
            center: {
                width: 5,
                background: '#fff',
                rotate: true
            }
        });

        $('.gamefied').superWheel('onComplete', function(results) {
            if(results.value === 1) {
                $('.gamefiedWrap .content-2 .text-wrap').html($('.gamefiedWrap .content-2 .text-wrap').html().toString().replace(/\{resultText\}/gi, results.text));
                $('.gamefiedWrap .content-1').fadeOut('fast', function() {
                    generateCountDown();
                    $('.gamefiedWrap .content-2').fadeIn('fast');
                });
                $('#gamefied-no').html($('#gamefied-no').attr('data-reject') + ' <i class="icon-close"></i>');
            }
        });
    };

    const onClickSpinBtn = () => {
        _q('.spin-button').addEventListener('click', (e) => {
            e.target.disabled = true;
            $('.gamefied').superWheel('start', 'value', 1);
        });
    };

    const listener = () => {
        handleProductListEvent();
        onChangeMonth();
        onChangeYear();
        detectInputSelect();
        onClickSpinBtn();
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
    orderGamePage.initial();
});
