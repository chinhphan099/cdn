((utils) => {
    if (!utils) {
        console.log('utils module is not found');
        return;
    }

    window.taxArray = [];
    let isDefaultAddress = true;
    let customerAddress = {};
    let discountedSelectedPrice = undefined;
    let shippingSelectedPrice = undefined;
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
        if (_q('.statistical') || _q('.custom-statistical')) {
            const taxElem = _q('.td-taxes-fees');
            if (!!taxElem) {
                taxElem.innerHTML = `${imgLoading}`;
                _q('.grand-total').innerHTML = `${imgLoading}`;
            }
            else {
                const taxRow = `<tr class="tax-row">
                    <td class="td-taxes-text">${siteSetting.taxAndFee || 'Estimated Tax:'}</td>
                    <td class="td-taxes-fees">${imgLoading}</td>
                </tr>`;
                if (_q('.statistical table tbody')) {
                    _q('.statistical table tbody').insertAdjacentHTML('beforeend', taxRow);
                }
            }
            taxElem.parentElement.removeAttribute('style');
        }

        if (!!_q('.tax_price')) {
            _q('.tax_price').innerHTML = `${imgLoading}`;
        }
        if (!!_q('.total_price')) {
            Array.prototype.slice.call(_qAll('.total_price')).forEach((totalPriceElm) => {
                totalPriceElm.innerHTML = `${imgLoading}`;
            });
        }
    }

    function renderTaxAndGrandTotal(selectedProdduct) {
        const selectedItem = window.taxArray.find((item) => item.productId === selectedProdduct.productId);

        const totalTaxAmount = selectedItem.taxAmount;
        // const shippingFee = selectedProdduct.shippings[window.shippingIndex ? window.shippingIndex : 0].price;
        // const grandTotal = (selectedItem.totalPrice + shippingFee + totalTaxAmount).toFixed(2);
        const grandTotal = (selectedItem.totalPrice + totalTaxAmount).toFixed(2);

        Array.prototype.slice.call(_qAll('.tax_price, .td-taxes-fees')).forEach((taxElem) => {
            taxElem.textContent = utils.formatPrice(totalTaxAmount.toFixed(2), window.fCurrency, totalTaxAmount.toFixed(2));
            taxElem.parentElement.removeAttribute('style');
        });

        //bind grand total
        Array.prototype.slice.call(_qAll('.grand-total, .total_price')).forEach((grandTotalElem) => {
            grandTotalElem.textContent = utils.formatPrice(grandTotal, window.fCurrency, grandTotal);
        });

        const taxProducts = {
            productId: selectedProdduct.productId,
            sku: selectedProdduct.sku,
            taxAmount: totalTaxAmount,
            upsells: []
        };
        window.localStorage.setItem('taxProducts', JSON.stringify(taxProducts));
    }

    function implementTax(selectedProduct) {
        renderTaxAndGrandTotal(selectedProduct);
        enableCheckoutBtnEvents();

        //store customerAddress for upsell
        window.localStorage.setItem('customerAddress', JSON.stringify(customerAddress));
        if (!!window.extrapop && typeof window.extrapop.renderPrice === 'function') {
            window.extrapop.renderPrice();
        }
    }

    function callTaxAjax(postData, selectedProduct) {
        const eCRM = new EmanageCRMJS({
            webkey: siteSetting.webKey,
            cid: siteSetting.CID,
            lang: '',
            isTest: utils.getQueryParameter('isCardTest') ? true : false
        });

        const url = `${eCRM.Order.baseAPIEndpoint}/orders/CreateEstimate`;

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
                if (!result) {
                    items = postData.items.map((item) => {
                        item.taxAmount = 0;
                        item.taxRate = 0;
                        return item
                    });
                }
                else {
                    items = result.items;
                }
                utils.events.emit('bindTax');
                window.taxArray = items;
                implementTax(selectedProduct);
            })
            .catch(() => {
                let items = postData.items.map((item) => {
                    item.taxAmount = 0;
                    item.taxRate = 0;
                    return item
                });
                utils.events.emit('bindTax');
                window.taxArray = items;
                implementTax(selectedProduct);
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
                        items: [],
                        customerAddress: customerAddress
                    };

                    const selectedProduct = _getSelectedProduct();
                    if (!!isExistingTax && window.taxArray.length > 0) {
                        implementTax(selectedProduct);
                        return;
                    }

                    /**
                     * ! Post All Product Items
                     */
                    postData.items = window.PRICES.map((item) => {
                        let discountedPrice = item.productPrices.DiscountedPrice.Value;
                        let shippingFee = item.shippings[0].price;
                        if (selectedProduct.productId === item.productId) {
                            if (!!discountedSelectedPrice) {
                                discountedPrice = discountedSelectedPrice;
                            }
                            if (!!shippingSelectedPrice) {
                                shippingFee = shippingSelectedPrice;
                            }
                        }

                        const quantity = window.isDoubleQuantity ? item.quantity / 2 : item.quantity;
                        return {
                            'productId': item.productId,
                            'sku': item.sku,
                            'quantity': quantity,
                            'unitPrice': item.productPrices.UnitDiscountRate.Value,
                            'totalPrice': discountedPrice + shippingFee,
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
                implementTax(selectedProduct);
                return;
            }

            postData.items = window.PRICES.map((item) => {
                let discountedPrice = item.productPrices.DiscountedPrice.Value;
                let shippingFee = item.shippings[0].price;
                if (selectedProduct.productId === item.productId) {
                    if (!!discountedSelectedPrice) {
                        discountedPrice = discountedSelectedPrice;
                    }
                    if (!!shippingSelectedPrice) {
                        shippingFee = shippingSelectedPrice;
                    }
                }

                const quantity = window.isDoubleQuantity ? item.quantity / 2 : item.quantity;
                return {
                    'productId': item.productId,
                    'sku': item.sku,
                    'quantity': quantity,
                    'unitPrice': item.productPrices.UnitDiscountRate.Value,
                    'totalPrice': discountedPrice + shippingFee,
                    'description': item.productName
                }
            });

            isDefaultAddress = false;
            window.taxArray = [];
            callTaxAjax(postData, selectedProduct);
        }
        else if (!!isExistingTax && window.taxArray.length > 0) {
            implementTax(selectedProduct);
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
        const productElements = _qAll('input[name="product"]');
        for (let prodElem of productElements) {
            prodElem.addEventListener('change', () => {
                if (discountedSelectedPrice) {
                    discountedSelectedPrice = undefined;
                    shippingSelectedPrice = undefined;
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
        discountedSelectedPrice = data.totalDiscountedPrice;
        shippingSelectedPrice = data.totalDiscountedShippingPrice;
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
