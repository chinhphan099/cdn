((utils) => {
    if(!utils) {
        return false;
    }

    function implementSelectedProduct() {
        const checkedInput = _q('input[name="product"]:checked'),
            checkedItem = _getClosest(checkedInput, '.productRadioListItem');

        _q('.widget_modal_upsell .selected-item .name').innerHTML = checkedItem.querySelector('p').innerHTML;
    }

    function onChangeProductItem() {
        const productInputs = _qAll('input[name="product"]');
        Array.prototype.slice.call(productInputs).forEach(productInput => {
            productInput.addEventListener('change', () => {
                implementSelectedProduct();
            })
        });
    }

    function getMiniUpsellsSelected() {
        let dataItems = _qAll('label[data-upsell][class*="active"]'), arrItem = [];

        Array.prototype.slice.call(dataItems).forEach((dataItem) => {
           arrItem = [...arrItem, JSON.parse(dataItem.dataset.upsell)];
        });

        return arrItem;
    }

    function finishOrder() {
        window.multipleMiniUpsells = getMiniUpsellsSelected();
        if(!!window.ccFlag) {
            window.cc.placeMainOrder('creditcard');
        }
        if(!!window.paypalFlag) {
            window.paypal.placeMainOrder();
        }
    }

    function appendParamIntoUrl(id) {
        let currentUrl = window.location.href,
            param = '';

        if(currentUrl.indexOf(id) > -1) {
            return;
        }
        if(currentUrl.indexOf('?') > -1) {
            param = '&clickid=' + id;
        }
        else {
            param = '?clickid=' + id;
        }
        const newurl = currentUrl + param;
        window.history.pushState({path: newurl}, '', newurl);
    }

    function onSubmitOrder() {
        Array.prototype.slice.call(_qAll('.widget_modal_upsell .close-exitpopup')).forEach(closePopupElm => {
            closePopupElm.addEventListener('click', (e) => {
                appendParamIntoUrl(e.currentTarget.id);
                finishOrder();
            });
        });

        if(!!_qById('btnFinishOrder')) {
            _qById('btnFinishOrder').addEventListener('click', (e) => {
                appendParamIntoUrl(e.currentTarget.id);
                finishOrder();
            });
        }
    }

    function upsellButonEvent() {
        Array.prototype.slice.call(_qAll('.add-to-order')).forEach(addToOrderBtn => {
            addToOrderBtn.addEventListener('click', (e) => {
                appendParamIntoUrl(e.currentTarget.id);
                if(e.currentTarget.classList.contains('actived')) {
                    e.currentTarget.classList.remove('actived');
                }
                else {
                    e.currentTarget.classList.add('actived');
                }
            });
        });
    }

    function bindProducts(data) {
        if (!(data instanceof Error) && data.length > 0) {
            Array.prototype.slice.call(data).forEach(product => {
                try {
                    const radio = _qById('mini_upsell_' + product.productId);
                    const buttonElm = _q('label[for="' + 'upsell_' + product.productId + '"]');
                    if (radio) {
                        let fValue = product.productPrices.DiscountedPrice.FormattedValue.replace(/[,|.]/g, ''),
                            pValue = product.productPrices.DiscountedPrice.Value.toString().replace(/\./, ''),
                            objMiniUpsell = {productId: product.productId, shippingMethodId: product.shippings[0].shippingMethodId};
                        window.fCurrency = fValue.replace(pValue, '######').replace(/\d/g, '');

                        buttonElm.setAttribute('data-upsell', JSON.stringify(objMiniUpsell));

                        if (!!window.removeCurrencySymbol) {
                            try {
                                product.productPrices.DiscountedPrice.FormattedValue = product.productPrices.DiscountedPrice.Value.toFixed(0);
                            }
                            catch (err) {
                                console.log('product.productPrices.DiscountedPrice' + err);
                            }
                        }

                        const wrapElm = _getClosest(_q('div[upsell="' + 'upsell_' + product.productId + '"]'), '.upsell-item');
                        Array.prototype.slice.call(wrapElm.querySelectorAll('.discountedPrice')).forEach(discountedPrice => {
                            let discountedPriceValue = product.productPrices.DiscountedPrice.Value;
                            discountedPrice.insertAdjacentText('beforeend', utils.formatPrice(discountedPriceValue.toFixed(2), window.fCurrency, product.productPrices.DiscountedPrice.FormattedValue));
                        });

                        Array.prototype.slice.call(wrapElm.querySelectorAll('.fullPrice, .fullRetailPriceDeposit')).forEach(fullPrice => {
                            if (!window.isPreOrder || !!product.productPrices.hasOwnProperty('PreSaleAmount1')) {
                                fullPrice.insertAdjacentText('beforeend', product.productPrices.FullRetailPrice.FormattedValue);
                            }
                        });
                    }
                }
                catch (err) {
                    console.log(err);
                }
            });
        }
    }

    function initWidgetMiniUpsells() {
        const eCRM = new EmanageCRMJS({
            webkey: siteSetting.webKey,
            cid: siteSetting.CID,
            lang: '',
            isTest: utils.getQueryParameter('isCardTest') ? true : false
        });
        eCRM.Campaign.getAllMiniUpsells(function (data) {
            if (typeof data !== 'undefined') {
                bindProducts(data);
            }
        });
    }
    initWidgetMiniUpsells();

    function listener() {
        onChangeProductItem();
        onSubmitOrder();
        upsellButonEvent();
    }

    function initial() {
        listener();
    }

    utils.events.on('bindOrderPage', (data) => {
        implementSelectedProduct();
    });
    utils.events.on('onActivePopup', () => {
        implementSelectedProduct();
    });

    window.addEventListener('DOMContentLoaded', () => {
        initial();
    });
})(window.utils);
