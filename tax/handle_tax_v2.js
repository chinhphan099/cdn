(function (utils) {
    if (!utils) {
        console.log('utils module is not found');
        return;
    }
    let currencySymbol;

    try {
        function loadTax(countryCode, stateCode, couponCode) {
            if (!stateCode) {
                stateCode = 'a';
            }

            if (!countryCode) {
                localStorage.removeItem('currentProductTaxes');
                _bindTax();
            } else {
                const taxesEle = document.querySelectorAll('.taxes-fee, .td-taxes-fees');
                const taxRowEle = document.querySelector('.tax-row');

                if(!!taxRowEle) {
                    taxRowEle.classList.remove('hidden');
                    taxRowEle.removeAttribute('style');
                }
                if (taxesEle.length > 0) {
                    for(let item of taxesEle) {
                        item.innerHTML = '<img height="20" src="//d16hdrba6dusey.cloudfront.net/sitecommon/images/loading-price.gif"></img>';
                    }
                }
            }

            let url = `https://websales-api.tryemanagecrm.com/api/campaigns/${siteSetting.webKey}/taxes/${countryCode}/${stateCode}`;
            if (couponCode) {
                url += '?coupon=' + couponCode
            }

            const options = {
                headers: {
                    X_CID: siteSetting.CID
                }
            }
            utils.callAjax(url, options).then(result => {
                let listProductTaxes = result ? result.productsTaxes : [];
                //stogate to use when select product list
                localStorage.setItem('currentProductTaxes', JSON.stringify(listProductTaxes));
                _bindTax();
                utils.events.emit('loadedTax', listProductTaxes);
            }).catch(error => {
                localStorage.removeItem('currentProductTaxes');
                _bindTax();
                console.log(error)
            });
        }

        function getWarrantyPrice() {
            let wPrice = 0;

            if (!!_qById('txtProductWarranty') && _qById('txtProductWarranty').checked) {
                const checkedItem = _q('.productRadioListItem input:checked'),
                    data = JSON.parse(checkedItem.dataset.product),
                    warrantyRate = [0.1, 0.2, 0.2, 0.2, 0.2, 0.3, 0.5, 0.15, 0.25, 0.35, 0.4, 0.45, 0.55, 0.6],
                    funnelId = _qById('txtProductWarranty').value,
                    funnelPrice = warrantyRate[parseInt(funnelId) - 1];

                let warrantyPrice = (Math.round(100 * data.productPrices.DiscountedPrice.Value * funnelPrice) / 100).toFixed(2);
                wPrice = Number(warrantyPrice);
            }

            return wPrice;
        }

        function getTaxOfProduct() {
            let tax = 0, percent = 0;
            const selectedProduct = _q('input[name="product"]:checked');
            let listProductTaxes = localStorage.getItem('currentProductTaxes');
            if (selectedProduct && listProductTaxes) {
                const productId = selectedProduct.value;
                listProductTaxes = JSON.parse(listProductTaxes);
                const taxProduct = listProductTaxes.filter(p => p.productId == productId)[0];
                const jsonProduct = JSON.parse(selectedProduct.dataset.product);
                const productPrice = jsonProduct.productPrices.DiscountedPrice.Value;

                if (taxProduct) {
                    if (taxProduct.tax.taxValue != 0) {
                        tax = taxProduct.tax.taxValue;
                        percent = taxProduct.tax.taxPercentage/100;
                    }
                }
            }

            return {value: tax, percent};
        }

        function _bindTax() {
            window.localStorage.setItem("bindTax", true); // Chinh --- Use for always show Tax line on Confirm page
            window.localStorage.setItem("dfotax", true);
            const tax = getTaxOfProduct();
            const wPrice = getWarrantyPrice();
            const selectedProduct = document.querySelector('input[name="product"]:checked');

            //get currency symbol & format price
            currencySymbol = {
                fCurrency: window.fCurrency,
                formatPrice: JSON.parse(selectedProduct.dataset.product).shippings[0].formattedPrice
            } || {
                fCurrency: window.localStorage.getItem("jsCurrency"),
                formatPrice: JSON.parse(selectedProduct.dataset.product).shippings[0].formattedPrice
            };

            if (selectedProduct) {
                const jsonProduct = JSON.parse(selectedProduct.dataset.product);
                const productPrice = jsonProduct.productPrices.DiscountedPrice.Value;

                const taxesEle = document.querySelectorAll('.taxes-fee, .td-taxes-fees');
                const grandTotalElem = document.querySelectorAll('.grand-total');
                if (taxesEle.length > 0) {
                    //bind tax
                    for(let item of taxesEle) {
                        item.innerHTML = utils.formatPrice(parseFloat(tax.value + (wPrice*tax.percent)).toFixed(2), currencySymbol.fCurrency, currencySymbol.formatPrice);
                    }

                    //bind grand total
                    if (grandTotalElem.length > 0) {
                        const shippingIndex = window.shippingIndex || 0;
                        const totalVal = parseFloat(jsonProduct.shippings[shippingIndex].price + productPrice + parseFloat(tax.value) + (wPrice*tax.percent) + parseFloat(wPrice)).toFixed(2);

                        for(let item of grandTotalElem) {
                            item.innerHTML = utils.formatPrice(totalVal, currencySymbol.fCurrency, currencySymbol.formatPrice);
                        }
                    }
                }
            }
        }

        window.addEventListener('DOMContentLoaded', () => {
            //get country/state from IP address to get taxes
            const timer = setInterval(() => {
                let campProducts = window.localStorage.getItem('campproducts');
                if (campProducts) {
                    campProducts = JSON.parse(campProducts);
                    const camp = campProducts.camps.filter(camp => {
                        return camp[window.siteSetting.webKey];
                    });

                    if (camp && camp.length > 0) {
                        loadTax(camp[0][window.siteSetting.webKey].location.countryCode, camp[0][window.siteSetting.webKey].location.regionCode);
                        clearInterval(timer);
                    }
                }
            }, 500);

            //country
            const countryDdl = document.getElementById('shipping_country');

            //state
            const stateDdl = document.getElementById('shipping_province');

            if (countryDdl && stateDdl) {
                countryDdl.addEventListener('change', () => {
                    loadTax(countryDdl.value, stateDdl.value);
                });

                stateDdl.addEventListener('change', () => {
                    loadTax(countryDdl.value, stateDdl.value);
                    window.localStorage.setItem('countryCode', countryDdl.value);
                    window.localStorage.setItem('stateCode', stateDdl.value);
                });
            }

            //handle changing products
            const productItems = document.querySelectorAll('input[name="product"]');
            for (let item of productItems) {
                item.addEventListener('change', e => {
                    _bindTax();
                });
            }

            //handle apply warranty
            const warrantyInput = document.getElementById('txtProductWarranty');
            if(!!warrantyInput) {
                warrantyInput.addEventListener('change', e => {
                    _bindTax();
                });
            }

            //exit popup - apply tax for coupon
            document.addEventListener('click', e => {
                try {
                    if (e.target.matches('#couponBtn') || e.target.closest('#couponBtn')) {
                        if (window.couponCodeId) {
                            let campProducts = window.localStorage.getItem('campproducts');
                            if (campProducts) {
                                campProducts = JSON.parse(campProducts);
                                const camp = campProducts.camps.filter(camp => {
                                    return camp[window.siteSetting.webKey];
                                });

                                if (camp && camp.length > 0) {
                                    loadTax(camp[0][window.siteSetting.webKey].location.countryCode, camp[0][window.siteSetting.webKey].location.regionCode, window.couponCodeId);
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.log(err);
                }
            });
        });

        window.taxMethod = {
            bindTax: _bindTax
        }
    } catch (err) { console.log(err) }
})(window.utils);
