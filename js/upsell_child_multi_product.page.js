((utils) => {
    if(!utils) {
        return;
    }

    const prodArr = [];
    const productNameText = !!_q('.statistical .td-name') && _q('.statistical .td-name').innerText || '';
    function replaceBracketsStrings() {
        const allElements = _qAll('body *');
        for(let elem of allElements) {
            if(elem.children.length === 0 || elem.tagName.toLowerCase() === 'span') {
                elem.innerHTML = elem.innerHTML.replace(/{unitprice}/g, '<span class="spanUnitUpsellPrice"></span>');
                elem.innerHTML = elem.innerHTML.replace(/{unitfullprice}/g, '<span class="spanUnitFullPrice"></span>');
            }
        }
    }
    replaceBracketsStrings();

    function implementSelectedProduct(data) {
        window.upsell_productindex = prodArr.indexOf(data.productId);

        // Update price and full price elements
        const spanUpsellPriceElems = _qAll('.spanUpsellPrice');
        for(let spanUpsellPrice of spanUpsellPriceElems) {
            spanUpsellPrice.innerHTML = data.discountPrice;
        }

        const spanFullPriceElems = _qAll('.spanFullPrice');
        for(let spanFullPrice of spanFullPriceElems) {
            spanFullPrice.innerHTML = data.fullPrice;
        }

        const spanUnitPriceElems = _qAll('.spanUnitUpsellPrice');
        for(let spanUnitPriceElem of spanUnitPriceElems) {
            spanUnitPriceElem.innerHTML = data.unitDiscountPrice;
        }

        const spanUnitFullPriceElems = _qAll('.spanUnitFullPrice');
        for(let spanUnitFullPriceElem of spanUnitFullPriceElems) {
            spanUnitFullPriceElem.innerHTML = data.unitFullPrice;
        }

        // Update statistical informations
        if(!!_q('.statistical')) {
            _q('.statistical .td-name').innerHTML = productNameText + ' ' + data.productName;
            _q('.statistical .td-price').innerText = data.discountPrice;
            _q('.statistical .td-shipping').innerText = data.priceShipping;
            _q('.statistical .grand-total').innerText = data.discountPrice;
        }
    }
    function getSelectedProduct() {
        let result = {}, shippingValue = 0, priceShipping = window.js_translate.free || 'free';
        const checkedItem = _q('input[name="product"]:checked'),
            product = JSON.parse(checkedItem.dataset.product),
            fValue = product.productPrices.DiscountedPrice.FormattedValue.replace(/[,|.]/g, ''),
            pValue = product.productPrices.DiscountedPrice.Value.toString().replace(/\./, ''),
            fCurrency = fValue.replace(pValue, '######').replace(/\d/g, '');

        const prodItems = _qAll('.productRadioListItem');
        for(let prodItem of prodItems) {
            prodItem.classList.remove('checked-item');
        }
        _getClosest(checkedItem, '.productRadioListItem').classList.add('checked-item');

        if(product.shippings.length > 0) {
            let shipping = product.shippings[0];
            if(shipping.price !== 0) {
                priceShipping = shipping.formattedPrice;
                shippingValue = shipping.price;
            }
        }

        let unitFullRateText = product.productPrices.FullRetailPrice.FormattedValue,
            unitFullRateValue = product.productPrices.FullRetailPrice.Value;
        if(typeof product.productPrices.UnitFullRetailPrice !== 'undefined') {
            unitFullRateText = product.productPrices.UnitFullRetailPrice.FormattedValue;
            unitFullRateValue = product.productPrices.UnitFullRetailPrice.Value;
        }

        result = {
            productId: product.productId,
            productName: _getClosest(checkedItem, '.productRadioListItem').querySelector('.product-name p').innerHTML,
            priceShipping: priceShipping,
            shippingValue: shippingValue,
            discountPrice: product.productPrices.DiscountedPrice.FormattedValue,
            discountPriceValue: product.productPrices.DiscountedPrice.Value,
            unitDiscountPrice: product.productPrices.UnitDiscountRate.FormattedValue,
            unitDiscountPriceValue: product.productPrices.UnitDiscountRate.Value,
            fullPrice: product.productPrices.FullRetailPrice.FormattedValue,
            fullPriceValue: product.productPrices.FullRetailPrice.Value,
            unitFullPrice: unitFullRateText,
            unitFullPriceValue: unitFullRateValue,
            currencyCode: product.productPrices.FullRetailPrice.GlobalCurrencyCode != null ? product.productPrices.FullRetailPrice.GlobalCurrencyCode : '',
            fCurrency: fCurrency
        };

        implementSelectedProduct(result);
    }
    function createArrayProducts(data) {
        for(let item of data.prices) {
            prodArr.push(item.productId);
        }
        getSelectedProduct();
    }
    function listenEvents() {
        utils.events.on('triggerQuantity', createArrayProducts);
    }
    listenEvents();

    function onChangeProduct() {
        const inputs = _qAll('.productRadioListItem input');
        for (let input of inputs) {
            input.addEventListener('change', () => {
                getSelectedProduct();
            }, false);
        }
    }

    function listener() {
        onChangeProduct();
    }

    function initial() {
        listener();
    }

    window.addEventListener('load', () => {
        initial();
    });
})(window.utils);
