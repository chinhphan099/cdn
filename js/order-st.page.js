Element.prototype.appendBefore = function (element) {
    element.parentNode.insertBefore(this, element);
}, false;

Element.prototype.appendAfter = function (element) {
    element.parentNode.insertBefore(this, element.nextSibling);
}, false;

((utils) => {
    if (!utils) {
        console.log('utils module is not found');
        return;
    }

    const time_in_minutes = 5; // 5 minutes countdown
    let mobileTimer;
    let couponDiscount;
    let typeCoupon;
    let fCurrency;
    let timedPopup;
    let timeinterval;
    let isPopupShowing = false;

    // Count down
    function timeRemaining(endtime) {
        const t = Date.parse(endtime) - Date.parse(new Date()),
            seconds = Math.floor( (t / 1000) % 60 ),
            minutes = Math.floor( (t / 1000 / 60) % 60 );

        return {
            'total': t,
            'minutes': minutes,
            'seconds': seconds
        };
    }
    function handleCountDown(endtime) {
        function updateClock() {
            let t = timeRemaining(endtime);
            if(t.total <= 0) {
                clearInterval(timeinterval);
            }

            const minuteElm = _q('.coupon-popup').querySelector('.ex-minute'),
                secondElm = _q('.coupon-popup').querySelector('.ex-second');
            minuteElm.innerHTML = t.minutes < 10 ? '0' + t.minutes : t.minutes;
            secondElm.innerHTML = t.seconds < 10 ? '0' + t.seconds : t.seconds;
        }
        updateClock(); // Run on first time
        timeinterval = setInterval(updateClock, 1000);
    }
    function generateCountDown() {
        if (!_q('.coupon-popup') || !!isPopupShowing) {
            return;
        }
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
        let currentTime = Date.parse(new Date()),
            deadline = new Date(currentTime + time_in_minutes * 60 * 1000);

        handleCountDown(deadline);
        _q('.coupon-popup').style.display = 'block';
        // utils.createCookie('isHidePopup', 'true', 1);
        isPopupShowing = true;
    }
    // End Count down

    function handleMouseOut(e) {
        if(!!isPopupShowing) {
            return;
        }
        if ((e.pageY - window.pageYOffset) <= 0) {
            // const product = _q('input[name="product"]:checked').dataset.product;
            // if (!!product) {
                document.removeEventListener('mouseout', handleMouseOut);
                generateCountDown();
            // }
        }
    }

    function handleTouchMove() {
        if(!!isPopupShowing) {
            return;
        }
        window.removeEventListener('touchmove', handleTouchMove);
        mobileTimer = setTimeout(() => {
            // const product = _q('input[name="product"]:checked').dataset.product;
            // if (!!product) {
                generateCountDown();
            // }
        }, 5000);
    }

    function hidePopup(isOver) {
        isPopupShowing = false;
        if(!!_q('.coupon-popup')) {
            _q('.coupon-popup').style.display = 'none';
        }
        if(_qById('timeCount')) {
            _qById('timeCount').parentNode.removeChild(_qById('timeCount'));
        }
        if(!!_qById('couponBtn')) {
            _qById('couponBtn').disabled = false;
        }
        clearInterval(timeinterval);
        if(!!isOver) {
            clearTimeout(mobileTimer);
            clearTimeout(timedPopup);
            document.removeEventListener('mouseout', handleMouseOut);
            window.removeEventListener('touchmove', handleTouchMove);
        }
    }

    function checkIsSpecialItem() {
        const checkedItem = _q('input[name="product"]:checked');
        const proItem = _getClosest(checkedItem, '.productRadioListItem');
        if (proItem.classList.contains('special_offer')) {
            utils.localStorage().set('isSpecialOffer', 'true');
        }
        else {
            utils.localStorage().set('isSpecialOffer', 'false');
        }
    }

    function getWarrantyPrice(fCurrency, taxes) {
        let wPrice = 0, wFormatPrice = false;

        if(!!_qById('txtProductWarranty') && _qById('txtProductWarranty').checked) {
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
    }

    const productNameText = _q('.statistical .td-name').innerText;
    function loadStatistical(dataResponse) {
        if(!!dataResponse) {
            fCurrency = dataResponse.fCurrency;
        }
        if(!fCurrency) {
            return;
        }
        const checkedItem = _q('.productRadioListItem input:checked'),
            productItem = _getClosest(checkedItem, '.productRadioListItem'),
            data = JSON.parse(checkedItem.dataset.product),
            shippingFee = data.shippings[0].formattedPrice,
            taxes = data.productPrices.Surcharge.FormattedValue;

        const warranty = getWarrantyPrice(fCurrency, taxes),
            grandTotal = (data.shippings[0].price + data.productPrices.DiscountedPrice.Value + warranty.wPrice).toFixed(2);

        _q('.statistical .td-name').innerHTML = productNameText + ' ' + productItem.querySelector('.product-name p').innerHTML;
        _q('.statistical .td-price').innerText = utils.formatPrice(data.productPrices.DiscountedPrice.Value.toFixed(2), fCurrency, taxes);
        _q('.statistical .td-shipping').innerText = shippingFee;

        if(!!_q('.tr-warranty')) {
            let trWarranty = _q('.tr-warranty');
            trWarranty.parentNode.removeChild(trWarranty);
        }
        if(!!warranty.wFormatPrice) {
            let trShipping = _getClosest(_q('.statistical .td-shipping'), 'tr'),
                warrantyElm = document.createElement('tr');

            warrantyElm.classList.add('tr-warranty');
            warrantyElm.innerHTML = `
                <td>${js_translate.warranty || 'Warranty:'}</td>
                <td>${warranty.wFormatPrice}</td>
            `;

            warrantyElm.appendAfter(trShipping);
        }

        _q('.statistical .td-taxes-fees').innerText = taxes;
        _q('.statistical .grand-total').innerText = utils.formatPrice(grandTotal, fCurrency, taxes);

        if (data.productTypeName.toLocaleLowerCase() === 'coupon') {
            utils.localStorage().set('isActivationCode', 'true');
        }
        else {
            utils.localStorage().set('isActivationCode', 'false');
        }
    }

    let isClickedInput = false;
    function onClickInputSelect() {
        const inputs = _qAll('input');
        let checkQT = false;
        for (let input of inputs) {
            input.addEventListener('click', function () {
                checkIsSpecialItem();
            });

            input.addEventListener('change', (e) => {
                if(!!utils.getQueryParameter('qt') && !checkQT) {
                    checkQT = true;
                    return;
                }
                isClickedInput = true;
                hidePopup(true);
                if(!!e.target.dataset.product) {
                    loadStatistical();
                }
            }, false);
        }

        const selects = _qAll('select');
        for (let select of selects) {
            select.addEventListener('click', function () {
                isClickedInput = true;
                hidePopup(true);
            });
        }
    }

    function onChangeWarranty() {
        if(!!_qById('txtProductWarranty')) {
            _qById('txtProductWarranty').addEventListener('change', function() {
                loadStatistical();
            });
        }
    }

    // Month and Year Dropdown
    function implementYearDropdown() {
        const d = new Date(),
            curYear = d.getFullYear(),
            endYear = curYear + 20;

        for(let i = curYear; i < endYear; i++) {
            let opt = document.createElement('option');
            opt.value = i;
            opt.text = i;
            _qById('yearddl').appendChild(opt);
        }
    }
    function implementMonthDropdown() {
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
    }
    function setExpirationValue() {
        _qById('creditcard_expirydate').value = _qById('monthddl').value + '/' + _qById('yearddl').value.toString().substr(2);
    }
    function onChangeMonth() {
        _qById('monthddl').addEventListener('change', function() {
            setExpirationValue();
        }, false);
    }
    function onChangeYear() {
        _qById('yearddl').addEventListener('change', function() {
            implementMonthDropdown();
            setExpirationValue();
        }, false);
    }
    // End Month and Year Dropdown

    function reImplementProductList(discount) {
        const items = _qAll('.productRadioListItem input');
        for(let i = 0, n = items.length; i < n; i ++) {
            if(!!items[i].dataset.product) {
                let dataProduct = JSON.parse(items[i].dataset.product),
                    currentPrice = dataProduct.productPrices.DiscountedPrice.Value,
                    currentPriceFormat = dataProduct.productPrices.DiscountedPrice.FormattedValue;

                if(typeCoupon === 'Money Amount') {
                    dataProduct.productPrices.DiscountedPrice.Value = Number((currentPrice - discount).toFixed(2));
                    dataProduct.productPrices.DiscountedPrice.FormattedValue = utils.formatPrice((currentPrice - discount).toFixed(2), fCurrency, dataProduct.shippings[0].formattedPrice);
                }
                else {
                    dataProduct.productPrices.DiscountedPrice.Value = Number((currentPrice * (100 - discount) / 100).toFixed(2));
                    dataProduct.productPrices.DiscountedPrice.FormattedValue = utils.formatPrice((currentPrice * (100 - discount) / 100).toFixed(2), fCurrency, dataProduct.shippings[0].formattedPrice);
                }

                let priceElms = _getClosest(items[i], '.productRadioListItem').querySelectorAll('.discountedPrice');
                if(!!priceElms) {
                    for(let priceElm of priceElms) {
                        priceElm.innerHTML = `${dataProduct.productPrices.DiscountedPrice.FormattedValue} <del style="color: grey; font-size: 0.9em; font-weight: normal;">${currentPriceFormat}</del>`;
                    }
                }

                let savePriceElms = _getClosest(items[i], '.productRadioListItem').querySelectorAll('.savePrice');
                if(!!savePriceElms) {
                    for(let savePriceElm of savePriceElms) {
                        let savePrice = (dataProduct.productPrices.FullRetailPrice.Value - dataProduct.productPrices.DiscountedPrice.Value).toFixed(2);
                        savePriceElm.innerHTML = fCurrency.replace('######', savePrice);
                    }
                }

                let nameElm = _getClosest(items[i], '.productRadioListItem').querySelector('.product-name p');
                nameElm.innerHTML = `${nameElm.innerHTML} ${window.additionText}`;

                items[i].setAttribute('data-product', JSON.stringify(dataProduct));
            }
        }
    }

    function getSelectedProduct() {
        const product = _q('input[name="product"]:checked').dataset.product;
        if (product) {
            return JSON.parse(product);
        } else {
            return null;
        }
    }

    function afterActiveCoupon() {
        if(_q('.coupon-apply')) {
            _q('.coupon-apply').style.display = 'block';
        }
        if(!_qById('couponCode')) {
            let couponCodeElm = document.createElement('input');
            couponCodeElm.id = 'couponCode';
            couponCodeElm.type = 'hidden';
            _q('body').appendChild(couponCodeElm);
        }
        _qById('couponCode').value = window.couponCodeId;

        reImplementProductList(couponDiscount);
        loadStatistical();

        // Installment
        const productInfo = getSelectedProduct();
        utils.events.emit('triggerInstallmentPayment', {
            discountPrice: productInfo.productPrices.DiscountedPrice.FormattedValue,
            discountPriceValue: productInfo.productPrices.DiscountedPrice.Value,
            fullPrice: productInfo.productPrices.FullRetailPrice.FormattedValue,
            fullPriceValue: productInfo.productPrices.FullRetailPrice.Value
        });
    }

    function getVisibleItems() {
        let visibleElms = [];
        const productItems = _qAll('.productRadioListItem');

        for(let item of productItems) {
            if(window.getComputedStyle(item).display !== 'none') {
                visibleElms.push(item);
            }
        }
        return visibleElms;
    }

    function showSpecialItem() {
        const selectedProd = _q('.productRadioListItem.checked-item');
        const specialProduct = _q('.productRadioListItem.special_offer');

        if(specialProduct) {
            if(_q('.coupon-apply')) {
                _q('.coupon-apply').style.display = 'block';
            }
            const selected_default_text = selectedProd.querySelector('.best-seller-text');
            if(selected_default_text) {
                selected_default_text.parentNode.removeChild(selected_default_text);
            }

            // Remove class default for all visible item
            const visibleItems = getVisibleItems();
            for(let i = 0, n = visibleItems.length; i < n; i++) {
                visibleItems[i].classList.remove('default');
            }

            specialProduct.classList.remove('hidden');
            specialProduct.classList.add('default');
            specialProduct.querySelector('input[type="radio"]').click();
        }
    }

    function onActiveCoupon() {
        _qById('couponBtn').classList.remove('disabled');
        _qById('couponBtn').addEventListener('click', (e) => {
            e.target.disabled = true;
            if(_q('.productRadioListItem.special_offer')) {
                showSpecialItem();
            }
            else {
                afterActiveCoupon();
            }
            loadStatistical();
            hidePopup(true);
        }, false);
    }

    let isClicked = false;
    function onCloseExitPopup() {
        _qById('close-expopup').addEventListener('click', () => {
            hidePopup(isClicked);
            if(!isClicked) {
                isClicked = true;
            }
        }, false);
    }

    function implementCoupon(data) {
        fCurrency = data.fCurrency;
        if(!!window.couponCodeId && utils.getQueryParameter('iep') === 'true' && !!_q('.coupon-popup')) {
            if(!window.couponValue.trim()) {
                return;
            }
            let couponValFormat = window.couponValue;
            let couponVal = Number(couponValFormat.replace('%', ''));
            couponDiscount = couponVal;

            if(window.couponValue.indexOf('%') === -1) {
                typeCoupon = 'Money Amount';
                couponValFormat = utils.formatPrice(couponVal, fCurrency, data.shippingValue.toString());
            }
            const promoText = _q('.w_exit_popup .w_promo_text');
            if(!!promoText) {
                promoText.innerHTML = promoText.innerHTML.replace(/{couponPrice}/g, couponValFormat);
            }

            const couponApplyText = _q('.coupon-apply');
            if(!!couponApplyText) {
                couponApplyText.innerHTML = couponApplyText.innerHTML.replace(/{couponPrice}/g, couponValFormat);
            }

            // New Code
            const jsImageLoadings = _qAll('.w_exit_popup .js-img-loading');
            if(!!jsImageLoadings) {
                for(const jsImageLoading of jsImageLoadings) {
                    jsImageLoading.innerText = couponValFormat;
                }
            }
            window.additionText = window.additionText.replace(/{couponPrice}/g, couponValFormat);

            if(!!_qById('couponBtn')) {
                onActiveCoupon();
            }
            if(!!_qById('close-expopup')) {
                onCloseExitPopup();
            }
        }
    }

    function handleExitPopupEvents() {
        if(utils.getQueryParameter('iep') !== 'true' || !_q('.coupon-popup') || !!utils.readCookie('isHidePopup')) {
            return;
        }

        if (utils.isDevice()) {
            window.addEventListener('touchmove', handleTouchMove);
        }
        else {
            document.addEventListener('mouseout', handleMouseOut);
        }
    }

    function adjustLayout() {
        let billingEmail = _getClosest(_qById('billing_email'), '.form-group');
        if(!!billingEmail) {
            billingEmail.parentNode.removeChild(billingEmail);
        }

        let billingFullName = _q('.billing-full-name');
        if(!!billingFullName) {
            billingFullName.parentNode.removeChild(billingFullName);
        }

        let billingPhone = _getClosest(_qById('billing_phone'), '.form-group');
        if(!!billingPhone) {
            billingPhone.parentNode.removeChild(billingPhone);
        }
    }

    function changePlaceholderInput() {
        // For order of BR
        if(_q('.widget-shipping-form input#shipping_cep')) {
            _q('.widget-shipping-form input#shipping_cep').placeholder = 'Cep: 01310-000';
        }
    }

    function onFocusCreditCard() {
        // For order-v3
        if(_q('.step-4-wrap')) {
            _qById('creditcard_creditcardnumber').addEventListener('focus', () => {
                _q('.step-4-wrap').classList.remove('hidden');
            }, false);
        }
    }

    function popupTimed() {
        const timer = !!utils.getQueryParameter('timed') ? Number(utils.getQueryParameter('timed')) * 1000 : null;
        if(!!timer && !!_q('.coupon-popup')) {
            timedPopup = setTimeout(function() {
                // const product = _q('input[name="product"]:checked').dataset.product;
                // if (!!product) {
                    generateCountDown();
                // }
            }, timer);
        }
    }

    function updateCurrencyPrice(data) {
        if(!!_q('.discount-text .price')) {
            _q('.discount-text .price').innerText = data.fCurrency.replace('######', _q('.discount-text .price').innerText);
        }
    }

    function waitingOrderData() {
        utils.events.on('bindOrderPage', loadStatistical);
        utils.events.on('bindOrderPage', implementCoupon);
        utils.events.on('bindOrderPage', updateCurrencyPrice);
    }

    function listener() {
        onChangeWarranty();
        onChangeMonth();
        onChangeYear();
        onClickInputSelect();
        handleExitPopupEvents();
        changePlaceholderInput();
        onFocusCreditCard();
    }

    function initial() {
        waitingOrderData();
        adjustLayout();
        implementYearDropdown();
        implementMonthDropdown();
        setExpirationValue();
        checkIsSpecialItem();
        listener();
    }

    window.addEventListener('load', () => {
        if(!utils.readCookie('isHidePopup') && !isClickedInput) {
            popupTimed();
        }
    });
    document.addEventListener('DOMContentLoaded', () => {
        initial();
    });
})(window.utils);
