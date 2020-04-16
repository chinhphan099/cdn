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

    function handlerPidMiniUpsell(checkedItems) {
        if(!checkedItems.length || typeof miniUpsellPackages === 'undefined' || !miniUpsellPackages.length) {
            return;
        }

        for(let miniPack of miniUpsellPackages) {
            if(miniPack.names.length === checkedItems.length) {
                if(!miniPack.names.every(name => checkedItems.indexOf(name) > -1)) {
                    continue;
                }

                _qById('txtMiniUpsellPID').checked = true;
                _qById('txtMiniUpsellPID').dataset.id = miniPack.miniUpsellId;
                _qById('txtMiniUpsellShippingID').dataset.id = miniPack.miniUpsellShippingId;
                break;
            }
        }
    }

    function miniUpsellHandler() {
        let dataItems = _qAll('label[data-item][class*="active"]'), arrItem = [];

        Array.prototype.slice.call(dataItems).forEach((dataItem) => {
            arrItem = [...arrItem, dataItem.dataset.item];
        });

        handlerPidMiniUpsell(arrItem);
    }

    function finishOrder() {
        miniUpsellHandler();
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
                    if(e.currentTarget.dataset.warranty === 'true') {
                        _qById('txtProductWarranty').checked = false;
                    }
                }
                else {
                    e.currentTarget.classList.add('actived');
                    if(e.currentTarget.dataset.warranty === 'true') {
                        _qById('txtProductWarranty').checked = true;
                    }
                }
            });
        });
    }

    function initWarranty(product) {
        if (product) {
            try {
                const warrantyRate = [0.1, 0.2, 0.2, 0.2, 0.2, 0.3, 0.5, 0.15, 0.25, 0.35, 0.4, 0.45, 0.55, 0.6];
                const funnelId = _qById('txtProductWarranty').value;
                const funnelPrice = warrantyRate[parseInt(funnelId) - 1];

                const fvalue = product.productPrices.DiscountedPrice.FormattedValue.replace(/[,|.]/g, '');
                const pValue = product.productPrices.DiscountedPrice.Value.toString().replace(/\./, '');
                const fCurrency = fvalue.replace(pValue, '######').replace(/\d/g, '');

                let warrantyPrice = (Math.round(100 * product.productPrices.DiscountedPrice.Value * funnelPrice) / 100).toFixed(2);
                if(product.productPrices.DiscountedPrice.FormattedValue.indexOf(',') >= 0) {
                    warrantyPrice = warrantyPrice.toString().replace('.', ',');
                }
                if(_q('span.spanWarrantyPrice')) {
                    _q('span.spanWarrantyPrice').innerHTML = fCurrency.replace('######', warrantyPrice);
                }
            } catch (err) {
                console.log('init Warranty error: ', err);
            }
        }
    }

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
    utils.events.on('triggerWarranty', (data) => {
        initWarranty(data);
    });

    window.addEventListener('DOMContentLoaded', () => {
        initial();
    });
})(window.utils);
