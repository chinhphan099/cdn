// Order ST
((utils) => {
    if (!utils) {
        console.log('utils module is not found');
        return;
    }

    const time_in_minutes = window.time_in_minutes ? Number(window.time_in_minutes) : 5;
    let mobileTimer;
    let couponDiscount;
    let typeCoupon;
    let fCurrency;
    let timedPopup;
    let timeinterval;
    let isPopupShowing = false;
    window.shippingIndex = 0;

    // Count down
    function timeRemaining(endtime) {
        const t = Date.parse(endtime) - Date.parse(new Date()),
            seconds = Math.floor((t / 1000) % 60),
            minutes = Math.floor((t / 1000 / 60) % 60);

        return {
            'total': t,
            'minutes': minutes,
            'seconds': seconds
        };
    }
    function handleCountDown(endtime) {
        function updateClock() {
            let t = timeRemaining(endtime);
            if (t.total < 0) {
                let timeCountElm = _q('.coupon-popup #timeCount');
                if (!!(timeCountElm.offsetWidth || timeCountElm.offsetHeight || timeCountElm.getClientRects().length)) {
                    _qById('close-expopup').click();
                }
                clearInterval(timeinterval);
                return;
            }

            const minuteElm = _q('.coupon-popup').querySelector('.ex-minute'),
                secondElm = _q('.coupon-popup').querySelector('.ex-second');
            t.minutes = t.minutes < 10 ? '0' + t.minutes : t.minutes.toString();
            t.seconds = t.seconds < 10 ? '0' + t.seconds : t.seconds.toString();

            t.minutes = t.minutes.split('').map(num => {
                return `<span>${num}</span>`;
            }).join('');
            t.seconds = t.seconds.split('').map(num => {
                return `<span>${num}</span>`;
            }).join('');

            minuteElm.innerHTML = t.minutes;
            secondElm.innerHTML = t.seconds;
        }
        updateClock();
        timeinterval = setInterval(updateClock, 1000);
    }
    function removeTimeText() {
        let timeTextElms = _qAll('.w_exit_popup .timetext');
        for (let timeTextElm of timeTextElms) {
            timeTextElm.parentNode.removeChild(timeTextElm);
        }

        let timeTextArray = [
            'within the next 5 minutes',
            'within the next 2 minutes'
        ];
        Array.prototype.slice.call(_qAll('.w_exit_popup p')).forEach(elm => {
            for (let timeText of timeTextArray) {
                if (elm.innerHTML.indexOf(timeText) > -1) {
                    elm.innerHTML = elm.innerHTML.replace(timeText, '');
                }
            }
        });
    }
    function generateCountDown() {
        if (!_q('.coupon-popup') || !!isPopupShowing) {
            return;
        }
        if (utils.getQueryParameter('timer') !== '0') {
            const countdownHTML = `
                <div id="timeCount">
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
                </div>
            `;
            _qById('couponBtn').insertAdjacentHTML('beforebegin', countdownHTML);
            utils.events.emit('beforeCountdown');

            // Begin Coutdown
            let currentTime = Date.parse(new Date()),
                deadline = new Date(currentTime + time_in_minutes * 60 * 1000);

            handleCountDown(deadline);
        }
        else {
            removeTimeText();
        }
        _q('.coupon-popup').style.display = 'block';
        isPopupShowing = true;
    }
    // End Count down

    function handleMouseOut(e) {
        if (!!isPopupShowing) {
            return;
        }
        if ((e.pageY - window.pageYOffset) <= 0) {
            document.removeEventListener('mouseout', handleMouseOut);
            generateCountDown();
        }
    }

    function handleTouchMove() {
        if (!!isPopupShowing) {
            return;
        }
        const mbTimer = !!window.pendingTimeOnMobile ? Number(window.pendingTimeOnMobile) * 1000 : 5000;
        window.removeEventListener('touchmove', handleTouchMove);
        mobileTimer = setTimeout(() => {
            generateCountDown();
        }, mbTimer);
    }

    function hidePopup(isOver) {
        isPopupShowing = false;
        if (!!_q('.coupon-popup')) {
            _q('.coupon-popup').style.display = 'none';
        }
        if (_qById('timeCount')) {
            _qById('timeCount').parentNode.removeChild(_qById('timeCount'));
        }
        if (!!_qById('couponBtn')) {
            _qById('couponBtn').disabled = false;
        }
        clearInterval(timeinterval);
        if (!!isOver) {
            clearTimeout(mobileTimer);
            clearTimeout(timedPopup);
            document.removeEventListener('mouseout', handleMouseOut);
            window.removeEventListener('touchmove', handleTouchMove);
        }
    }

    function getWarrantyPrice(taxes) {
        let wPrice = 0, wFormatPrice = false;

        if (!!_qById('txtProductWarranty') && _qById('txtProductWarranty').checked) {
            const checkedItem = _q('.productRadioListItem input:checked'),
                data = JSON.parse(checkedItem.dataset.product),
                warrantyRate = [0.1, 0.2, 0.2, 0.2, 0.2, 0.3, 0.5, 0.15, 0.25, 0.35, 0.4, 0.45, 0.55, 0.6],
                funnelId = _qById('txtProductWarranty').value,
                funnelPrice = warrantyRate[parseInt(funnelId) - 1];

            let warrantyPrice = (Math.round(100 * data.productPrices.DiscountedPrice.Value * funnelPrice) / 100).toFixed(2);
            wPrice = Number(warrantyPrice);

            wFormatPrice = utils.formatPrice(warrantyPrice, fCurrency, taxes);
        }

        return { wPrice, wFormatPrice };
    }

    function implementDeliveryOptions(data) {
        if (!_q('.delivery-options') || !_q('[name="deliveryOptions"]:checked')) {
            return;
        }

        // Add index into shippings data then ascending short shipping array base on price form low to high
        let shippings = data.shippings.map((obj, index) => {
            obj.index = index;
            return obj;
        }).sort(function (a, b) {
            return a.price - b.price;
        });

        // Set value for delivery options base on field index of Ascending array shipping
        const deliveryRadios = _qAll('.delivery-options input[type="radio"]');
        Array.prototype.slice.call(deliveryRadios).forEach((deliveryRadio, i) => {
            if (!shippings[i]) {
                return;
            }
            deliveryRadio.value = shippings[i].index;

            const shippingFees = _getClosest(deliveryRadio, '.w_radio').querySelectorAll('.shipping-fee');
            Array.prototype.slice.call(shippingFees).forEach(shippingFee => {
                shippingFee.querySelector('.js-img-loading').classList.add('hidden');
                let shippingFormated = shippings[i].formattedPrice;
                if (shippings[i].price === 0) {
                    shippingFormated = `<b>${js_translate.freeCap || 'FREE'}</b>`;
                }
                shippingFee.querySelector('.sf').innerHTML = shippingFormated;
            });
        });

        window.shippingIndex = Number(_q('[name="deliveryOptions"]:checked').value);
    }

    function onChangeDeliveryOptions() {
        const deliveryRadios = _qAll('.delivery-options input[type="radio"]');
        if (deliveryRadios.length === 0) {
            return;
        }
        Array.prototype.slice.call(deliveryRadios).forEach((deliveryRadio, i) => {
            deliveryRadio.addEventListener('click', () => {
                loadStatistical();
            });
        });
    }

    const productNameText = !!_q('.statistical .td-name') ? _q('.statistical .td-name').textContent : '';
    function loadStatistical(dataResponse) {
        if (!!dataResponse) { fCurrency = dataResponse.fCurrency; }
        if (!fCurrency) { return; }

        const checkedItem = _q('.productRadioListItem input:checked'),
            productItem = _getClosest(checkedItem, '.productRadioListItem'),
            data = JSON.parse(checkedItem.dataset.product),
            taxes = data.productPrices.Surcharge.FormattedValue;

        implementDeliveryOptions(data);
        let quantity = data.quantity;
        if (!!window.isDoubleQuantity) {
            quantity /= 2;
        }

        let shippingFee = data.shippings[window.shippingIndex].formattedPrice;
        if (data.shippings[window.shippingIndex].price === 0 && !!js_translate.freeCap) {
            shippingFee = `<b>${js_translate.freeCap}</b>`;
        }

        Array.prototype.slice.call(_qAll('.td-name')).forEach(tdNameElm => {
            tdNameElm.innerHTML = productNameText + ' ' + productItem.querySelector('.product-name p').innerHTML.replace(/&nbsp;/gi, ' ');
            if (!!window.additionTextSumary && _q('.statistical').classList.contains('coupon-actived')) {
                if (!!tdNameElm.querySelector('.text-coupon')) {
                    tdNameElm.querySelector('.text-coupon').parentNode.removeChild(tdNameElm.querySelector('.text-coupon'));
                }
                tdNameElm.insertAdjacentHTML('beforeend', ' ' + window.additionTextSumary.replace('{priceCoupon}', fCurrency.replace('######', window.couponValue)));
            }
        });

        Array.prototype.slice.call(_qAll('.td-price')).forEach(tdPriceElm => {
            if (!!window.isPreOrder && !!data.productPrices.hasOwnProperty('PreSaleAmount1')) {
                if (!!window.removeCurrencySymbol) {
                    tdPriceElm.innerText = data.productPrices.PreSaleAmount1.Value;
                }
                else {
                    tdPriceElm.innerText = data.productPrices.PreSaleAmount1.FormattedValue;
                }
            }
            else {
                if (!!window.removeCurrencySymbol) {
                    tdPriceElm.innerText = data.productPrices.DiscountedPrice.Value;
                }
                else {
                    // tdPriceElm.innerText = data.productPrices.DiscountedPrice.FormattedValue;
                    tdPriceElm.innerText = utils.formatPrice(data.productPrices.DiscountedPrice.Value.toFixed(2), fCurrency, taxes);
                }
            }
        });

        Array.prototype.slice.call(_qAll('.td-shipping')).forEach(shippingElm => {
            shippingElm.innerHTML = shippingFee;
        });

        Array.prototype.slice.call(_qAll('.total-full-price')).forEach(totalFullPriceElm => {
            if (!!window.isPreOrder) {
                if (!!data.productPrices.hasOwnProperty('PreSaleAmount1')) {
                    totalFullPriceElm.innerText = utils.formatPrice((data.productPrices.DiscountedPrice.Value + data.shippings[window.shippingIndex].price - data.productPrices.PreSaleAmount1.Value).toFixed(2), fCurrency, taxes);
                }
                else {
                    totalFullPriceElm.innerText = utils.formatPrice((data.productPrices.FullRetailPrice.Value + data.shippings[window.shippingIndex].price).toFixed(2), fCurrency, taxes);
                }
            }
            else {
                totalFullPriceElm.innerText = utils.formatPrice((data.productPrices.DiscountedPrice.Value + data.shippings[window.shippingIndex].price).toFixed(2), fCurrency, taxes);
            }
        });

        Array.prototype.slice.call(_qAll('.total-full-price-no-currency')).forEach(totalFullPriceElm => {
            totalFullPriceElm.innerText = (data.productPrices.FullRetailPrice.Value + data.shippings[window.shippingIndex].price).toFixed(0);
        });

        Array.prototype.slice.call(_qAll('.quantity-item')).forEach(quantityElm => {
            quantityElm.innerText = quantity;
        });

        Array.prototype.slice.call(_qAll('.statistical .td-taxes-fees')).forEach(taxElm => {
            taxElm.innerText = taxes;
        });

        let warranty = getWarrantyPrice(taxes),
            grandTotal = data.shippings[window.shippingIndex].price + data.productPrices.DiscountedPrice.Value + warranty.wPrice;

        if (!!window.isPreOrder && !data.productPrices.hasOwnProperty('PreSaleAmount1')) {
            grandTotal += data.productPrices.FullRetailPrice.Value;
        }

        if (!!_q('.tr-warranty')) {
            let trWarranty = _q('.tr-warranty');
            trWarranty.parentNode.removeChild(trWarranty);
        }

        if (!!warranty.wFormatPrice) {
            let trShipping = _getClosest(_q('.statistical .td-shipping'), 'tr'),
                warrantyHTML = `
                <tr class="tr-warranty">
                    <td>${js_translate.warranty || 'Warranty:'}</td>
                    <td>${warranty.wFormatPrice}</td>
                </tr>
                `;

            trShipping.insertAdjacentHTML('afterend', warrantyHTML);
        }

        Array.prototype.slice.call(_qAll('.grand-total')).forEach(grandTotalElm => {
            grandTotalElm.innerText = utils.formatPrice(grandTotal.toFixed(2), fCurrency, taxes);
        });

        Array.prototype.slice.call(_qAll('.jsFullPrice, .depositFullPrice')).forEach(jsFullPrice => {
            if (!window.isPreOrder || !!data.productPrices.hasOwnProperty('PreSaleAmount1')) {
                jsFullPrice.innerText = data.productPrices.FullRetailPrice.FormattedValue;
            }
            else {
                jsFullPrice.innerText = utils.formatPrice((data.productPrices.FullRetailPrice.Value + data.productPrices.DiscountedPrice.Value).toFixed(2), fCurrency, taxes);
            }
        });

        Array.prototype.slice.call(_qAll('.depositEachPrice, .jsUnitDiscountedPrice')).forEach(eachPrice => {
            if (!window.isPreOrder || !!data.productPrices.hasOwnProperty('PreSaleAmount1')) {
                eachPrice.innerText = utils.formatPrice((data.productPrices.DiscountedPrice.Value / quantity).toFixed(2), fCurrency, taxes);
            }
            else {
                eachPrice.innerText = utils.formatPrice(((data.productPrices.FullRetailPrice.Value + data.productPrices.DiscountedPrice.Value) / quantity).toFixed(2), fCurrency, taxes);
            }
        });

        Array.prototype.slice.call(_qAll('.discount-total')).forEach(discountTotal => {
            if (!!window.isPreOrder && !data.productPrices.hasOwnProperty('PreSaleAmount1')) {
                discountTotal.innerHTML = '-' + utils.formatPrice(Math.round(data.productPrices.SavePrice.Value), fCurrency, taxes);
            }
            else {
                discountTotal.innerHTML = '-' + data.productPrices.SavePrice.FormattedValue;
            }
        });

        Array.prototype.slice.call(_qAll('.discount-total-1')).forEach(discountTotal => {
            if (!!window.isPreOrder && !data.productPrices.hasOwnProperty('PreSaleAmount1')) {
                discountTotal.innerHTML = utils.formatPrice(Math.round(data.productPrices.SavePrice.Value), fCurrency, taxes);
            }
            else {
                discountTotal.innerHTML = data.productPrices.SavePrice.FormattedValue;
            }
        });

        let percent = parseInt(data.productPrices.DiscountedPrice.Value * 100 / data.productPrices.FullRetailPrice.Value);
        if (!!_q('.discount-percent')) {
            _q('.discount-percent').innerHTML = percent + '%';
        }

        if (data.productTypeName.toLocaleLowerCase() === 'coupon') {
            utils.localStorage().set('isActivationCode', 'true');
        }
        else {
            utils.localStorage().set('isActivationCode', 'false');
        }
    }

    let isClickedInput = false;
    function onClickInputSelect() {
        Array.prototype.slice.call(_qAll('input')).forEach(input => {
            input.addEventListener('change', (e) => {
                if (!!e.target.dataset.product) {
                    loadStatistical();
                }
                /*
                    - setup wasteClick -
                    window.isWasteClick = true; // 1. set value
                    _q('.productRadioListItem.item-3 .js-unitDiscountRate').click(); // 2. Trigger Event here
                    _q('body').classList.add('wasteClick'); // 3. Add class
                */
                if ((!!utils.getQueryParameter('temp') || !!utils.getQueryParameter('qt') || !!window.isWasteClick) && !_q('body').classList.contains('wasteClick')) {
                    console.log('wasteClick');
                    return;
                }
                isClickedInput = true;
                hidePopup(true);
            }, false);
        });

        Array.prototype.slice.call(_qAll('select')).forEach(select => {
            select.addEventListener('click', function () {
                isClickedInput = true;
                hidePopup(true);
            });
        });
    }

    function onChangeWarranty() {
        if (!_qById('txtProductWarranty')) return;

        _qById('txtProductWarranty').addEventListener('change', function () {
            loadStatistical();
        });
    }

    // Month and Year Dropdown
    function implementYearDropdown() {
        if (!_qById('yearddl')) return;

        const d = new Date(),
            curYear = d.getFullYear(),
            endYear = curYear + 20;

        for (let i = curYear; i < endYear; i++) {
            let opt = document.createElement('option');
            opt.value = i;
            opt.text = i;
            _qById('yearddl').appendChild(opt);
        }
    }
    function implementMonthDropdown() {
        if (!_qById('monthddl') || !_qById('yearddl')) return;

        const d = new Date(),
            curYear = d.getFullYear(),
            curMonth = d.getMonth() + 1,
            monthDdl = _qById('monthddl');

        if (_qById('yearddl').value === curYear.toString() && Number(monthDdl.value) < curMonth) {
            monthDdl.value = (curMonth < 10 ? ('0' + curMonth.toString()) : curMonth);
        }
    }
    function setExpirationValue() {
        if (!_qById('monthddl') || !_qById('yearddl') || !_qById('creditcard_expirydate')) return;

        _qById('creditcard_expirydate').value = _qById('monthddl').value + '/' + _qById('yearddl').value.toString().substr(2);
    }
    function onChangeMonth() {
        if (!_qById('monthddl')) return;

        _qById('monthddl').addEventListener('change', function () {
            const currentMonth = new Date().getMonth() + 1,
                currentYear = new Date().getFullYear(),
                monthSelected = Number(_qById('monthddl').value),
                yearSelected = Number(_qById('yearddl').value);

            if (monthSelected < currentMonth && currentYear === yearSelected) {
                _qById('yearddl').value = yearSelected + 1;
            }
            setExpirationValue();
        }, false);
    }
    function onChangeYear() {
        if (!_qById('yearddl')) return;

        _qById('yearddl').addEventListener('change', function () {
            implementMonthDropdown();
            setExpirationValue();
        }, false);
    }
    // End Month and Year Dropdown

    function reRenderAllPrice(tmpDiscount) {
        try {
            window.PRICES = window.PRICES.map(dataProduct => {
                let discount = tmpDiscount;
                let currentPrice = dataProduct.productPrices.DiscountedPrice.Value,
                    quantity = dataProduct.quantity;

                if (window.isDoubleQuantity) {
                    quantity /= 2;
                }

                if (!!window.isPreOrder && !dataProduct.productPrices.hasOwnProperty('PreSaleAmount1')) {
                    currentPrice = dataProduct.productPrices.FullRetailPrice.Value;
                    if (typeCoupon !== 'Money Amount') {
                        discount = (currentPrice + dataProduct.productPrices.DiscountedPrice.Value) * discount / 100;
                    }
                    dataProduct.productPrices.FullRetailPrice.Value = Number((currentPrice - discount).toFixed(2));
                    dataProduct.productPrices.FullRetailPrice.FormattedValue = utils.formatPrice(dataProduct.productPrices.FullRetailPrice.Value, fCurrency, dataProduct.shippings[0].formattedPrice);
                }
                else {
                    if (typeCoupon !== 'Money Amount') {
                        discount = currentPrice * discount / 100;
                    }
                    dataProduct.productPrices.DiscountedPrice.Value = Number((currentPrice - discount).toFixed(2));
                    dataProduct.productPrices.DiscountedPrice.FormattedValue = utils.formatPrice(dataProduct.productPrices.DiscountedPrice.Value, fCurrency, dataProduct.shippings[0].formattedPrice);
                }

                if (!window.isPreOrder || !!dataProduct.productPrices.hasOwnProperty('PreSaleAmount1')) {
                    if (!!dataProduct.productPrices.UnitDiscountRate) {
                        dataProduct.productPrices.UnitDiscountRate.Value = Number((dataProduct.productPrices.DiscountedPrice.Value / quantity).toFixed(2));
                        dataProduct.productPrices.UnitDiscountRate.FormattedValue = utils.formatPrice(dataProduct.productPrices.UnitDiscountRate.Value, fCurrency, dataProduct.shippings[0].formattedPrice);
                    }
                }
                else {
                    dataProduct.productPrices.UnitDiscountRate.Value = Number(((dataProduct.productPrices.FullRetailPrice.Value + dataProduct.productPrices.DiscountedPrice.Value) / quantity).toFixed(2));
                    dataProduct.productPrices.UnitDiscountRate.FormattedValue = utils.formatPrice(dataProduct.productPrices.UnitDiscountRate.Value, fCurrency, dataProduct.shippings[0].formattedPrice);
                }

                return dataProduct;
            });
        }
        catch (e) {
            console.log(e);
        }
    }

    function reImplementProductList(tmpDiscount) {
        const items = _qAll('.productRadioListItem input');
        for (let i = 0, n = items.length; i < n; i++) {
            let discount = tmpDiscount;
            if (!!items[i].dataset.product) {
                let dataProduct = JSON.parse(items[i].dataset.product),
                    productRadioItem = _getClosest(items[i], '.productRadioListItem'),
                    currentPrice = dataProduct.productPrices.DiscountedPrice.Value,
                    currentPriceFormat = dataProduct.productPrices.DiscountedPrice.FormattedValue,
                    quantity = dataProduct.quantity;

                if (window.isDoubleQuantity) {
                    quantity /= 2;
                }

                if (!!window.isPreOrder && !dataProduct.productPrices.hasOwnProperty('PreSaleAmount1')) {
                    currentPrice = dataProduct.productPrices.FullRetailPrice.Value;
                    if (typeCoupon !== 'Money Amount') {
                        discount = (currentPrice + dataProduct.productPrices.DiscountedPrice.Value) * discount / 100;
                    }
                    dataProduct.productPrices.FullRetailPrice.Value = Number((currentPrice - discount).toFixed(2));
                    dataProduct.productPrices.FullRetailPrice.FormattedValue = utils.formatPrice(dataProduct.productPrices.FullRetailPrice.Value, fCurrency, dataProduct.shippings[0].formattedPrice);
                }
                else {
                    if (typeCoupon !== 'Money Amount') {
                        discount = currentPrice * discount / 100;
                    }
                    dataProduct.productPrices.DiscountedPrice.Value = Number((currentPrice - discount).toFixed(2));
                    dataProduct.productPrices.DiscountedPrice.FormattedValue = utils.formatPrice(dataProduct.productPrices.DiscountedPrice.Value, fCurrency, dataProduct.shippings[0].formattedPrice);
                }

                if (!window.isPreOrder || !!dataProduct.productPrices.hasOwnProperty('PreSaleAmount1')) {
                    if (!!dataProduct.productPrices.UnitDiscountRate) {
                        dataProduct.productPrices.UnitDiscountRate.Value = Number((dataProduct.productPrices.DiscountedPrice.Value / quantity).toFixed(2));
                        dataProduct.productPrices.UnitDiscountRate.FormattedValue = utils.formatPrice(dataProduct.productPrices.UnitDiscountRate.Value, fCurrency, dataProduct.shippings[0].formattedPrice);
                    }
                }
                else {
                    dataProduct.productPrices.UnitDiscountRate.Value = Number(((dataProduct.productPrices.FullRetailPrice.Value + dataProduct.productPrices.DiscountedPrice.Value) / quantity).toFixed(2));
                    dataProduct.productPrices.UnitDiscountRate.FormattedValue = utils.formatPrice(dataProduct.productPrices.UnitDiscountRate.Value, fCurrency, dataProduct.shippings[0].formattedPrice);
                }

                dataProduct.productPrices.SavePrice = dataProduct.productPrices.SavePrice || {};
                dataProduct.productPrices.SavePrice.Value = Number((dataProduct.productPrices.SavePrice.Value + discount).toFixed(2));
                dataProduct.productPrices.SavePrice.FormattedValue = utils.formatPrice(dataProduct.productPrices.SavePrice.Value, fCurrency, dataProduct.shippings[0].formattedPrice);

                Array.prototype.slice.call(productRadioItem.querySelectorAll('.discountedPrice')).forEach(priceElm => {
                    let discountedPriceValue = dataProduct.productPrices.DiscountedPrice.Value;
                    if (!!window.isPreOrder && !dataProduct.productPrices.hasOwnProperty('PreSaleAmount1')) {
                        // Se bi loi o pre-order cu vi discount la charge lan 1
                        // discountedPriceValue = discountedPriceValue + dataProduct.productPrices.FullRetailPrice.Value;
                    }
                    priceElm.innerHTML = `${utils.formatPrice(discountedPriceValue.toFixed(2), fCurrency, dataProduct.productPrices.FullRetailPrice.FormattedValue)} <del style="color: grey; font-size: 0.9em; font-weight: normal;">${currentPriceFormat}</del>`;
                });

                Array.prototype.slice.call(productRadioItem.querySelectorAll('.spanUnitDiscountRate')).forEach(unitPriceElm => {
                    unitPriceElm.innerHTML = dataProduct.productPrices.UnitDiscountRate.FormattedValue;
                });

                Array.prototype.slice.call(productRadioItem.querySelectorAll('.savePrice')).forEach(savePrice => {
                    let savePriceFormat = utils.formatPrice(dataProduct.productPrices.SavePrice.Value.toFixed(2), fCurrency, dataProduct.productPrices.SavePrice.FormattedValue);

                    if (!!window.removeCurrencySymbol) {
                        savePriceFormat = dataProduct.productPrices.SavePrice.Value;
                    }
                    savePrice.innerHTML = savePriceFormat;
                });

                Array.prototype.slice.call(productRadioItem.querySelectorAll('.savePriceDeposit')).forEach(savePrice => {
                    let savePriceFormat = utils.formatPrice(Math.round(dataProduct.productPrices.SavePrice.Value), fCurrency, dataProduct.productPrices.SavePrice.FormattedValue);

                    if (!!window.removeCurrencySymbol) {
                        savePriceFormat = Math.round(dataProduct.productPrices.SavePrice.Value);
                    }
                    savePrice.innerHTML = savePriceFormat;
                });

                Array.prototype.slice.call(productRadioItem.querySelectorAll('.spanTotalDiscountPriceElm')).forEach(totalDiscountPrice => {
                    let totalDiscountPriceValue = dataProduct.productPrices.DiscountedPrice.Value;
                    if (!!window.isPreOrder && !dataProduct.productPrices.hasOwnProperty('PreSaleAmount1')) {
                        totalDiscountPriceValue = totalDiscountPriceValue + dataProduct.productPrices.FullRetailPrice.Value;
                    }
                    totalDiscountPrice.innerHTML = utils.formatPrice(totalDiscountPriceValue.toFixed(2), fCurrency, dataProduct.productPrices.FullRetailPrice.FormattedValue);
                });

                if (typeof window.implementPriceHTML === 'function') {
                    window.implementPriceHTML(dataProduct, quantity, true);
                }

                let nameElm = productRadioItem.querySelector('.product-name p');
                nameElm.innerHTML = `${nameElm.innerHTML} <span class="text-coupon">${window.additionText}</span>`;
                items[i].setAttribute('data-product', JSON.stringify(dataProduct));
            }
        }

        reRenderAllPrice(tmpDiscount);
        if (typeof window.extrapop !== 'undefined' && typeof window.extrapop.renderPrice === 'function') {
            window.extrapop.renderPrice();
        }
    }

    function getSelectedProduct() {
        const product = _q('input[name="product"]:checked').dataset.product;
        if (product) {
            return JSON.parse(product);
        }
        else {
            return null;
        }
    }

    function afterActiveCoupon() {
        if (_q('.coupon-apply')) {
            _q('.coupon-apply').style.display = 'block';
        }
        if (!!_q('.statistical')) {
            _q('.statistical').classList.add('coupon-actived');
        }
        if (!_q('.coupon-popup').classList.contains('coupon-popup-future')) {
            if (!_qById('couponCode')) {
                let couponCodeElm = document.createElement('input');
                couponCodeElm.id = 'couponCode';
                couponCodeElm.type = 'hidden';
                _q('body').appendChild(couponCodeElm);
            }
            _qById('couponCode').value = window.couponCodeId;

            reImplementProductList(couponDiscount);
        }
        else {
            utils.localStorage().set('additionTextConfirmName', window.additionTextSumary);
        }
        loadStatistical();

        // Installment
        const productInfo = getSelectedProduct();
        utils.events.emit('triggerInstallmentPayment', {
            discountPrice: productInfo.productPrices.DiscountedPrice.FormattedValue,
            discountPriceValue: productInfo.productPrices.DiscountedPrice.Value,
            fullPrice: productInfo.productPrices.FullRetailPrice.FormattedValue,
            fullPriceValue: productInfo.productPrices.FullRetailPrice.Value
        });

        // Warranty
        utils.events.emit('triggerWarranty', productInfo);
    }

    function getVisibleItems() {
        let visibleElms = [];
        const productItems = _qAll('.productRadioListItem');

        for (let item of productItems) {
            if (window.getComputedStyle(item).display !== 'none') {
                visibleElms.push(item);
            }
        }
        return visibleElms;
    }

    function showSpecialItem() {
        const selectedProd = _q('.productRadioListItem.checked-item');
        const specialProduct = _q('.productRadioListItem.special_offer');

        if (specialProduct) {
            if (_q('.coupon-apply')) {
                _q('.coupon-apply .title').innerText = js_translate.activeB2g1 || 'YOUR BUY 2 GET 1 FREE COUPON HAS BEEN APPROVED';
                _q('.coupon-apply').style.display = 'block';
            }
            const selected_default_text = selectedProd.querySelector('.best-seller-text');
            if (selected_default_text) {
                selected_default_text.parentNode.removeChild(selected_default_text);
            }

            // Remove class default for all visible item
            const visibleItems = getVisibleItems();
            for (let i = 0, n = visibleItems.length; i < n; i++) {
                visibleItems[i].classList.remove('default', 'special', 'checked-item');
                if (!!visibleItems[i].querySelector('.best-seller-text')) {
                    visibleItems[i].querySelector('.best-seller-text').parentNode.removeChild(visibleItems[i].querySelector('.best-seller-text'));
                }
            }

            specialProduct.classList.remove('hidden');
            specialProduct.classList.add('default');
            specialProduct.querySelector('input[type="radio"]').click();
        }
    }

    function activePackageGift() {
        //Check if have product for gift and holiday
        if (utils.getQueryParameter('pid') == 2 && _qAll('.js-list-group li').length > 2) {
            _qAll('.js-list-group li')[2].click();
        }
        else {
            _qAll('.js-list-group li')[1].click();
        }
        if (_q('.free-gift-apply')) {
            _q('.free-gift-apply').style.display = 'block';
        }
        utils.localStorage().set('isActiveFreeGift', 'true');
    }

    function onActiveCoupon() {
        utils.events.emit('onPrepareButtonEvent');
        _qById('couponBtn').classList.remove('disabled');
        _qById('couponBtn').addEventListener('click', (e) => {
            e.target.disabled = true;
            utils.events.emit('onActivePopup');
            let paramPidOne = utils.getQueryParameter('pid') == 1 && !!_q('.holiday');
            let paramPidTwo = utils.getQueryParameter('pid') == 2 && !!_q('.gift');
            if (!!_q('.w_exit_popup').classList.contains('gift-popup') && (paramPidOne || paramPidTwo)) {
                activePackageGift();
            }
            else if (!window.couponCodeId && !!_q('.w_exit_popup').classList.contains('coupon-popup-no-time')) {
                hidePopup(true);
                if (!!_q('.installment-box') && !_q('.installment-box').classList.contains('hidden')) {
                    _q('.installment-box').scrollIntoView({ behavior: 'smooth' });
                }
                else if (!!_q('.orderst-form') && !_q('.orderst-form').classList.contains('hidden')) {
                    _q('.orderst-form').scrollIntoView({ behavior: 'smooth' });
                }
                return;
            }
            else if (_q('.productRadioListItem.special_offer') && !_q('.w_exit_popup').classList.contains('coupon-popup-new')) {
                showSpecialItem();
            }
            else if (!!window.couponCodeId) {
                afterActiveCoupon();
                if (!!_qById('couponCode') && !!_qById('couponCode').value && !!window.couponValue) {
                    utils.localStorage().set('couponValue', window.couponValue);
                }
            }

            //Enable Maropost Setting ID After clicked Button Accept - Tu Nguyen
            if(!!window.maroPostSettingId){
                maroPostSettingId.isSelected = true;
            }

            loadStatistical();

            //Stop triggering close popup by flag - Tu nguyen
                //intial global variable to activate - window.isStopTriggerClosePopup = true/false.
            if(!!window.isStopTriggerClosePopup){
                utils.events.emit('stopTriggerClosePopup', hidePopup);
            } else {
                hidePopup(true);
            }
        }, false);
    }

    let isClicked = false;
    function onCloseExitPopup() {
        _qById('close-expopup').addEventListener('click', () => {
            hidePopup(isClicked);
            if (!isClicked) {
                isClicked = true;
            }
        }, false);

        Array.prototype.slice.call(_qAll('.w_exit_popup .close-popup-btn')).forEach(closePopupElm => {
            closePopupElm.addEventListener('click', () => {
                hidePopup(isClicked);
                if (!isClicked) {
                    isClicked = true;
                }
            }, false);
        });
    }

    function handleExitPopupEvents() {
        if (utils.getQueryParameter('iep') !== 'true' || !_q('.coupon-popup') || utils.getQueryParameter('et') === '1') {
            return;
        }
        let giftElm = _q('.gift-popup .gift');
        let holidayElm = _q('.gift-popup .holiday');
        if (utils.getQueryParameter('pid') == 2 && !!giftElm) {
            if (!!holidayElm) {
                holidayElm.classList.add('hidden');
            }
            _q('.gift-popup .only-coupon').classList.add('hidden');
            hiddenDefaultPopup();
        }
        else if (utils.getQueryParameter('pid') == 1 && !!holidayElm) {
            if (!!giftElm) {
                giftElm.classList.add('hidden');
            }
            _q('.gift-popup .only-coupon').classList.add('hidden');
            hiddenDefaultPopup();
        }
        else {
            if (!!holidayElm) {
                holidayElm.classList.add('hidden');
            }
            if (!!giftElm) {
                giftElm.classList.add('hidden');
            }
            let lbBtnGift = _q('.label-gift');
            if (!!lbBtnGift) {
                lbBtnGift.classList.add('hidden');
            }
        }

        if (utils.isDevice()) {
            window.addEventListener('touchmove', handleTouchMove);
        }
        else {
            document.addEventListener('mouseout', handleMouseOut);
        }
    }

    function hiddenDefaultPopup() {
        if (!!_q('.w_modal_header')) {
            _q('.w_modal_header').classList.add('hidden');
        }
        if (!!_q('.coupon-popup')) {
            _q('.coupon-popup').classList.add('show-gift');
        }
        if (!!_q('.label-coupon')) {
            _q('.label-coupon').classList.add('hidden');
        }
    }

    function adjustLayout() {
        if (_q('.productRadioListItem.special_offer') && utils.getQueryParameter('et') === '1') {
            showSpecialItem();
        }
        let billingEmail = _getClosest(_qById('billing_email'), '.form-group');
        if (!!billingEmail) {
            billingEmail.parentNode.removeChild(billingEmail);
        }

        let billingFullName = _q('.billing-full-name');
        if (!!billingFullName) {
            billingFullName.parentNode.removeChild(billingFullName);
        }

        let billingPhone = _getClosest(_qById('billing_phone'), '.form-group');
        if (!!billingPhone) {
            billingPhone.parentNode.removeChild(billingPhone);
        }
    }

    function changePlaceholderInput() {
        // For order of BR
        if (_q('.widget-shipping-form input#shipping_cep')) {
            _q('.widget-shipping-form input#shipping_cep').placeholder = 'Cep: 01310-000';
        }
    }

    function onFocusCreditCard() {
        // For order-v3
        if (_q('.step-4-wrap')) {
            _qById('creditcard_creditcardnumber').addEventListener('focus', () => {
                _q('.step-4-wrap').classList.remove('hidden');
            }, false);
        }
    }

    function popupTimed() {
        const timer = !!utils.getQueryParameter('timed') ? Number(utils.getQueryParameter('timed')) * 1000 : null;
        if (!!timer && !!_q('.coupon-popup')) {
            timedPopup = setTimeout(function () {
                generateCountDown();
            }, timer);
        }
    }

    function updateCurrencyPrice(data) {
        if (!!_q('.discount-text .price')) {
            _q('.discount-text .price').innerText = data.fCurrency.replace('######', _q('.discount-text .price').textContent);
        }
        const currencyItems = _qAll('.w_exit_popup .currency');
        for (const currencyItem of currencyItems) {
            currencyItem.innerText = utils.formatPrice(currencyItem.textContent, data.fCurrency, data.discountPrice);
        }
    }

    function implementCoupon(data) {
        fCurrency = data.fCurrency;
        if (!!window.couponCodeId && (utils.getQueryParameter('iep') === 'true' || !!_q('.nightowls') || !!_q('.gamefiedWrap')) && !!_q('.coupon-popup')) {
            if (!window.couponValue.trim()) {
                return;
            }
            let couponValFormat = window.couponValue;
            let couponVal = Number(couponValFormat.replace('%', ''));
            couponDiscount = couponVal;

            if (window.couponValue.indexOf('%') === -1) {
                typeCoupon = 'Money Amount';
                couponValFormat = utils.formatPrice(couponVal, fCurrency, data.shippingValue.toString());
            }
            const promoText = _q('.w_exit_popup .w_promo_text');
            if (!!promoText) {
                promoText.innerHTML = promoText.innerHTML.replace(/{couponPrice}/g, couponValFormat);
            }

            const couponApplyText = _q('.coupon-apply');
            if (!!couponApplyText) {
                couponApplyText.innerHTML = couponApplyText.innerHTML.replace(/{couponPrice}/g, couponValFormat);
            }

            // New Code
            const jsImageLoadings = _qAll('.w_exit_popup .js-img-loading');
            for (const jsImageLoading of jsImageLoadings) {
                jsImageLoading.innerText = couponValFormat;
            }
            window.additionText = window.additionText.replace(/{couponPrice}/g, couponValFormat);
            if (!!window.additionTextSumary) {
                window.additionTextSumary = window.additionTextSumary.replace(/{couponPrice}/g, couponValFormat);
            }

            if (!!_qById('couponBtn')) {
                onActiveCoupon();
            }
            if (!!_qById('close-expopup')) {
                onCloseExitPopup();
            }
        }
    }

    function waitingOrderData() {
        utils.events.on('bindOrderPage', loadStatistical);
        utils.events.on('bindOrderPage', implementCoupon);
        utils.events.on('bindOrderPage', updateCurrencyPrice);
    }
    waitingOrderData();

    function listener() {
        onChangeWarranty();
        onChangeMonth();
        onChangeYear();
        onClickInputSelect();
        onChangeDeliveryOptions();
        if (utils.getQueryParameter('loader') === '1') {
            utils.events.on('bindDoneLoader', handleExitPopupEvents);
        }
        else {
            handleExitPopupEvents();
        }
        changePlaceholderInput();
        onFocusCreditCard();
    }

    function hiddenElementByParamUrl() {
        //Hidden CountDown Timer in coupon box
        if (utils.getQueryParameter('timer') === '0') {
            _q('body').classList.add('timer-hidden');
        }

        //Hidden Comment in Banner
        if (utils.getQueryParameter('comment') === '0') {
            _q('body').classList.add('comment-hidden');
        }
    }

    function personalizationFirstName() {
        const firstName = utils.getQueryParameter('firstname');
        if (!firstName || !js_translate.personalizationText) {
            return;
        }

        const personalizationText = js_translate.personalizationText.replace(/firstName/gi, firstName).replace(/\%20/g, ' ');
        if (!!_q('.top-header .breakcrum')) {
            _q('.top-header .breakcrum').insertAdjacentHTML('afterBegin', `<div class="personalization" style="padding: 0 15px; margin-top: 20px; margin-bottom: -10px; font-size: 17px; line-height: 1.3; text-align: center; font-weight: 700;">${personalizationText}</div>`);
        }
        else if (!!_q('.steps .secure-checkout')) {
            _q('.steps .secure-checkout').insertAdjacentHTML('beforeBegin', `<div class="personalization" style="padding: 0 15px; margin-top: 20px; margin-bottom: 25px; font-size: 17px; line-height: 1.3; text-align: center; font-weight: 700;">${personalizationText}</div>`);
        }
        else if (!!_q('.js-sale-off-heading')) {
            _q('.js-sale-off-heading').insertAdjacentHTML('afterBegin', `<div class="personalization" style="padding: 0 15px; margin-top: 20px; margin-bottom: 25px; font-size: 17px; line-height: 1.3; text-align: center; font-weight: 700;">${personalizationText}</div>`);
        }
        else if (!!_q('.banner')) {
            _q('.banner').insertAdjacentHTML('afterBegin', `<div class="personalization" style="padding: 0 15px; margin-top: 20px; margin-bottom: 25px; font-size: 17px; line-height: 1.3; text-align: center; font-weight: 700;">${personalizationText}</div>`);
        }
    }

    function initial() {
        adjustLayout();
        implementYearDropdown();
        implementMonthDropdown();
        setExpirationValue();
        hiddenElementByParamUrl();
        personalizationFirstName();
        listener();
    }

    window.addEventListener('load', () => {
        if (!isClickedInput && utils.getQueryParameter('iep') !== '0') {
            popupTimed();
        }
    });
    document.addEventListener('DOMContentLoaded', () => {
        initial();
    });

    window.orderst = {
        handleExitPopupEvents: handleExitPopupEvents
    };
})(window.utils);
