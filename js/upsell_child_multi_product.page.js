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

        const spanFullPriceElems = _qAll('.spanFullPrice, .full-price');
        for(let spanFullPrice of spanFullPriceElems) {
            spanFullPrice.innerHTML = data.fullPrice;
        }

        const spanSavePriceElems = _qAll('.spanSavePrice, .save-price');
        for(let spanSavePrice of spanSavePriceElems) {
            spanSavePrice.innerHTML = data.savePrice;
        }

        const spanUnitPriceElems = _qAll('.spanUnitUpsellPrice, .unit-price');
        for(let spanUnitPriceElem of spanUnitPriceElems) {
            spanUnitPriceElem.innerHTML = data.unitDiscountPrice;
        }

        const spanUnitFullPriceElems = _qAll('.spanUnitFullPrice');
        for(let spanUnitFullPriceElem of spanUnitFullPriceElems) {
            spanUnitFullPriceElem.innerHTML = data.unitFullPrice;
        }

        const upsellNameElms = _qAll('.pro-name');
        for(let upsellNameElm of upsellNameElms) {
            upsellNameElm.innerHTML = data.productName;
        }

        const quantityElms = _qAll('.jsquantity');
        for(let quantityElm of quantityElms) {
            quantityElm.innerHTML = data.quantity;
        }

        const quantityDdlElms = _qAll('.quantityDdl');
        for(let quantityDdlElm of quantityDdlElms) {
            quantityDdlElm.value = data.quantity - 1;
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

        let taxData;
        if (window.productsTaxes) {
            taxData = window.productsTaxes.find((tax) => {
                return tax.productId === product.productId
            });
        }
        let discountedPriceValue = product.productPrices.DiscountedPrice.Value;
        const savePriceValue = (product.productPrices.FullRetailPrice.Value - discountedPriceValue).toFixed(2);
        if (taxData) {
            discountedPriceValue += taxData.tax.taxValue;
        }

        const unitDiscountedPriceValue = (discountedPriceValue / product.quantity).toFixed(2);
        const fullPriceValue = product.productPrices.FullRetailPrice.Value;

        result = {
            productId: product.productId,
            quantity: product.quantity,
            productName: _getClosest(checkedItem, '.productRadioListItem').querySelector('.product-name p').innerHTML,
            priceShipping: priceShipping,
            shippingValue: shippingValue,

            discountPriceValue: discountedPriceValue,
            discountPrice: utils.formatPrice(discountedPriceValue, fCurrency, product.shippings[0].formattedPrice),

            unitDiscountPriceValue: unitDiscountedPriceValue,
            unitDiscountPrice: utils.formatPrice(unitDiscountedPriceValue, fCurrency, product.shippings[0].formattedPrice),

            fullPriceValue: fullPriceValue,
            fullPrice: utils.formatPrice(fullPriceValue, fCurrency, product.shippings[0].formattedPrice),

            savePriceValue: savePriceValue,
            savePrice: utils.formatPrice(savePriceValue, fCurrency, product.shippings[0].formattedPrice),

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
        Array.prototype.slice.call(inputs).forEach((input) => {
            input.addEventListener('change', () => {
                getSelectedProduct();
            }, false);
        });
    }

    function onChangeDropdown() {
        const quantityDdls = _qAll('.quantityDdl');
        Array.prototype.slice.call(quantityDdls).forEach((quantityDdl) => {
            quantityDdl.addEventListener('change', function() {
                _qAll('input[name="product"]')[this.value].click();
            });
        });
    }

    function listener() {
        onChangeProduct();
        onChangeDropdown();
    }

    function initial() {
        listener();
    }

    window.addEventListener('DOMContentLoaded', () => {
        initial();
    });
})(window.utils);
