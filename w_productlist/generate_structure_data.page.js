((utils) => {
    if (!utils) { return; }

    function generateStructureData(data) {
        try {
            const productItems = data.prices;
            if (productItems.length > 0) {
                const imgUrl = document.querySelector('.w_fomo_wrapper .w_thumb img').dataset.src || document.querySelector('.w_fomo_wrapper .w_thumb img').src;
                const singleProductItem = productItems.find(item => {
                    let qty = 1;
                    if (window.isDoubleQuantity) {
                        qty = 2;
                    }
                    return item.quantity === qty
                });
                const offer = {
                    '@type': 'Offer',
                    'sku': singleProductItem.sku,
                    'name': singleProductItem.productName,
                    'price': singleProductItem.productPrices.DiscountedPrice.Value,
                    'priceCurrency': singleProductItem.productPrices.DiscountedPrice.GlobalCurrencyCode || data.location.currencyCode,
                    'availability': 'InStock',
                    'url': location.href,
                    'priceValidUntil': ''
                };
                const jsondLD = {
                    '@context': 'http://schema.org/',
                    '@type': 'Product',
                    'name': js_translate.productName ? js_translate.productName : offer.name || "",
                    'image': imgUrl,
                    'offers': offer
                };

                const script = `<script type="application/ld+json">${JSON.stringify(jsondLD)}</script>`;
                document.querySelector('head').insertAdjacentHTML('beforeend', script);
            }
            else {
                return;
            }
        } catch (err) {
            console.log('err: generate structure data for SEO');
        }
    }
    utils.events.on('triggerQuantity', generateStructureData);
})(window.utils);
