((utils) => {
    'use strict';

    if (!utils) { return; }

    let mainQuantity, miniUpsells = [];

    const warrantyCb = _qById('warrantyCb');
    function removeWarrantyItem() {
        Array.prototype.slice.call(_qAll('.warranty-item')).forEach((item) => {
            item.parentNode.removeChild(item);
        });
    }

    function getSelectedProduct() {
        const selectedProductData = JSON.parse(_q('input[name="product"]:checked').dataset.product),
            selectedProduct = {
                discountedPrice: 0,
                savePrice: 0,
                shippingFee: 0
            };

        if (!!selectedProductData) {
            selectedProduct.discountedPrice = selectedProductData.productPrices.DiscountedPrice.Value;
            selectedProduct.savePrice = selectedProductData.productPrices.SavePrice.Value;
            selectedProduct.shippingFee = selectedProductData.shippings[0].price;
        }

        return selectedProduct;
    }

    function renderWarrantyOnSummary(warrantyMini) {
        const warrantyPrice = warrantyMini.productPrices.DiscountedPrice.FormattedValue,
            warrantyItem = `<tr class="warranty-item"><td>${js_translate.lifetimeWarranty || 'Lifetime Warranty'}</td><td>${warrantyPrice}</td></tr>`,
            mainProduct = getSelectedProduct(),
            grandTotalPrice = mainProduct.discountedPrice + mainProduct.shippingFee,
            grandTotalPriceLW = grandTotalPrice + warrantyMini.productPrices.DiscountedPrice.Value;

        if (!!warrantyCb.checked) {
            _q('.tr-name').insertAdjacentHTML('afterend', warrantyItem);
            _q('.grand-total').textContent = utils.formatPrice(grandTotalPriceLW.toFixed(2), window.fCurrency, warrantyPrice);
        }
        else {
            _q('.grand-total').textContent = utils.formatPrice(grandTotalPrice.toFixed(2), window.fCurrency, warrantyPrice);
        }
    }

    function saveMiniUpsells() {
        if (miniUpsells.length === 0) { return; }

        window.multipleMiniUpsells = [];
        const warrantyMini = [];

        removeWarrantyItem();

        const warrantyPids = _q('.warranty-box_item').dataset.pid.split(',');
        const warrantyItem = miniUpsells.filter(item => {
            return Number(warrantyPids[mainQuantity - 1]) === item.productId;
        })[0];

        _q('.warranty-price').textContent = warrantyItem.productPrices.DiscountedPrice.FormattedValue;

        if (warrantyCb.checked) {
            warrantyMini.push({
                'productId': warrantyItem.productId,
                'shippingMethodId': warrantyItem.shippings[0].shippingMethodId
            });
        }

        // Update SUMMARY
        renderWarrantyOnSummary(warrantyItem);

        window.multipleMiniUpsells = [...warrantyMini];
        console.log(window.multipleMiniUpsells);
    }

    function listener() {
        warrantyCb.addEventListener('change', saveMiniUpsells);
    }

    function getMiniUpsell(){
        const eCRM = new EmanageCRMJS({
            webkey: siteSetting.webKey,
            cid: siteSetting.CID,
            lang: '',
            isTest: utils.getQueryParameter('isCardTest') ? true : false
        });

        eCRM.Campaign.getAllMiniUpsells((result) => {
            miniUpsells = [...result];
            saveMiniUpsells();
        });
    }
    getMiniUpsell();

    window.addEventListener('load', () => {
        listener();
    });

    function fireSelectedProduct(selectedProduct) {
        mainQuantity = selectedProduct.quantity;
        if (window.isDoubleQuantity) {
            mainQuantity = selectedProduct.quantity / 2;
        }

        saveMiniUpsells();
    }
    utils.events.on('triggerWarranty', fireSelectedProduct);
})(window.utils);
