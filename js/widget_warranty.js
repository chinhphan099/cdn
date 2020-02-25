(function (utils) {
    if (!utils) {
        console.log('utils module is not found');
        return;
    }

    function replaceUserString() {
        if (_qById('js-widget-productwarranty')) {
            const warrantyBodyElem = _q('.w_warranty_content');
            warrantyBodyElem.innerHTML = warrantyBodyElem.innerHTML.replace('{warrantyPrice}', '<span class="spanWarrantyPrice"></span>');
        }
    }
    replaceUserString();

    function registerEvents() {
        utils.events.on('triggerWarranty', initWarranty);
    }
    registerEvents();

    function initWarranty(product) {
        //check warranty widget is exist
        if (_qById('js-widget-productwarranty') && product) {
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
})(window.utils);
