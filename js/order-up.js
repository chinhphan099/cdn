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
            });
        });
    }

    function handlerPidMiniUpsell(arr) {
        const itemLength = arr.length;
        if(itemLength > 0) {
            _qById('txtMiniUpsellPID').checked = true;
        }
        switch (itemLength) {
            case 1:
                _qById('txtMiniUpsellShippingID').dataset.id = 517;
                if(arr.indexOf('mobileklean') > -1) {
                    _qById('txtMiniUpsellPID').dataset.id = 849;
                }
                else if(arr.indexOf('feverpatrol') > -1) {
                    _qById('txtMiniUpsellPID').dataset.id = 879;
                }
                break;
            case 2:
                _qById('txtMiniUpsellShippingID').dataset.id = 518;
                if(arr.indexOf('mobileklean') > -1 && arr.indexOf('feverpatrol') > -1) {
                    _qById('txtMiniUpsellPID').dataset.id = 2312;
                }
                break;
        }
    }

    function miniUpsellHandler() {
        let dataItems = _qAll('label[data-item][class*="active"]'),
            arrItem = [];
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
        if(!!_q('.widget_modal_upsell .close-exitpopup')) {
            _q('.widget_modal_upsell .close-exitpopup').addEventListener('click', (e) => {
                appendParamIntoUrl(e.currentTarget.id);
                finishOrder();
            });
        }

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
                if(_q('span.spanWarrantyPrice')) _q('span.spanWarrantyPrice').innerHTML = fCurrency.replace('######', warrantyPrice);
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

    function waitingData() {
        utils.events.on('bindOrderPage', (data) => {
            implementSelectedProduct();
        });
        utils.events.on('onActivePopup', () => {
            implementSelectedProduct();
        });
        utils.events.on('triggerWarranty', (data) => {
            initWarranty(data);
        });
    }
    waitingData();

    window.addEventListener('DOMContentLoaded', () => {
        initial();
    });
})(window.utils);
