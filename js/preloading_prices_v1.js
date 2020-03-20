((utils) => {
    const key = 'campproducts';
    if(!window.siteSetting || !siteSetting.webKey || !siteSetting.CID) {
        return;
    }

    function implementLoadingIcon() {
        for(let quantity = 1; quantity < 6; quantity++) {
            const discountPriceElms = document.querySelectorAll(`.discountPrice_${quantity}`);
            Array.prototype.slice.call(discountPriceElms).forEach(elm => {
                elm.innerHTML = '<img width="20" height="10" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" data-src="//d16hdrba6dusey.cloudfront.net/sitecommon/images/loading-price-v1.gif" />';
            });
            const depositDiscountPriceElms = document.querySelectorAll(`.depositDiscountPrice_${quantity}`);
            Array.prototype.slice.call(depositDiscountPriceElms).forEach(elm => {
                elm.innerHTML = '<img width="20" height="10" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" data-src="//d16hdrba6dusey.cloudfront.net/sitecommon/images/loading-price-v1.gif" />';
            });
        }
    }

    function addCurrencyIntoData(data) {
        let fValue = data.prices[0].productPrices.DiscountedPrice.FormattedValue.replace(/[,|.]/g, '');
        let pValue = data.prices[0].productPrices.DiscountedPrice.Value.toString().replace(/\./, '');
        data.fCurrency = fValue.replace(pValue, '######').replace(/\d/g, '');

        const currencyElms = document.querySelectorAll('.jsCurrencyNumber');
        Array.prototype.slice.call(currencyElms).forEach(currencyElm => {
            currencyElm.innerText = data.fCurrency.replace('######', currencyElm.textContent);
        });
        return data;
    }

    function implementPrice(product, fCurrency, quantity) {
        try {
            const discountPriceElms = document.querySelectorAll(`.discountPrice_${quantity}`);
            Array.prototype.slice.call(discountPriceElms).forEach(elm => {
                elm.textContent = product.productPrices.DiscountedPrice.FormattedValue;
            });
            const depositDiscountPriceElms = document.querySelectorAll(`.depositDiscountPrice_${quantity}`);
            Array.prototype.slice.call(depositDiscountPriceElms).forEach(elm => {
                elm.textContent = utils.formatPrice(Math.round(product.productPrices.DiscountedPrice.Value), fCurrency, product.productPrices.DiscountedPrice.FormattedValue);
            });
        }
        catch (err) {
            console.log(err);
        }
    }

    function loopData(data) {
        if(!(data instanceof Error) && data.prices.length > 0) {
            for(let i = 0; i < data.prices.length; i++){
                if(data.prices[i].quantity > 5){
                    window.isDoubleQuantity = true;
                    break;
                }
            }
            Array.prototype.slice.call(data.prices).forEach(product => {
                try {
                    let quantity = product.quantity;
                    if(!!window.isDoubleQuantity) {
                        quantity /= 2;
                    }
                    implementPrice(product, data.fCurrency, quantity);
                }
                catch (err) {
                    console.log(err);
                }
            });
        }
    }

    function getDataFromLSAndEmit(webKey) {
        let campProducts = JSON.parse(localStorage.getItem(key));
        const camps = campProducts.camps.filter(item => {
            return item[webKey];
        });
        if(camps[0][webKey].prices.length > 0) {
            const emitData = addCurrencyIntoData(camps[0][webKey]);
            loopData(emitData);
            if(!!utils) {
                utils.events.emit('bindData', emitData);
            }
        }
    }

    function checkCamp(webKey) {
        let isExisted = true;
        let campProducts = localStorage.getItem(key);
        if(campProducts) {
            try {
                campProducts = JSON.parse(campProducts);
                const camps = campProducts.camps.filter(item => {
                    return item[webKey];
                });

                if(camps.length > 0) {
                    const beforeDate = new Date(camps[0][webKey].timestamp);
                    const newDate = new Date();
                    const res = Math.abs(newDate - beforeDate) / 1000;
                    const minutes = Math.floor(res / 60);
                    //console.log('check time of keeping prices in local storage: ', minutes);
                    if(minutes > 1) isExisted = false;
                } else {
                    isExisted = false;
                }
            } catch (err) {
                console.log(err);
                isExisted = false;
            }
        } else {
            isExisted = false;
        }
        return isExisted;
    }

    function init() {
        if(checkCamp(siteSetting.webKey)) {
            getDataFromLSAndEmit(siteSetting.webKey);
            return;
        }

        const url = `https://websales-api.tryemanagecrm.com/api/campaigns/${siteSetting.webKey}/products/prices`;
        const options = {
            headers: {
                X_CID: siteSetting.CID
            }
        }

        fetch(url, options)
            .then(res => {
                try {
                    return res.json();
                } catch (err) {
                    console.log('Parse json error: ', err);
                }
            })
            .then(data => {
                try {
                    console.log('loading prices');
                    const emitData = addCurrencyIntoData(data);
                    loopData(emitData);
                    if(!!utils) {
                        utils.events.emit('bindData', emitData);
                    }
                    //store in localStorage
                    let campProducts = localStorage.getItem(key);
                    if(campProducts) {
                        campProducts = JSON.parse(campProducts);
                    }
                    else {
                        campProducts = {
                            camps: []
                        }
                    }

                    if(typeof data.prices !== 'undefined') {
                        data.timestamp = new Date().toISOString();

                        const camps = campProducts.camps.filter(item => {
                            return item[siteSetting.webKey];
                        });

                        let camp = {};
                        if(camps.length > 0) {
                            camp = camps[0];
                            camp[siteSetting.webKey] = data;
                        }
                        else {
                            camp[siteSetting.webKey] = data;
                            campProducts.camps.push(camp);
                        }

                        localStorage.setItem(key, JSON.stringify(campProducts));
                    }
                } catch (err) {
                    console.log(err);
                }
            })
            .catch(err => {
                console.log(err);
            });
    }

    document.addEventListener('DOMContentLoaded', () => {
        implementLoadingIcon();
    });
    window.addEventListener('load', () => {
        init();
    });
})(window.utils);
