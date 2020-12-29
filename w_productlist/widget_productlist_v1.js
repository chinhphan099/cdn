(function (utils) {
    if (!utils || !window.siteSetting) {
        console.log('utils or window.siteSetting not found');
        return;
    }

    window.isNotCallApiUpsell = true;
    window.widget = window.widget ? window.widget : {};
    let retailPriceDepositOneUnit = 1;

    function q(selector) {
        var qSelector = _qAll(selector);

        return {
            addClass: function (className) {
                for (let elm of qSelector) {
                    elm.classList.add(className);
                }
            },
            removeClass: function (className) {
                for (let elm of qSelector) {
                    elm.classList.remove(className);
                }
            }
        };
    }

    function replaceUserString() {
        if (_qById('js-widget-products')) {
            const unitDiscountRateLables = _qAll('.js-unitDiscountRate');
            if (unitDiscountRateLables) {
                for (let elem of unitDiscountRateLables) {
                    elem.innerHTML = elem.innerHTML
                        .replace(/{UnitDiscountRate}/gi, `<span class="spanUnitDiscountRate"></span>`)
                        .replace(/{UnitFullRate}/gi, '<span class="spanUnitFullRate"></span>')
                        .replace(/{DiscountedPrice}/gi, `<span class="discountedPrice"></span>`)
                        .replace(/{SavePrice}/gi, `<span class="savePrice"></span>`)
                        .replace(/{ShippingFee}/gi, '<span class="jsShippingFee"></span>')
                        .replace(/{FullPrice}/gi, `<del class="fullPrice"></del>`);
                }
            }
        }
    }
    replaceUserString();

    function setHighlightItem() {
        try {
            const defaultItems = _qAll('.productRadioListItem.checked-item');
            Array.prototype.slice.call(defaultItems).forEach(item => {
                item.classList.add('highlight-item');
            });

            const pid = _qById('hdfSelectedProduct').value;
            const ulist = _q('[data-packagedisplay]');
            if (ulist) {
                let defaultPackage = ulist.dataset.packagedisplay.replace(/ /g, '').split(',');
                const index = defaultPackage.indexOf(pid);
                const packageList = ulist.querySelectorAll('li');
                Array.prototype.slice.call(packageList).forEach(item => {
                    let itemPackage = item.dataset.package.replace(/ /g, '').split(',');
                    const itemPid = itemPackage[index];
                    _qById(`product_${itemPid}`).closest('.productRadioListItem').classList.add('highlight-item')
                });
            }
        }
        catch(e) {
            console.log(e);
        }
    }
    setHighlightItem();

    function afterActiveCoupon(input, couponValFormat) {
        const couponApplyText = _q('.coupon-apply');
        const parentItem = _getClosest(input, '.productRadioListItem');
        if (!!couponApplyText) {
            couponApplyText.innerHTML = couponApplyText.innerHTML.replace(/{couponPrice}/g, couponValFormat);
            _q('.coupon-apply').style.display = 'block';
        }

        if (!!parentItem.querySelector('.product-name') && !!window.additionText) {
            window.additionText = window.additionText.replace(/{couponPrice}/g, couponValFormat);
            const nameElm = parentItem.querySelector('.product-name p');
            nameElm.innerHTML = `${nameElm.innerHTML} ${window.additionText}`;
        }
    }

    function applyCouponCode(product) {
        let activeCouponFrom = Number(utils.getQueryParameter('activeFrom') || window.activeFrom);
        let quantity = product.quantity;
        if (!!window.isDoubleQuantity) {
            quantity /= 2;
        }
        if (typeof activeCouponFrom === 'number' && activeCouponFrom > product.productPrices.DiscountedPrice.Value) {
            return product;
        }

        let discountedPrice;
        const shippingFee = product.shippings[0].formattedPrice;
        const couponValue = Number(utils.getQueryParameter('couponValue').replace('percent', ''));
        let couponValFormat = utils.formatPrice(couponValue, window.fCurrency, shippingFee);
        if (utils.getQueryParameter('couponValue').indexOf('percent') > -1) {
            couponValFormat = utils.getQueryParameter('couponValue').replace('percent', '%');
            discountedPrice = (product.productPrices.DiscountedPrice.Value * (100 - couponValue) / 100).toFixed(2);
        }
        else {
            discountedPrice = (product.productPrices.DiscountedPrice.Value - couponValue).toFixed(2);
        }
        product.productPrices.DiscountedPrice.Value = Number(discountedPrice);
        product.productPrices.DiscountedPrice.FormattedValue = utils.formatPrice(discountedPrice, window.fCurrency, shippingFee);
        product.productPrices.UnitDiscountRate.Value = Number((discountedPrice / quantity).toFixed(2));
        product.productPrices.UnitDiscountRate.FormattedValue = utils.formatPrice(product.productPrices.UnitDiscountRate.Value.toFixed(2), window.fCurrency, shippingFee);

        afterActiveCoupon(_qById('product_' + product.productId), couponValFormat);

        return product;
    }

    function implementPriceHTML(product, quantity, isRefiredPrice = false) {
        // This function will be recalled from order-st.page.js - After active Coupon
        Array.prototype.slice.call(_qAll(`.discountedPrice_${quantity}, .depositFirstChargePrice_${quantity}`)).forEach(elm => {
            if ((!!elm.classList.contains('fired-price') && !isRefiredPrice) || !!elm.classList.contains('is-refired')) {
                return;
            }
            elm.classList.add('fired-price');
            if (!!isRefiredPrice) {
                elm.classList.add('is-refired');
            }

            if (!!window.isPreOrder && !!product.productPrices.hasOwnProperty('PreSaleAmount1')) {
                if (!!window.removeCurrencySymbol) {
                    elm.textContent = product.productPrices.PreSaleAmount1.Value;
                }
                else {
                    elm.textContent = utils.formatPrice(product.productPrices.PreSaleAmount1.Value, window.fCurrency, product.productPrices.PreSaleAmount1.FormattedValue);
                }
            }
            else {
                if (!!window.removeCurrencySymbol) {
                    elm.textContent = product.productPrices.DiscountedPrice.Value;
                }
                else {
                    elm.textContent = utils.formatPrice(product.productPrices.DiscountedPrice.Value, window.fCurrency, product.productPrices.DiscountedPrice.FormattedValue);
                }
            }
        });

        Array.prototype.slice.call(_qAll(`.savePrice_${quantity}, .depositSavePrice_${quantity}`)).forEach(elm => {
            if ((!!elm.classList.contains('fired-price') && !isRefiredPrice) || !!elm.classList.contains('is-refired')) {
                return;
            }
            elm.classList.add('fired-price');
            if (!!isRefiredPrice) {
                elm.classList.add('is-refired');
            }

            if (!!window.removeCurrencySymbol) {
                elm.textContent = product.productPrices.SavePrice.Value;
            }
            else {
                elm.textContent = product.productPrices.SavePrice.FormattedValue;
            }
        });

        Array.prototype.slice.call(_qAll(`.shortSavePrice_${quantity}, .depositShortSavePrice_${quantity}`)).forEach(elm => {
            if ((!!elm.classList.contains('fired-price') && !isRefiredPrice) || !!elm.classList.contains('is-refired')) {
                return;
            }
            elm.classList.add('fired-price');
            if (!!isRefiredPrice) {
                elm.classList.add('is-refired');
            }

            if (!!window.removeCurrencySymbol) {
                elm.textContent = Math.round(product.productPrices.SavePrice.Value);
            }
            else {
                elm.textContent = utils.formatPrice(Math.round(product.productPrices.SavePrice.Value), window.fCurrency, product.productPrices.DiscountedPrice.FormattedValue);
            }
        });

        Array.prototype.slice.call(_qAll(`.eachPrice_${quantity}, .depositEachPrice_${quantity}`)).forEach(elm => {
            if ((!!elm.classList.contains('fired-price') && !isRefiredPrice) || !!elm.classList.contains('is-refired')) {
                return;
            }
            elm.classList.add('fired-price');
            if (!!isRefiredPrice) {
                elm.classList.add('is-refired');
            }

            if (!window.isPreOrder || !!product.productPrices.hasOwnProperty('PreSaleAmount1')) {
                if (!!window.removeCurrencySymbol) {
                    elm.textContent = (product.productPrices.DiscountedPrice.Value / quantity).toFixed(2);
                }
                else {
                    elm.textContent = utils.formatPrice((product.productPrices.DiscountedPrice.Value / quantity).toFixed(2), window.fCurrency, product.productPrices.DiscountedPrice.FormattedValue);
                }
            }
            else {
                if (!!window.removeCurrencySymbol) {
                    elm.textContent = ((product.productPrices.FullRetailPrice.Value + product.productPrices.DiscountedPrice.Value) / quantity).toFixed(2);
                }
                else {
                    elm.textContent = utils.formatPrice(((product.productPrices.FullRetailPrice.Value + product.productPrices.DiscountedPrice.Value) / quantity).toFixed(2), window.fCurrency, product.productPrices.DiscountedPrice.FormattedValue);
                }
            }
        });

        Array.prototype.slice.call(_qAll(`.shortEachPrice_${quantity}, .depositShortEachPrice_${quantity}`)).forEach(elm => {
            if ((!!elm.classList.contains('fired-price') && !isRefiredPrice) || !!elm.classList.contains('is-refired')) {
                return;
            }
            elm.classList.add('fired-price');
            if (!!isRefiredPrice) {
                elm.classList.add('is-refired');
            }

            if (!window.isPreOrder || !!product.productPrices.hasOwnProperty('PreSaleAmount1')) {
                if (!!window.removeCurrencySymbol) {
                    elm.textContent = Math.round(product.productPrices.DiscountedPrice.Value / quantity);
                }
                else {
                    elm.textContent = utils.formatPrice(Math.round(product.productPrices.DiscountedPrice.Value / quantity), window.fCurrency, product.productPrices.DiscountedPrice.FormattedValue);
                }
            }
            else {
                if (!!window.removeCurrencySymbol) {
                    elm.textContent = Math.round((product.productPrices.FullRetailPrice.Value + product.productPrices.DiscountedPrice.Value) / quantity);
                }
                else {
                    elm.textContent = utils.formatPrice(Math.round((product.productPrices.FullRetailPrice.Value + product.productPrices.DiscountedPrice.Value) / quantity), window.fCurrency, product.productPrices.DiscountedPrice.FormattedValue);
                }
            }
        });
    }

    function generatePriceForDeposit(product) {
        try {
            let quantity = product.quantity;
            if (window.isDoubleQuantity) {
                quantity /= 2;
            }
            if (quantity === 1) {
                retailPriceDepositOneUnit = (product.productPrices.FullRetailPrice.Value + product.productPrices.DiscountedPrice.Value) / 0.65; // 100% - 35%
            }

            let retailPriceDeposit = retailPriceDepositOneUnit * quantity;
            let totalPriceDeposit = product.productPrices.DiscountedPrice.Value + product.productPrices.FullRetailPrice.Value;

            product.productPrices.SavePrice = {};
            product.productPrices.SavePrice.Value = Math.abs(Number((retailPriceDeposit - totalPriceDeposit).toFixed(2)));
            product.productPrices.SavePrice.FormattedValue = utils.formatPrice(product.productPrices.SavePrice.Value, window.fCurrency, product.shippings[0].formattedPrice);

            product.productPrices.FullRetailPriceDeposit = {};
            product.productPrices.FullRetailPriceDeposit.Value = Number((totalPriceDeposit + product.productPrices.SavePrice.Value).toFixed(2));
            product.productPrices.FullRetailPriceDeposit.FormattedValue = utils.formatPrice(product.productPrices.FullRetailPriceDeposit.Value, window.fCurrency, product.shippings[0].formattedPrice);
        }
        catch (e) {
            console.log(e);
        }

        return product;
    }

    function generateSavePrices(product) {
        try {
            let quantity = product.quantity;
            if (window.isDoubleQuantity) {
                quantity /= 2;
            }

            product.productPrices.SavePrice = {};
            product.productPrices.SavePrice.Value = Number((product.productPrices.FullRetailPrice.Value - product.productPrices.DiscountedPrice.Value).toFixed(2));
            product.productPrices.SavePrice.FormattedValue = utils.formatPrice(product.productPrices.SavePrice.Value.toFixed(2), window.fCurrency, product.shippings[0].formattedPrice);
        }
        catch (e) {
            console.log(e);
        }
        return product;
    }

    function checkDoubleQuantity() {
        try {
            let ids = [];
            Array.prototype.slice.call(_qAll('input[name="product"]')).forEach(item => {
                ids = [...ids, Number(item.value)];
            });
            if (!!_q('.js-list-group li')) {
                if (!!_q('.js-list-group li.active')) {
                    ids = _q('.js-list-group li.active').dataset.package.split(',').map(num => {
                        return parseInt(num);
                    });
                }
                else {
                    ids = _q('.js-list-group ul').dataset.packagedisplay.split(',').map(num => {
                        return parseInt(num);
                    });
                }
            }

            if (!window.PRICES) {
                return;
            }

            const packagePrices = window.PRICES.filter(price => {
                return ids.includes(price.productId);
            });
            const ascShortPrices = [...packagePrices].sort((a, b) => {
                return a.quantity - b.quantity;
            });

            let doubleFlag = true;
            for (let i = 0, n = ascShortPrices.length; i < n; i++) {
                if (n < 2) {
                    // Check for case each product belong a tab
                    doubleFlag = false;
                    break;
                }
                if (ascShortPrices[i].quantity % 2 !== 0) {
                    doubleFlag = false;
                    break;
                }
            }

            if (doubleFlag) {
                window.isDoubleQuantity = true;
                if (window.location.pathname.indexOf('special-offer-') === -1) {
                    setTimeout(() => {
                        utils.localStorage().set('doubleQuantity', 'true');
                    }, 600);
                }
            }
            else {
                window.isDoubleQuantity = false;
                if (window.location.pathname.indexOf('special-offer-') === -1) { // Check for upsell page
                    utils.localStorage().remove('doubleQuantity');
                }
            }
        }
        catch (e) {
            console.log(e);
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

    function handleProductChange() {
        const productInfo = getSelectedProduct();
        utils.events.emit('triggerWarranty', productInfo);
        utils.events.emit('triggerInstallmentPayment', {
            discountPrice: productInfo.productPrices.DiscountedPrice.FormattedValue,
            discountPriceValue: productInfo.productPrices.DiscountedPrice.Value,
            fullPrice: productInfo.productPrices.FullRetailPrice.FormattedValue,
            fullPriceValue: productInfo.productPrices.FullRetailPrice.Value
        });

        if (_qById('js-widget-products').dataset.activeclass !== undefined) {
            q('.productRadioListItem.checked-item').removeClass('checked-item');
            _getClosest(this, '.productRadioListItem').classList.add('checked-item');
        }
    }

    function getDefaultSelectedProduct() {
        let result = null;
        try {
            let product = JSON.parse(_qById('product_' + _qById('hdfSelectedProduct').value).dataset.product),
                shippingValue = 0,
                priceShipping = window.js_translate ? window.js_translate.free || 'free' : 'free';

            if (product.shippings.length > 0 && product.shippings[0] !== 0) {
                shippingValue = product.shippings[0].price;
                priceShipping = product.shippings[0].formattedPrice;
            }

            result = {
                shippingValue: shippingValue,
                priceShipping: priceShipping,
                discountPrice: product.productPrices.DiscountedPrice.FormattedValue,
                discountPriceValue: product.productPrices.DiscountedPrice.Value,
                fullPrice: product.productPrices.FullRetailPrice.FormattedValue,
                fullPriceValue: product.productPrices.FullRetailPrice.Value,
                currencyCode: product.productPrices.FullRetailPrice.GlobalCurrencyCode != null ? product.productPrices.FullRetailPrice.GlobalCurrencyCode : '',
                fCurrency: window.fCurrency
            };
        }
        catch (err) {
            console.log('getDefaultSelectedProduct : ', err);
        }
        return result;
    }

    function bindProducts(data) {
        console.log(data);
        const countryCodeIndex = utils.localStorage().get('countryCodeIndex');
        if (!(data instanceof Error) && data.prices.length > 0) {
            window.PRICES = data.prices;
            checkDoubleQuantity();
            Array.prototype.slice.call(data.prices).forEach(product => {
                try {
                    const radio = _qById('product_' + product.productId);
                    if (radio) {
                        let quantity = !!window.isDoubleQuantity ? product.quantity / 2 : product.quantity,
                            fValue = product.productPrices.DiscountedPrice.FormattedValue.replace(/[,|.|\u00a0]/g, ''),
                            pValue = product.productPrices.DiscountedPrice.Value.toString().replace(/\./, '');
                        window.fCurrency = fValue.replace(pValue, '######').replace(/\d/g, '');

                        if (!!utils.getQueryParameter('couponCode') && !!utils.getQueryParameter('couponValue')) {
                            product = applyCouponCode(product);
                        }
                        product = generateSavePrices(product);
                        if (!!window.isPreOrder && !product.productPrices.hasOwnProperty('PreSaleAmount1')) {
                            product = generatePriceForDeposit(product);
                        }
                        implementPriceHTML(product, quantity);

                        product.productPrices.UnitDiscountRate = product.productPrices.UnitDiscountRate || {};
                        if (!window.isPreOrder || !!product.productPrices.hasOwnProperty('PreSaleAmount1')) {
                            //Detect Data returns unitDiscountRate to calculate as quantity - Tu Nguyen
                            if(!product.productPrices.UnitDiscountRate || !product.productPrices.UnitDiscountRate.Value || (!!product.productPrices.UnitDiscountRate && product.productPrices.UnitDiscountRate.Value === 0)) {
                                product.productPrices.UnitDiscountRate.Value = Number((product.productPrices.DiscountedPrice.Value / quantity).toFixed(2));
                            }
                        }
                        else {
                            product.productPrices.UnitDiscountRate.Value = Number(((product.productPrices.DiscountedPrice.Value + product.productPrices.FullRetailPrice.Value) / quantity).toFixed(2));
                        }
                        product.productPrices.UnitDiscountRate.FormattedValue = utils.formatPrice(product.productPrices.UnitDiscountRate.Value.toFixed(2), window.fCurrency, product.productPrices.DiscountedPrice.FormattedValue);

                        radio.setAttribute('data-product', JSON.stringify(product));
                        radio.onchange = handleProductChange;

                        q('.productRadioListItem .js-img-loading').addClass('hidden');

                        if (!!window.removeCurrencySymbol) {
                            try {
                                product.productPrices.DiscountedPrice.FormattedValue = product.productPrices.DiscountedPrice.Value.toFixed(0);
                            }
                            catch (err) {
                                console.log('product.productPrices.DiscountedPrice' + err);
                            }
                        }

                        const wrapElm = _getClosest(_q('label[for="' + 'product_' + product.productId + '"]'), '.productRadioListItem');
                        Array.prototype.slice.call(wrapElm.querySelectorAll('.jsShippingFee')).forEach(elemShippingFee => {
                            let shippingFeeText = !!window.js_translate.FREESHIP ? window.js_translate.FREESHIP : 'FREE SHIPPING';
                            if (!window.js_translate.shippingFee) {
                                window.js_translate.shippingFee = '{price} Shipping';
                            }
                            if (product.shippings[0].price !== 0) {
                                shippingFeeText = window.js_translate.shippingFee.replace('{price}', product.shippings[0].formattedPrice);
                            }
                            elemShippingFee.insertAdjacentText('beforeend', shippingFeeText);
                        });

                        Array.prototype.slice.call(wrapElm.querySelectorAll('.spanFirstCharge')).forEach(elemFirstCharge => {
                            if (!!window.isPreOrder && !!product.productPrices.hasOwnProperty('PreSaleAmount1')) {
                                elemFirstCharge.insertAdjacentText('beforeend', product.productPrices.PreSaleAmount1.FormattedValue);
                            }
                            else {
                                elemFirstCharge.insertAdjacentText('beforeend', product.productPrices.DiscountedPrice.FormattedValue);
                            }
                        });

                        Array.prototype.slice.call(wrapElm.querySelectorAll('.spanRemainPrice')).forEach(discountedPrice => {
                            let remainPriceValue = product.productPrices.DiscountedPrice.Value;
                            if (!!window.isPreOrder && !!product.productPrices.hasOwnProperty('PreSaleAmount1')) {
                                remainPriceValue = remainPriceValue - product.productPrices.PreSaleAmount1.Value;
                            }
                            discountedPrice.insertAdjacentText('beforeend', utils.formatPrice(remainPriceValue.toFixed(2), window.fCurrency, product.productPrices.DiscountedPrice.FormattedValue));
                        });

                        Array.prototype.slice.call(wrapElm.querySelectorAll('.spanUnitDiscountRate')).forEach(unitDiscountRate => {
                            unitDiscountRate.insertAdjacentText('beforeend', product.productPrices.UnitDiscountRate.FormattedValue);
                        });

                        Array.prototype.slice.call(wrapElm.querySelectorAll('.discountedPrice')).forEach(discountedPrice => {
                            let discountedPriceValue = product.productPrices.DiscountedPrice.Value;
                            if (!!window.isPreOrder && !product.productPrices.hasOwnProperty('PreSaleAmount1')) {
                                // discountedPriceValue = discountedPriceValue + product.productPrices.FullRetailPrice.Value;
                            }
                            discountedPrice.insertAdjacentText('beforeend', utils.formatPrice(discountedPriceValue.toFixed(2), window.fCurrency, product.productPrices.DiscountedPrice.FormattedValue));
                        });

                        Array.prototype.slice.call(wrapElm.querySelectorAll('.spanTotalDiscountPriceElm')).forEach(totalDiscountPrice => {
                            let totalDiscountPriceValue = product.productPrices.DiscountedPrice.Value; // + product.shippings[0].price;
                            if (!!window.isPreOrder && !product.productPrices.hasOwnProperty('PreSaleAmount1')) {
                                totalDiscountPriceValue = totalDiscountPriceValue + product.productPrices.FullRetailPrice.Value;
                            }
                            totalDiscountPrice.insertAdjacentText('beforeend', utils.formatPrice(totalDiscountPriceValue.toFixed(2), window.fCurrency, product.productPrices.DiscountedPrice.FormattedValue));
                        });

                        Array.prototype.slice.call(wrapElm.querySelectorAll('.savePrice')).forEach(savePrice => {
                            let savePriceFormat = utils.formatPrice(product.productPrices.SavePrice.Value.toFixed(2), window.fCurrency, product.productPrices.SavePrice.FormattedValue);

                            if (!!window.removeCurrencySymbol) {
                                savePriceFormat = product.productPrices.SavePrice.Value;
                            }
                            savePrice.innerHTML = savePriceFormat;
                        });

                        Array.prototype.slice.call(wrapElm.querySelectorAll('.savePriceDeposit')).forEach(savePrice => {
                            let savePriceFormat = utils.formatPrice(Math.round(product.productPrices.SavePrice.Value), window.fCurrency, product.productPrices.SavePrice.FormattedValue);

                            if (!!window.removeCurrencySymbol) {
                                savePriceFormat = Math.round(product.productPrices.SavePrice.Value);
                            }
                            savePrice.innerHTML = savePriceFormat;
                        });

                        Array.prototype.slice.call(wrapElm.querySelectorAll('.fullPrice, .fullRetailPriceDeposit')).forEach(fullPrice => {
                            if (!window.isPreOrder || !!product.productPrices.hasOwnProperty('PreSaleAmount1')) {
                                // fullPrice.insertAdjacentText('beforeend', product.productPrices.FullRetailPrice.FormattedValue);
                                let fullPriceFormated = utils.formatPrice(product.productPrices.FullRetailPrice.Value.toFixed(2), window.fCurrency, product.productPrices.FullRetailPrice.FormattedValue);
                                fullPrice.insertAdjacentText('beforeend', fullPriceFormated);
                            }
                            else if (product.productPrices.hasOwnProperty('FullRetailPriceDeposit')) {
                                let fullRetailPriceDepositFormat = product.productPrices.FullRetailPriceDeposit.FormattedValue;
                                if (!!window.removeCurrencySymbol) {
                                    fullRetailPriceDepositFormat = product.productPrices.FullRetailPriceDeposit.Value;
                                }
                                fullPrice.insertAdjacentText('beforeend', fullRetailPriceDepositFormat);
                            }
                        });

                        Array.prototype.slice.call(wrapElm.querySelectorAll('.spanUnitFullRate')).forEach(unitFullRate => {
                            let unitFullRateText = '';
                            if (!window.isPreOrder || !!product.productPrices.hasOwnProperty('PreSaleAmount1')) {
                                if (typeof product.productPrices.UnitFullRetailPrice !== 'undefined') {
                                    unitFullRateText = product.productPrices.UnitFullRetailPrice.FormattedValue;
                                }
                                else {
                                    unitFullRateText = utils.formatPrice((product.productPrices.FullRetailPrice.Value / quantity).toFixed(2), window.fCurrency, product.productPrices.FullRetailPrice.FormattedValue);
                                }
                            }
                            else {
                                unitFullRateText = utils.formatPrice((product.productPrices.FullRetailPriceDeposit.Value / quantity).toFixed(2), window.fCurrency, product.productPrices.FullRetailPriceDeposit.FormattedValue);
                            }
                            unitFullRate.insertAdjacentText('beforeend', unitFullRateText);
                        });
                    }
                }
                catch (err) {
                    console.log(err);
                }
            });

            try {
                if (!!window.isPreOrder) {
                    setTimeout(() => {
                        utils.localStorage().set('preOrder', true);
                    }, 1000);
                }
                const productInfo = getDefaultSelectedProduct();

                if (!window.removeCurrencySymbol) {
                    Array.prototype.slice.call(_qAll('.jsCurrencyNumber')).forEach(currencyElm => {
                        currencyElm.innerText = window.fCurrency.replace('######', currencyElm.textContent);
                    });
                }

                if (!!productInfo && productInfo.currencyCode === '') {
                    productInfo.currencyCode = data.location.currencyCode;
                }
                utils.events.emit('bindProductDiscountInfo', productInfo);
                siteSetting.countryCode = countryCodeIndex || data.location.countryCode;
                utils.localStorage().set('countryCode', siteSetting.countryCode);
                setTimeout(() => {
                    utils.localStorage().set('jsCurrency', window.fCurrency);
                    utils.localStorage().set('countryCode', siteSetting.countryCode);
                    utils.localStorage().set('currencyCode', productInfo.currencyCode);
                    utils.localStorage().set('ip', data.location.ip);
                    utils.localStorage().set('mainCampaignName', data.campaignName);
                    utils.localStorage().set('mainWebKey', window.siteSetting.webKey);
                    if (!!window.pageType && window.pageType !== 'normal') {
                        utils.localStorage().set('pageType', window.pageType);
                    }
                    // Set main webkey according active Tab
                    if (!!_q('.js-list-group .active') && !!_q('.js-list-group .active').dataset.webkey) {
                        siteSetting.webKey = _q('.js-list-group .active').dataset.webkey;
                    }

                    // Set Maropost ID according active tab
                    if (!!_q('.js-list-group .active') && !!_q('.js-list-group .active').dataset.maropostid && window.maroPostSettingId) {
                        window.maroPostSettingId.id = _q('.js-list-group .active').dataset.maropostid;
                    }
                }, 1000);
                utils.events.emit('triggerAddressForm', siteSetting.countryCode);
                utils.events.emit('triggerProductBannerSidebar', productInfo);
                utils.events.emit('triggerWarranty', getSelectedProduct());
                utils.events.emit('bindOrderPage', productInfo);
                utils.events.emit('triggerInstallmentPayment', productInfo);
                utils.events.emit('triggerQuantity', data);
            }
            catch (err) {
                console.log(err);
            }
        }
    }

    function initWidgetProducts() {
        const eCRM = new EmanageCRMJS({
            webkey: siteSetting.webKey,
            cid: siteSetting.CID,
            lang: '',
            isTest: utils.getQueryParameter('isCardTest') ? true : false
        });

        // if (utils.checkCamp(siteSetting.webKey)) {
        //     let campProducts = localStorage.getItem('campproducts');
        //     if (campProducts) {
        //         campProducts = JSON.parse(campProducts);
        //         const camps = campProducts.camps.filter(item => {
        //             return item[siteSetting.webKey];
        //         });

        //         if (camps.length > 0) {
        //             console.log('get prices from LS');
        //             bindProducts(camps[0][siteSetting.webKey]);
        //         }
        //     }
        // }
        // else {
        //     eCRM.Campaign.getProducts(function (data) {
        //         let campProducts = localStorage.getItem('campproducts');
        //         if (campProducts) {
        //             campProducts = JSON.parse(campProducts);
        //         }
        //         else {
        //             campProducts = {
        //                 camps: []
        //             };
        //         }

        //         if (typeof data.prices !== 'undefined') {
        //             data.timestamp = new Date().toISOString();
        //             const camps = campProducts.camps.filter(item => {
        //                 return item[siteSetting.webKey];
        //             });

        //             let camp = {};
        //             if (camps.length > 0) {
        //                 camp = camps[0];
        //                 camp[siteSetting.webKey] = data;
        //             }
        //             else {
        //                 camp[siteSetting.webKey] = data;
        //                 campProducts.camps.push(camp);
        //             }

        //             localStorage.setItem('campproducts', JSON.stringify(campProducts));
        //         }
        //         bindProducts(data);
        //     });
        // }

        console.log("don't cache product list at widget_productlist_v1 ...");
        eCRM.Campaign.getProducts(function (data) {
            let campProducts = localStorage.getItem('campproducts');
            if (campProducts) {
                campProducts = JSON.parse(campProducts);
            }
            else {
                campProducts = {
                    camps: []
                };
            }

            if (typeof data.prices !== 'undefined') {
                data.timestamp = new Date().toISOString();
                const camps = campProducts.camps.filter(item => {
                    return item[siteSetting.webKey];
                });

                let camp = {};
                if (camps.length > 0) {
                    camp = camps[0];
                    camp[siteSetting.webKey] = data;
                }
                else {
                    camp[siteSetting.webKey] = data;
                    campProducts.camps.push(camp);
                }

                localStorage.setItem('campproducts', JSON.stringify(campProducts));
            }
            bindProducts(data);
        });
    }
    initWidgetProducts();

    // Tab click
    if (!!_q('.js-list-group li')) {
        const tabItems = _qAll('.js-list-group li'),
            titleElm = _q('.js-list-group h5'),
            packageDisplay = _q('.js-list-group ul').dataset.packagedisplay.split(',');

        let currentPackage = packageDisplay,
            isMissingTab = true,
            rootActiveText = '',
            activeText = '',
            waitTime,
            indexItem = currentPackage.indexOf(_q('input[name="product"]:checked').value);

        if (!!titleElm) {
            rootActiveText = titleElm.innerHTML;
            activeText = rootActiveText;
        }

        const saveActiveTabIndex = () => {
            utils.localStorage().set('indexTab', -1);
            for (let [index, tabItem] of tabItems.entries()) {
                if (tabItem.classList.contains('active')) {
                    utils.localStorage().set('indexTab', index);
                    break;
                }
            }
        };
        const updateIndexItem = () => {
            indexItem = currentPackage.indexOf(_q('input[name="product"]:checked').value);
        };
        const checkProduct = () => {
            if (currentPackage.length - 1 < indexItem) {
                indexItem = currentPackage.length - 1;
            }
            for (let [index, proId] of currentPackage.entries()) {
                if (index === indexItem) {
                    let input = _q('input[name="product"][value="' + proId + '"]');
                    _getClosest(input, '.productRadioListItem').querySelector('.js-unitDiscountRate').click();
                    break;
                }
            }
        };
        const showDefaultProduct = (packageDisplay, isPopup) => {
            currentPackage = packageDisplay;
            // Hide all product items
            q('.productRadioListItem').addClass('hidden');

            for (let proId of packageDisplay) {
                let inputElm = _qById('product_' + proId);
                let proItem = _getClosest(inputElm, '.productRadioListItem');
                if (!proItem) {
                    continue;
                }

                let options = JSON.parse(_qById('js-widget-products').dataset.options);
                if (isPopup) {
                    if (proItem.classList.contains('special_offer')) {
                        proItem.classList.remove('hidden');
                    }
                    if (!options.specialOnly) {
                        proItem.classList.remove('hidden');
                    }
                }
                else if (!proItem.classList.contains('special_offer')) {
                    proItem.classList.remove('hidden');
                }
            }

            checkDoubleQuantity();
            checkProduct();
        };
        const setupTab = () => {
            _q('body').classList.add('package-active-1');
            if (!!titleElm) {
                activeText = rootActiveText;
                titleElm.innerHTML = activeText;
            }
            q('.js-list-group li').removeClass('active');
            for (let tabItem of tabItems) {
                if (_q('.js-list-group ul').dataset.packagedisplay === tabItem.dataset.package) {
                    tabItem.classList.add('active');
                    isMissingTab = false;
                    break;
                }
            }

            if (!!waitTime) {
                clearTimeout(waitTime);
            }
            waitTime = setTimeout(function () {
                saveActiveTabIndex();
            }, 3000);
        };
        const handleBodyClass = (tabItem) => {
            try {
                for (let i = 1, n = tabItems.length; i <= n; i++) {
                    _q('body').classList.remove(`package-active-${i}`);
                }

                let tabIndex = Array.prototype.slice.call(tabItems).indexOf(tabItem) || 0;
                _q('body').classList.add(`package-active-${++tabIndex}`);
            }
            catch(e) {
                console.log(e);
            }
        };
        const activeTab = (tabItem) => {
            handleBodyClass(tabItem);

            let isPopup = utils.getQueryParameter('et') === '1';
            updateIndexItem();

            q('.js-list-group li').removeClass('clicked');
            tabItem.classList.add('clicked');
            if (!!_q('.prl-error')) {
                _q('.prl-error').classList.add('hidden');
            }
            if (!tabItem.classList.contains('active')) {
                q('.js-list-group li').removeClass('active');
                tabItem.classList.add('active');
                showDefaultProduct(tabItem.dataset.package.split(','), isPopup);
            }
            else if (isMissingTab && tabItem.classList.contains('active')) {
                q('.js-list-group li').removeClass('active');
                tabItem.classList.remove('clicked');
                if (!!titleElm) {
                    activeText = rootActiveText;
                    titleElm.innerHTML = activeText;
                }
                showDefaultProduct(packageDisplay, isPopup);
            }
        };
        const updateHeadingPrice = () => {
            let bestSellerIdx = packageDisplay.indexOf(_qById('hdfSelectedProduct').value),
                bestSellerElm = _qById('product_' + currentPackage[bestSellerIdx]),
                bestSellerData = JSON.parse(bestSellerElm.dataset.product),
                bestSellerDiscountPrice = bestSellerData.productPrices.DiscountedPrice.FormattedValue,
                bestSellerFullPrice = bestSellerData.productPrices.FullRetailPrice.FormattedValue;

            const textDiscountPriceElms = _qAll('.js-sale-off-heading .textDiscountPrice');
            if (!!textDiscountPriceElms) {
                for (let textDiscountPriceElm of textDiscountPriceElms) {
                    textDiscountPriceElm.innerText = bestSellerDiscountPrice;
                }
            }

            const textFullPriceElms = _qAll('.js-sale-off-heading .textFullPrice');
            if (!!textFullPriceElms) {
                for (let textFullPriceElm of textFullPriceElms) {
                    textFullPriceElm.innerText = bestSellerFullPrice;
                }
            }
        };
        const init = (isPopup) => {
            setupTab();
            showDefaultProduct(packageDisplay, isPopup);

            if (isPopup) {
                // Remove all Best seller
                var selectedPro = _qAll('.productRadioListItem:not(.special_offer) .best-seller-text');
                for (let elm of selectedPro) {
                    if (elm) {
                        elm.parentNode.removeChild(elm);
                    }
                }

                // Remove default class for defaul item (not speical_offer)
                q('.default:not(.special_offer)').removeClass('default');
            }
        };
        const listener = () => {
            const defaultMaropostId = window.maroPostSettingId ? window.maroPostSettingId.id : '';
            for (let tabItem of tabItems) {
                if (!!titleElm) {
                    tabItem.addEventListener('mouseenter', function () {
                        if (!!tabItem.dataset.replacetext) {
                            titleElm.innerHTML = tabItem.dataset.replacetext;
                        }
                    }, false);

                    tabItem.addEventListener('mouseleave', function () {
                        titleElm.innerHTML = activeText;
                    }, false);
                }

                tabItem.addEventListener('click', function () {
                    // Update Text
                    if (!!titleElm && !!tabItem.dataset.replacetext) {
                        activeText = tabItem.dataset.replacetext;
                        titleElm.innerHTML = activeText;
                    }

                    if (!!tabItem.dataset.webkey) {
                        siteSetting.webKey = tabItem.dataset.webkey;
                    }

                    // ? Update Maropost ID when change tab
                    if (window.maroPostSettingId) {
                        if (!!tabItem.dataset.maropostid) {
                            window.maroPostSettingId.id = tabItem.dataset.maropostid;
                        }
                        else {
                            window.maroPostSettingId.id = defaultMaropostId;
                        }
                    }

                    activeTab(tabItem);
                    saveActiveTabIndex();

                    let options = JSON.parse(_qById('js-widget-products').dataset.options);
                    if (options.hasOwnProperty('isUpdateHeadingPrice')) {
                        updateHeadingPrice();
                    }
                }, false);
            }

            if (!!_qById('btn-yes-exit-popup')) {
                _qById('btn-yes-exit-popup').addEventListener('click', function () {
                    indexItem = 0;
                    init(true);
                }, false);
            }
        };

        init(utils.getQueryParameter('et') === '1');
        listener();

        //export isValidProductList
        const isValidProductList = () => {
            let isValid = false;
            const tabPackages = _qAll('.js-list-group li'),
                errorPrlMsg = _q('.prl-error');
            for (const tabPackage of tabPackages) {
                if (tabPackage.classList.contains('active')) {
                    isValid = true;
                    break;
                }
            }
            if (!!errorPrlMsg) {
                if (!isValid) {
                    errorPrlMsg.classList.remove('hidden');
                }
                else {
                    errorPrlMsg.classList.add('hidden');
                }
            }
            else {
                isValid = true;
            }
            return isValid;
        };

        window.widget.productlist = {
            isValidProductList: isValidProductList
        };
    }

    window.implementPriceHTML = implementPriceHTML;
})(window.utils);
