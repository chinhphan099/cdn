((utils) => {
    // TODO: Get multiple upsell product => Filter get selected product by window.upsell_productindex
    if (!utils) {
        console.log('utils module is not found');
        return;
    }
    var isTaxApply = false;
    window.taxArray = [];
    const fCurrency = utils.localStorage().get('jsCurrency');

    let taxProducts = window.localStorage.getItem('taxProducts');
    if (!taxProducts) { return; }


    function _bindPrice() {
        if(!isTaxApply) return;

        const taxUpsellItem = window.taxArray[window.upsell_productindex];
        const spanUpsellPriceElems = Array.prototype.slice.call(_qAll('.spanUpsellPrice'));
        const formatedPrice = window.upsell.products[window.upsell_productindex].productPrices.DiscountedPrice.FormattedValue;
        for (let spanUpsellPrice of spanUpsellPriceElems) {
            spanUpsellPrice.style.display = 'none';
        }

        const totalPrice = (taxUpsellItem.totalPrice || 0) + (taxUpsellItem.taxAmount || 0);
        spanUpsellPriceElems.forEach(spanUpsellPrice => {
            spanUpsellPrice.textContent = utils.formatPrice(totalPrice.toFixed(2), fCurrency, formatedPrice);
            spanUpsellPrice.removeAttribute('style');
        });

        Array.prototype.slice.call(_qAll('.unit-price')).forEach((elm) => {
            const qty = window.isDoubleQuantity ? window.upsell.products[window.upsell_productindex].quantity / 2 : window.upsell.products[window.upsell_productindex].quantity;
            const unitPrice = totalPrice / qty;
            elm.textContent = utils.formatPrice(unitPrice.toFixed(2), fCurrency, formatedPrice);
        });
    }

    function loadTax(products) {
        const eCRM = new EmanageCRMJS({
            webkey: siteSetting.webKey,
            cid: siteSetting.CID,
            lang: '',
            isTest: utils.getQueryParameter('isCardTest') ? true : false
        });

        products = products.map((item) => {
            return {
                'productId': item.productId,
                'sku': item.sku,
                'quantity': 1,
                'unitPrice': item.productPrices.DiscountedPrice.Value,
                'totalPrice': item.productPrices.DiscountedPrice.Value + item.shippings[0].price,
                'description': item.productName
            }
        });

        const postData = {
            items: products,
            customerAddress: JSON.parse(window.localStorage.getItem('customerAddress'))
        };

        const options = {
            method: 'POST',
            headers: {
                //'auth-token': 'd1118704-9a34-41ef-b8bd-fc8fa52f8baf'
                'X_CID': siteSetting.CID
            },
            data: postData
        };

        if (window.taxArray.length > 0) {
            _bindPrice();
            return;
        }

        const url = `${eCRM.Order.baseAPIEndpoint}/orders/CreateEstimate`;
        utils.callAjax(url, options)
            .then((result) => {
                if (!result) {
                    isTaxApply = false;
                    return;
                }
                window.taxArray = result.items

                const taxProductsJSON = JSON.parse(taxProducts);

                taxProductsJSON.upsells = taxProductsJSON.upsells || [];
                for (let i = 0, n = window.taxArray.length; i < n; i++) {
                    taxProductsJSON.upsells.push({
                        productId: window.taxArray[i].productId,
                        sku: window.taxArray[i].sku,
                        taxAmount: window.taxArray[i].taxAmount
                    });
                }
                // ! Save all tax to local storage
                window.localStorage.setItem('taxProducts', JSON.stringify(taxProductsJSON));
                isTaxApply = true;
                _bindPrice();
            })
            .catch(() => {
                isTaxApply = false;
                _bindPrice();
                console.log('load tax error');
            });
    }

    function init() {
        const timer = setInterval(() => {
            if (window.upsell && window.upsell.products.length > 0) {
                const products = window.upsell.products;//[window.upsell_productindex];
                loadTax(products);
                clearInterval(timer);
            }
        }, 300);
    }

    function listener() {
        const productItems = Array.prototype.slice.call(_qAll('input[name="product"]'));
        productItems.forEach(item => {
            item.addEventListener('change', () => {
                setTimeout(_bindPrice, 600);
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        init();
        listener();
    });
})(window.utils);
