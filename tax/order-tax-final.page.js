((utils) => {
    if (!utils) {
        console.log('utils module is not found');
        return;
    }
    if (window.location.host.indexOf('beautystatcosmetics') > -1) {
        return;
    }

    window.taxArray = [];
    let isDefaultAddress = true;
    let customerAddress = {};
    window.discountedSelectedPrice = undefined;
    const imgLoading = `<span class="js-img-loading">
                            <img src="//d16hdrba6dusey.cloudfront.net/sitecommon/images/loading-price-v1.gif" width="20" height="10" class="no-lazy"  style="width: 20px;">
                        </span>`;

    function disableCheckoutBtnEvents() {
        if (!!_qById('js-basic-cta-button')) {
            _qById('js-basic-cta-button').style.pointerEvents = 'none';
        }

        if (!!_qById('js-paypal-oneclick-button')) {
            _qById('js-paypal-oneclick-button').style.pointerEvents = 'none';
        }
    }

    function enableCheckoutBtnEvents() {
        if (!!_qById('js-basic-cta-button')) {
            _qById('js-basic-cta-button').style.pointerEvents = 'auto';
        }

        if (!!_qById('js-paypal-oneclick-button')) {
            _qById('js-paypal-oneclick-button').style.pointerEvents = 'auto';
        }
    }

    function renderTaxRow() {
        disableCheckoutBtnEvents();

        // Order Golden
        if (_q('.statistical') || _q('.custom-statistical') || _q('.cart-info')) {
            let taxElem = _q('.td-taxes-fees');
            if (!!taxElem) {
                taxElem.innerHTML = `${imgLoading}`;
            }
            else {
                const taxRow = `<tr class="tax-row">
                    <td class="td-taxes-text">${js_translate.taxAndFee || 'Estimated Tax:'}</td>
                    <td class="td-taxes-fees text-right">${imgLoading}</td>
                </tr>`;
                if (_q('.statistical table tbody')) {
                    _q('.statistical table tbody').insertAdjacentHTML('beforeend', taxRow);
                }
                if (_q('.cart-info table tbody')) {
                    _q('.cart-info table tbody').insertAdjacentHTML('beforeend', taxRow);
                }
                taxElem = _q('.td-taxes-fees');
            }
            taxElem.parentElement.removeAttribute('style');
        }

        Array.prototype.slice.call(_qAll('.grand-total, .total_price, .total-price, .tax_price, .td-taxes-fees')).forEach((grandTotalElem) => {
            grandTotalElem.innerHTML = `${imgLoading}`;
        });
    }

    function _getSelectedProduct() {
        if (!_q('input[name="product"]:checked')) {
            return null;
        }

        const product = _q('input[name="product"]:checked').dataset.product;
        if (product) {
            return JSON.parse(product);
        }
        else {
            return null;
        }
    }

    function getWarrantyPrice() {
        let wPrice = 0;
        if (!!_qById('txtProductWarranty') && _qById('txtProductWarranty').checked) {
            const data = _getSelectedProduct(),
                warrantyRate = [0.1, 0.2, 0.2, 0.2, 0.2, 0.3, 0.5, 0.15, 0.25, 0.35, 0.4, 0.45, 0.55, 0.6],
                funnelId = _qById('txtProductWarranty').value,
                funnelPrice = warrantyRate[parseInt(funnelId) - 1];
            let warrantyPrice = (Math.round(100 * data.productPrices.DiscountedPrice.Value * funnelPrice) / 100).toFixed(2);
            wPrice = Number(warrantyPrice);
        }
        return wPrice;
    }

    function renderTaxAndGrandTotal(selectedProduct) {
        if (window.taxArray.length === 0) return;
        const selectedItem = window.taxArray.find((item) => item.productId === selectedProduct.productId);
        window.taxPercent = selectedItem.taxRate / 100;
        const shippingFee = selectedProduct.shippings[window.shippingIndex || 0].price;
        const formattedShippingFee = selectedProduct.shippings[0].formattedPrice;
        const lifetime = getWarrantyPrice();
        const totalTaxAmount = selectedProduct.productPrices.DiscountedPrice.Value * window.taxPercent + lifetime * window.taxPercent + shippingFee * window.taxPercent;
        const grandTotal = selectedProduct.productPrices.DiscountedPrice.Value + lifetime + shippingFee + totalTaxAmount;

        Array.prototype.slice.call(_qAll('.tax_price, .td-taxes-fees')).forEach((taxElem) => {
            taxElem.textContent = utils.formatPrice(totalTaxAmount.toFixed(2), window.fCurrency, formattedShippingFee);
            taxElem.parentElement.removeAttribute('style');
        });

        Array.prototype.slice.call(_qAll('.grand-total, .total_price, .total-price')).forEach((grandTotalElem) => {
            grandTotalElem.textContent = utils.formatPrice(grandTotal.toFixed(2), window.fCurrency, formattedShippingFee);
        });
    }

    window.implementTax = function(selectedProduct) {
        renderTaxAndGrandTotal(selectedProduct);
        enableCheckoutBtnEvents();

        //store customerAddress for upsell
        window.localStorage.setItem('customerAddress', JSON.stringify(customerAddress));
        if (!!window.extrapop && typeof window.extrapop.renderPrice === 'function') {
            window.extrapop.renderPrice();
        }
    }

    function includeDiscountedPriceIntoTaxArray(items, data) {
        const rtn = items.map((item) => {
            const findItem = data.find((it) => item.productId === it.productId);

            if (findItem) {
                return {
                    ...item,
                    discountedPrice: findItem.discountedPrice
                }
            }
            return item;
        });
        return rtn;
    }

    function callTaxAjax(postData, selectedProduct) {
        const eCRM = new EmanageCRMJS({
            webkey: siteSetting.webKey,
            cid: siteSetting.CID,
            lang: '',
            isTest: utils.getQueryParameter('isCardTest') ? true : false
        });

        const url = `${eCRM.Order.baseAPIEndpoint}/orders/CreateEstimate/${siteSetting.webKey}`;

        const options = {
            method: 'POST',
            headers: {
                'X_CID': siteSetting.CID
            },
            data: postData
        };

        renderTaxRow();
        utils.callAjax(url, options)
            .then((result) => {
                let items = [];
                if (result && result.items && result.items.length > 0) {
                    items = result.items;
                }
                else {
                    items = postData.items.map((item) => {
                        item.taxAmount = 0;
                        item.taxRate = 0;
                        return item
                    });
                }
                items = includeDiscountedPriceIntoTaxArray(items, postData.items);
                utils.events.emit('bindTax');
                window.taxArray = items;
                window.implementTax(selectedProduct);
            })
            .catch(() => {
                let items = postData.items.map((item) => {
                    item.taxAmount = 0;
                    item.taxRate = 0;
                    return item
                });
                items = includeDiscountedPriceIntoTaxArray(items, postData.items);
                utils.events.emit('bindTax');
                window.taxArray = items;
                window.implementTax(selectedProduct);
            });
    }

    function initTaxByDefault(isExistingTax) {
        window.localStorage.setItem('bindTax', true); // Chinh --- Use for always show Tax line on Confirm page
        if (utils.checkCamp(siteSetting.webKey)) {
            let campProducts = localStorage.getItem('campproducts');
            if (campProducts) {
                campProducts = JSON.parse(campProducts);
                let camp = campProducts.camps.find(item => item[siteSetting.webKey]);

                if (camp) {
                    camp = camp[siteSetting.webKey];
                    customerAddress = {
                        'line1': '',
                        'city': camp.location.city,
                        'region': camp.location.regionCode,
                        'country': camp.location.countryCode,
                        'postalCode': camp.location.zipCode
                    };
                    const postData = {
                        isTest: utils.getQueryParameter('isCardTest') ? true : false,
                        items: [],
                        customerAddress: customerAddress
                    };

                    const selectedProduct = _getSelectedProduct();
                    if (!!isExistingTax && window.taxArray.length > 0) {
                        window.implementTax(selectedProduct);
                        return;
                    }

                    /**
                     * ! Post All Product Items
                     */
                    postData.items = window.PRICES.map((item) => {
                        let discountedPrice = item.productPrices.DiscountedPrice.Value;
                        if (selectedProduct.productId === item.productId) {
                            if (!!window.discountedSelectedPrice) {
                                discountedPrice = window.discountedSelectedPrice;
                            }
                        }

                        const quantity = window.isDoubleQuantity ? item.quantity / 2 : item.quantity;
                        return {
                            'productId': item.productId,
                            'sku': item.sku,
                            'quantity': quantity,
                            'unitPrice': item.productPrices.UnitDiscountRate.Value,
                            'discountedPrice': discountedPrice,
                            'totalPrice': discountedPrice,
                            'description': item.productName
                        }
                    });

                    callTaxAjax(postData, selectedProduct);
                }
            }
        }
    }
    utils.events.on('bindOrderPage', initTaxByDefault);

    function loadTax(isExistingTax) {
        let isValid = true;
        const inputs = _qAll('#shipping_address1, #shipping_city, #shipping_country, #shipping_province, #shipping_postal');
        for (let elem of inputs) {
            if ((elem.value.trim() === '' || elem.value.trim() === '----') && elem.hasAttribute('required')) {
                isValid = false;
                break;
            }
        }

        const selectedProduct = _getSelectedProduct();
        const postData = {
            items: [],
            customerAddress: customerAddress
        };

        if (isValid) {
            customerAddress = {
                'line1': _qById('shipping_address1') ? _qById('shipping_address1').value : '',
                'city': _qById('shipping_city') ? _qById('shipping_city').value : '',
                'region': _qById('shipping_province') ? _qById('shipping_province').value : '',
                'country': _qById('shipping_country') ? _qById('shipping_country').value : '',
                'postalCode': _qById('shipping_postal') ? _qById('shipping_postal').value : ''
            };

            postData.customerAddress = customerAddress;

            if (!!isExistingTax && window.taxArray.length > 0) {
                window.implementTax(selectedProduct);
                return;
            }

            postData.items = window.PRICES.map((item) => {
                let discountedPrice = item.productPrices.DiscountedPrice.Value;
                if (selectedProduct.productId === item.productId) {
                    if (!!window.discountedSelectedPrice) {
                        discountedPrice = window.discountedSelectedPrice;
                    }
                }

                const quantity = window.isDoubleQuantity ? item.quantity / 2 : item.quantity;
                return {
                    'productId': item.productId,
                    'sku': item.sku,
                    'quantity': quantity,
                    'unitPrice': item.productPrices.UnitDiscountRate.Value,
                    'discountedPrice': discountedPrice,
                    'totalPrice': discountedPrice,
                    'description': item.productName
                }
            });

            isDefaultAddress = false;
            window.taxArray = [];
            callTaxAjax(postData, selectedProduct);
        }
        else if (!!isExistingTax && window.taxArray.length > 0) {
            window.implementTax(selectedProduct);
            return;
        }
    }

    function listener() {
        const inputs = _qAll('#shipping_address1, #shipping_city, #shipping_country, #shipping_province, #shipping_postal');
        for (let elem of inputs) {
            elem.addEventListener('change', () => {
                loadTax();
            });
        }

        //change product
        const productElements = _qAll('input[name="product"], #txtProductWarranty');
        for (let prodElem of productElements) {
            prodElem.addEventListener('change', () => {
                if (window.discountedSelectedPrice) {
                    window.discountedSelectedPrice = undefined;
                    if(isDefaultAddress) {
                        initTaxByDefault();
                    }
                    else {
                        loadTax();
                    }
                }
                else {
                    if(isDefaultAddress) {
                        initTaxByDefault(true);
                    }
                    else {
                        loadTax(true);
                    }
                }
            });
        }
    }

    function onActivePopup() {
        if(isDefaultAddress) {
            initTaxByDefault();
        }
        else {
            loadTax();
        }
    }
    utils.events.on('onActivePopup', onActivePopup); // Order st

    function afterApplyCoupon(data) {
        window.discountedSelectedPrice = data.totalDiscountedPrice;
        if(isDefaultAddress) {
            initTaxByDefault();
        }
        else {
            loadTax();
        }
    }
    utils.events.on('afterApplyCoupon', afterApplyCoupon); // Order list

    document.addEventListener('DOMContentLoaded', () => {
        listener();
    });
})(window.utils);
