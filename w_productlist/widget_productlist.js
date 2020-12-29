(function (utils) {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    if (!siteSetting) {
        console.log('window.siteSetting object is not found');
        return;
    }

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

    function replaceUserString() {
        //Product List Widget
        if (_qById('js-widget-products')) {
            const iconPriceLoading = `<span class="spanUnitDiscountRate">
                                        <span class="js-img-loading">
                                            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" width="20" height="10" data-src="//d16hdrba6dusey.cloudfront.net/sitecommon/images/loading-price-v1.gif">
                                        </span>
                                      </span>`;
            const unitDiscountRateLables = _qAll('.js-unitDiscountRate');
            if (unitDiscountRateLables) {
                Array.prototype.slice.call(unitDiscountRateLables).forEach(function (elem) {
                    elem.innerHTML = elem.innerHTML.replace('{UnitDiscountRate}', iconPriceLoading);
                });
            }
        }
    }
    replaceUserString();

    function initWidgetProducts() {
        const eCRM = new EmanageCRMJS({
            webkey: siteSetting.webKey,
            cid: siteSetting.CID,
            lang: '',
            isTest: utils.getQueryParameter('isCardTest') ? true : false
        });

        // eCRM.Campaign.getProducts(function (data) {
        //     bindProducts(data);
        // });

        if (utils.checkCamp(siteSetting.webKey)) {
            let campProducts = localStorage.getItem('campproducts');
            if (campProducts) {
                campProducts = JSON.parse(campProducts);
                const camps = campProducts.camps.filter(item => {
                    return item[siteSetting.webKey];
                });

                if (camps.length > 0) {
                    console.log('get prices from LS');
                    bindProducts(camps[0][siteSetting.webKey]);
                }
            }
        } else {
            eCRM.Campaign.getProducts(function (data) {
                bindProducts(data);

                //store camp in local storage
                let campProducts = localStorage.getItem('campproducts');
                if (campProducts) {
                    campProducts = JSON.parse(campProducts);
                } else {
                    campProducts = {
                        camps: []
                    }
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
                    } else {
                        camp[siteSetting.webKey] = data;
                        campProducts.camps.push(camp);
                    }

                    localStorage.setItem('campproducts', JSON.stringify(campProducts));
                }
            });
        }
    }
    initWidgetProducts();

    function generateSavePrices(product) {
        product.productPrices.SavePrice = {};
        product.productPrices.SavePrice.Value = Number((product.productPrices.FullRetailPrice.Value - product.productPrices.DiscountedPrice.Value).toFixed(2));
        product.productPrices.SavePrice.FormattedValue = utils.formatPrice(product.productPrices.SavePrice.Value.toFixed(2), window.fCurrency, product.productPrices.DiscountedPrice.FormattedValue);

        return product;
    }

    function bindProducts(data) {
        if (!(data instanceof Error) && data.prices.length > 0) {
            //console.log(data);
            Array.prototype.slice.call(data.prices).forEach(product => {
                try {
                    const radio = _qById('product_' + product.productId);
                    if (radio) {
                        let fValue = product.productPrices.DiscountedPrice.FormattedValue.replace(/[,|.]/g, ''),
                            pValue = product.productPrices.DiscountedPrice.Value.toString().replace(/\./, '');
                        window.fCurrency = fValue.replace(pValue, '######').replace(/\d/g, '');
                        product = generateSavePrices(product);

                        radio.setAttribute('data-product', JSON.stringify(product));
                        radio.onchange = handleProductChange;

                        const elemUnitDiscountRate = _q('label[for="' + "product_" + product.productId + '"] span.spanUnitDiscountRate');
                        const elemDiscountedPrice = _q('#discountedPrice_' + product.productId);

                        if (elemUnitDiscountRate) elemUnitDiscountRate.innerHTML = product.productPrices.UnitDiscountRate.FormattedValue;
                        if (elemDiscountedPrice) elemDiscountedPrice.innerHTML = product.productPrices.DiscountedPrice.FormattedValue;
                    }
                } catch (err) {
                    console.log(err);
                }
            });

            siteSetting.countryCode = data.location.countryCode;

            //emit events
            try {
                const productInfo = getHiddenSelectedProduct();
                if (!!productInfo && productInfo.currencyCode === '') {
                    productInfo.currencyCode = data.location.currencyCode;
                }
                utils.events.emit('bindProductDiscountInfo', productInfo);
                utils.localStorage().set('countryCode', data.location.countryCode);
                utils.events.emit('triggerAddressForm', data.location.countryCode);
                utils.localStorage().set('currencyCode', productInfo.currencyCode);
                utils.events.emit('triggerProductBannerSidebar', productInfo);
                utils.events.emit('triggerWarranty', getSelectedProduct());
                utils.events.emit('bindOrderPage', productInfo);
                utils.events.emit('triggerInstallmentPayment', productInfo);
            } catch (err) {
                console.log(err);
            }
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
    }

    function getSelectedProduct() {
        const product = _q('input[name="product"]:checked').dataset.product;
        if (product) {
            return JSON.parse(product);
        } else {
            return null;
        }
    }

    /**
     * This function is used to get hidden selected product which is used to bind shipping price and discount info
     */
    function getHiddenSelectedProduct() {
        let result = null;
        try {
            const productId = _qById('hdfSelectedProduct').value;
            const product = JSON.parse(_qById('product_' + productId).dataset.product);
            let priceShipping = '';
            if (product.shippings.length > 0) {
                var shipping = product.shippings[0];
                if (shipping.price == 0) {
                    if (window.js_translate && window.js_translate.free) {
                        priceShipping = window.js_translate.free;
                    } else {
                        priceShipping = "free";
                    }
                } else {
                    priceShipping = shipping.formattedPrice;
                }
            } else {
                if (window.js_translate && window.js_translate.free) {
                    priceShipping = window.js_translate.free;
                } else {
                    priceShipping = "free";
                }
            }

            result = {
                priceShipping: priceShipping,
                discountPrice: product.productPrices.DiscountedPrice.FormattedValue,
                discountPriceValue: product.productPrices.DiscountedPrice.Value,
                fullPrice: product.productPrices.FullRetailPrice.FormattedValue,
                fullPriceValue: product.productPrices.FullRetailPrice.Value,
                currencyCode: product.productPrices.FullRetailPrice.GlobalCurrencyCode != null ? product.productPrices.FullRetailPrice.GlobalCurrencyCode : ''
            }

        } catch (err) {
            console.log('getHiddenSelectedProduct : ', err);
        }
        return result;
    }
})(window.utils);
