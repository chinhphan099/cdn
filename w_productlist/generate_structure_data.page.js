((utils) => {
    if (!utils) { return; }

    function generateStructureData(data) {
        try {
            const productItems = data.prices;
            if (productItems.length > 0) {
                const imgUrl = document.querySelector('.w_fomo_wrapper .w_thumb img').dataset.src || document.querySelector('.w_fomo_wrapper .w_thumb img').src;
                const productArr = productItems.map(item => {
                    return {
                        '@type': 'Offer',
                        'sku': item.sku,
                        'name': item.productName,
                        'price': item.productPrices.DiscountedPrice.Value,
                        'priceCurrency': window.localStorage.getItem('currencyCode'),
                        'availability': 'InStock'
                    }
                });
                const jsondLD = {
                    '@context': 'http://schema.org/',
                    '@type': 'Product',
                    'name': js_translate.productName ? js_translate.productName : productArr[0].name || "",
                    'image': imgUrl,
                    'offers': productArr
                };

                const script = `<script style="application/ld+json">${JSON.stringify(jsondLD)}</script>`;
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
