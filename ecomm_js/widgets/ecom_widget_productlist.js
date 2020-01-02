import { constants } from '../common/constant.js';
import Utils from '../common/utils.js';

export default class ProductList {
    constructor() {
        this.isPopup = Utils.getQueryParameter('et') === '1';
        this.packages = [];
        this.ecommjs = new EcommJS({
            webkey: siteSetting.WEBKEY,
            cid: siteSetting.CID
        });
    }

    formatPrice(price, formatedPrice) {
        if (formatedPrice.indexOf(',') > -1) {
            return this.fCurrency.replace('######', price.toString().replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')); // x.xxx.xxx,xx
        }
        return this.fCurrency.replace('######', price.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')); // x,xxx,xxx.xx
    }

    sliceArray() {
        return Function.prototype.call.apply(Array.prototype.slice, arguments);
    }

    generateEvents() {
        const event = {};
        this.events = {
            on: function(eventName, fn) {
                event[eventName] = event[eventName] || [];
                event[eventName].push(fn);
            },
            off: function(eventName, fn) {
                if (event[eventName]) {
                    for (let i = 0; i < event[eventName].length; i++) {
                        if (event[eventName][i] === fn) {
                            event[eventName].splice(i, 1);
                            break;
                        }
                    }
                }
            },
            emit: function(eventName, data) {
                let count = 0;
                const timer = setInterval(() => {
                    count++;
                    if (count >= 50) { //20 * 200 = 10 seconds
                        clearInterval(timer);
                    }

                    if (event[eventName]) {
                        clearInterval(timer);
                        Array.prototype.slice.call(event[eventName]).forEach(function (fn) {
                            fn(data);
                        });
                    }
                }, 200);
            }
        };
    }

    q(selector) {
        var qSelector = document.querySelectorAll(selector);

        return {
            addClass: function(className) {
                for(let elm of qSelector) {
                    elm.classList.add(className);
                }
            },
            removeClass: function(className) {
                for(let elm of qSelector) {
                    elm.classList.remove(className);
                }
            }
        }
    }

    // Product List
    checkCamp(webKey) {
        let isExisted = true,
            campProducts = localStorage.getItem('campproducts');

        if (campProducts) {
            try {
                campProducts = JSON.parse(campProducts);
                const camps = campProducts.camps.filter(item => {
                    return item[webKey];
                });

                if (camps.length > 0) {
                    const beforeDate = new Date(camps[0][webKey].timestamp);
                    const newDate = new Date();
                    const res = Math.abs(newDate - beforeDate) / 1000;
                    const minutes = Math.floor(res / 60);

                    if (minutes > 1) {
                        isExisted = false;
                    }
                }
                else {
                    isExisted = false;
                }
            }
            catch (err) {
                console.log(err);
                isExisted = false;
            }
        }
        else {
            isExisted = false;
        }
        return isExisted;
    }
    removeRedundantFields(product) {
        delete product.customFields;
        delete product.message;
        delete product.productDisplayName;
        delete product.productName;
        delete product.productTypeName;
        delete product.warrantyPeriod;
        delete product.warrantyTypeId;
        delete product.productPrices.Surcharge;
        return product
    }
    bindProducts(data) {
        console.log(data);
        const countryCodeIndex = localStorage.getItem('countryCodeIndex');
        if(!(data instanceof Error) && data.prices.length > 0) {
            this.sliceArray(data.prices).forEach(product => {
                try {
                    const productInput = document.getElementById('product_' + product.productId);
                    if(productInput) {
                        product = this.removeRedundantFields(product);

                        // Save RootDiscountedPrice: use this field to save into local cart after update price from coupon code
                        product.productPrices.RootDiscountedPrice = {
                            Value: product.productPrices.DiscountedPrice.Value,
                            FormattedValue: product.productPrices.DiscountedPrice.FormattedValue
                        }
                        productInput.setAttribute('data-product', JSON.stringify(product));

                        const fValue = product.productPrices.DiscountedPrice.FormattedValue.replace(/[,|.]/g, ''),
                            pValue = product.productPrices.DiscountedPrice.Value.toString().replace(/\./, '');
                        this.fCurrency = fValue.replace(pValue, '######').replace(/\d/g, '');

                        // Hide All Image loading
                        this.q('.js-img-loading').addClass('hidden');

                        // Shipping Fee
                        const elemShippingFees = document.querySelectorAll('label[for="' + 'product_' + product.productId + '"] span.jsShippingFee');
                        this.sliceArray(elemShippingFees).forEach(elemShippingFee => {
                            let shippingFeeText = '';
                            if(product.shippings[0].price !== 0) {
                                if(!window.js_translate.shippingFee) {
                                    window.js_translate.shippingFee = '{price} Shipping';
                                }
                                shippingFeeText = window.js_translate.shippingFee.replace('{price}', product.shippings[0].formattedPrice);
                            }
                            else {
                                shippingFeeText = !!window.js_translate.FREESHIP ? window.js_translate.FREESHIP : 'FREE SHIPPING';
                            }
                            let shippingFeeTextNode = document.createTextNode(shippingFeeText);
                            elemShippingFee.appendChild(shippingFeeTextNode);
                        });

                        // Unit discount rate
                        const elemUnitDiscountRate = document.querySelectorAll('label[for="' + 'product_' + product.productId + '"] span.spanUnitDiscountRate');
                        this.sliceArray(elemUnitDiscountRate).forEach(unitDiscountRate => {
                            let unitDiscountRateTextNode = document.createTextNode(product.productPrices.UnitDiscountRate.FormattedValue);
                            unitDiscountRate.appendChild(unitDiscountRateTextNode);
                        });

                        // Unit Full Rate
                        const elemUnitFullRate = document.querySelectorAll('label[for="' + 'product_' + product.productId + '"] span.spanUnitFullRate');
                        this.sliceArray(elemUnitFullRate).forEach(unitFullRate => {
                            let unitFullRateText = '';
                            if(typeof product.productPrices.UnitFullRetailPrice !== 'undefined') {
                                unitFullRateText = product.productPrices.UnitFullRetailPrice.FormattedValue;
                            }
                            else {
                                unitFullRateText = product.productPrices.FullRetailPrice.FormattedValue;
                            }

                            let unitFullRateTextNode = document.createTextNode(unitFullRateText);
                            unitFullRate.appendChild(unitFullRateTextNode);
                        });

                        // Discount Price
                        const elemDiscountedPrice = document.querySelectorAll('label[for="' + 'product_' + product.productId + '"] .discountedPrice');
                        this.sliceArray(elemDiscountedPrice).forEach(discountedPrice => {
                            let discountedPriceTextNode = document.createTextNode(product.productPrices.DiscountedPrice.FormattedValue);
                            discountedPrice.appendChild(discountedPriceTextNode);
                        });

                        // Total Discounted Price (include shipping fee) - Not USE yet
                        const elemTotalDiscountPrice = document.querySelectorAll('label[for="' + 'product_' + product.productId + '"] .spanTotalDiscountPriceElm');
                        this.sliceArray(elemTotalDiscountPrice).forEach(totalDiscountPrice => {
                            let totalDiscountPriceValue = (product.productPrices.DiscountedPrice.Value + product.shippings[0].price).toFixed(2);
                            let totalDiscountPriceText = this.fCurrency.replace('######', totalDiscountPriceValue);
                            let totalDiscountPriceTextNode = document.createTextNode(totalDiscountPriceText);
                            totalDiscountPrice.appendChild(totalDiscountPriceTextNode);
                        });

                        // Full Price
                        const elemFullPrice = document.querySelectorAll('label[for="' + 'product_' + product.productId + '"] .fullPrice');
                        this.sliceArray(elemFullPrice).forEach(fullPrice => {
                            let fullPriceTextNode = document.createTextNode(product.productPrices.FullRetailPrice.FormattedValue);
                            fullPrice.appendChild(fullPriceTextNode);
                        });

                        // Saved Price
                        const elemSavePrice = document.querySelectorAll('label[for="' + 'product_' + product.productId + '"] .savePrice');
                        this.sliceArray(elemSavePrice).forEach(savePrice => {
                            let savePriceValue = (product.productPrices.FullRetailPrice.Value - product.productPrices.DiscountedPrice.Value).toFixed(2);
                            let savePriceText = this.fCurrency.replace('######', savePriceValue);
                            let savePriceTextNode = document.createTextNode(savePriceText);
                            savePrice.appendChild(savePriceTextNode);
                        });
                    }
                } catch (err) {
                    console.log(err);
                }
            });

            const currencyElms = document.querySelectorAll('.currency');
            this.sliceArray(currencyElms).forEach(currencyElm => {
                currencyElm.innerText = this.fCurrency.replace('######', currencyElm.innerText);
            });
            //emit events
            try {
                this.events.emit('bindOrderPage', data);
            } catch (err) {
                console.log(err);
            }
        }
    }
    getProductList() {
        if(this.checkCamp(siteSetting.WEBKEY)) {
            let campProducts = localStorage.getItem('campproducts');
            if(campProducts) {
                campProducts = JSON.parse(campProducts);
                const camps = campProducts.camps.filter(item => {
                    return item[siteSetting.WEBKEY];
                });

                if(camps.length > 0) {
                    console.log('get prices from LS');
                    this.bindProducts(camps[0][siteSetting.WEBKEY]);
                }
            }
        }
        else {
            this.ecommjs.Campaign.getProducts((err, result) => {
                if(err != null) {
                    console.log(err);
                    return;
                }

                if (result && result.prices) {
                    //store camp in local storage
                    let campProducts = localStorage.getItem('campproducts');
                    if(campProducts) {
                        campProducts = JSON.parse(campProducts);
                    }
                    else {
                        campProducts = {
                            camps: []
                        }
                    }

                    if(typeof result.prices !== 'undefined') {
                        result.timestamp = new Date().toISOString();
                        const camps = campProducts.camps.filter(item => {
                            return item[siteSetting.WEBKEY];
                        });

                        let camp = {};
                        if(camps.length > 0) {
                            camp = camps[0];
                            camp[siteSetting.WEBKEY] = result;
                        } else {
                            camp[siteSetting.WEBKEY] = result;
                            campProducts.camps.push(camp);
                        }

                        localStorage.setItem('campproducts', JSON.stringify(campProducts));
                    }
                    this.bindProducts(result);
                }
            });
        }
    }
    // End Product List

    // Package Functions
    getCurrentIndexItemsChecked() {
        this.indexItems = [];
        const checkedElms = document.querySelectorAll('input[name="product"]:checked');
        this.sliceArray(checkedElms).forEach(checkedElm => {
            this.indexItems.push(this.currentPackage.indexOf(checkedElm.value));
        });
    }
    setupTab() {
        this.sliceArray(this.tabItems).forEach(tabItem => {
            if(document.querySelector('.js-list-group ul').dataset.packagedisplay === tabItem.dataset.package) {
                tabItem.classList.add('active');
                this.isMissingTab = false;
            }
        });

        // Remove all Best seller
        if(this.isPopup) {
            const selectedPro = document.querySelectorAll('.productItem:not(.special_offer) .best-seller-text');
            this.sliceArray(selectedPro).forEach(elm => {
                if(elm) {
                    elm.parentNode.removeChild(elm);
                }
            });
        }
    }
    showProductsInPackage(packageDisplay) {
        this.currentPackage = packageDisplay;
        this.q('.productItem').addClass('hidden');

        for(let proId of packageDisplay) {
            let inputElm = document.getElementById('product_' + proId);
            let proItem = inputElm.closest('.productItem');

            if(this.isPopup) {
                proItem.classList.remove('hidden');
            }
            else if(!proItem.classList.contains('special_offer')) {
                proItem.classList.remove('hidden');
            }
        }
    }
    checkProduct() {
        // Uncheck all checkbox
        let checkedInputs = document.querySelectorAll('input[name="product"]:checked');
        this.sliceArray(checkedInputs).forEach(checkedInput => {
            checkedInput.closest('.productItem').querySelector('.js-unitDiscountRate').click();
        });

        // Check product within package
        for(let [index, proId] of this.currentPackage.entries()) {
            if(this.indexItems.indexOf(index) > -1) {
                let input = document.querySelector('input[name="product"][value="' + proId + '"]');
                input.closest('.productItem').querySelector('.js-unitDiscountRate').click();
            }
        }
    }
    packageArray() {
        let tmpArr = [];
        for(const tabItem of this.tabItems) {
            tmpArr.push(tabItem.dataset.package);
            this.packages.push(tabItem.dataset.package.split(','));
        }

        if(tmpArr.indexOf(document.querySelector('.js-list-group ul').dataset.packagedisplay) === -1) {
            this.packages.push(document.querySelector('.js-list-group ul').dataset.packagedisplay.split(','));
        }
    }
    implementPackageTab() {
        if(!document.querySelector('.js-list-group li')) {
            return;
        }
        this.tabItems = document.querySelectorAll('.js-list-group li');
        this.titleElm = document.querySelector('.js-list-group h5');
        this.defaultPackage = document.querySelector('.js-list-group ul').dataset.packagedisplay.split(',');
        this.currentPackage = this.defaultPackage;
        this.isMissingTab = true;
        this.rootActiveText = '';
        this.activeText = '';
        if(!!this.titleElm) {
            this.rootActiveText = this.titleElm.innerHTML;
            this.activeText = this.rootActiveText;
        }
        this.getCurrentIndexItemsChecked();
        if(this.isPopup) {
            this.indexItems.push(0);
        }
        this.packageArray();
        this.setupTab();
        this.showProductsInPackage(this.defaultPackage);
    }
    activeTab(tabItem) {
        this.getCurrentIndexItemsChecked();
        this.q('.js-list-group li').removeClass('clicked');
        tabItem.classList.add('clicked');

        if(!!document.querySelector('.prl-error')) {
            document.querySelector('.prl-error').classList.add('hidden');
        }

        if(!tabItem.classList.contains('active')) {
            this.q('.js-list-group li').removeClass('active');
            tabItem.classList.add('active');
            this.showProductsInPackage(tabItem.dataset.package.split(','));
        }
        else if(this.isMissingTab && tabItem.classList.contains('active')) {
            this.q('.js-list-group li').removeClass('active');
            tabItem.classList.remove('clicked');
            if(!!this.titleElm) {
                this.activeText = this.rootActiveText;
                this.titleElm.innerHTML = this.activeText;
            }
            this.showProductsInPackage(this.defaultPackage); // Default
        }

        this.checkProduct();
        this.saveToLocalCart();
    }
    saveActiveTabIndex() {
        for(let i = 0, n = this.tabItems.length; i < n; i++) {
            this.q('body').removeClass('active-tab-' + i);
        }
        for(let [index, tabItem] of this.tabItems.entries()) {
            if(tabItem.classList.contains('active')) {
                document.querySelector('body').classList.add('active-tab-' + index);
                break;
            }
        }
    }
    packageEvents() {
        this.sliceArray(this.tabItems).forEach(tabItem => {
            tabItem.addEventListener('click', () => {
                if(!!document.querySelector('.prl-error')) {
                    document.querySelector('.prl-error').classList.add('hidden');
                }
                if(!!this.titleElm) {
                    this.activeText = tabItem.dataset.replacetext;
                    this.titleElm.innerHTML = this.activeText;
                }

                this.activeTab(tabItem);
                this.saveActiveTabIndex();
            }, false);
        });
    }
    // End Package Functions

    showSpecialItem() {
        this.q('.productItem').removeClass('hidden');
        document.querySelectorAll('.productItem')[0].querySelector('.js-unitDiscountRate').click();
    }
    btnYesExitPopupEvent() {
        this.isPopup = true;
        if(!!this.tabItems) {
            this.getCurrentIndexItemsChecked();
            if(this.indexItems.indexOf(0) === -1) {
                this.indexItems.push(0);
            }
            this.showProductsInPackage(this.currentPackage);
            this.checkProduct();
        }
        else {
            // Show special product
            this.showSpecialItem();
        }
    }

    generateSummary() {
        let shippingIndex = 0;
        this.cart = Utils.getCart();

        const rowItems = document.querySelectorAll('.pro-row');
        if(!!rowItems.length) {
            this.sliceArray(rowItems).forEach(rowItem => {
                rowItem.closest('tbody').removeChild(rowItem);
            });
        }

        let productRows = '',
            productRow = `
            <tr class="pro-row">
                <td class="td-name">{name}</td>
                <td class="td-price">{price}</td>
            </tr>
        `;

        if(this.cart.totalQuantity === 0 || (this.cart.totalQuantity === 1 && !!document.getElementById('product_' + this.cart.items[0].productId).closest('.productItem').classList.contains('gift-item'))) {
            document.querySelector('.statistical').classList.add('hidden');
        }
        else if(this.cart.totalQuantity > 0) {
            document.querySelector('.statistical').classList.remove('hidden');
            for(let item of this.cart.items) {
                let price = item.discountedPrice * item.quantity;
                let formatPrice = this.formatPrice(price.toFixed(2), item.formattedPrice);
                let tmp = productRow.replace('{name}', item.productName + ' x ' + item.quantity).replace('{price}', formatPrice);
                productRows += tmp;
            }
            document.querySelector('.grand-total').innerText = this.cart.formatTotalPrice;
        }

        if(this.cart.shippingFee.price === 0) {
            document.querySelector('.td-shipping').innerText = js_translate.freeCap || 'FREE';
        }
        else {
            document.querySelector('.td-shipping').innerText = this.cart.shippingFee.formatPrice;
        }
        document.querySelector('.statistical tbody').insertAdjacentHTML('afterbegin', productRows);
    }
    getShippingFee(shippings, isFree) {
        let shippingObj = {},
            shippingArr = shippings.sort(function(a, b) {
                return a.price - b.price;
            });

        if(isFree) {
            shippingObj = {
                shippingMethodId: shippingArr[0].shippingMethodId,
                shippingPrice: shippingArr[0].price,
                formatShippingPrice: shippingArr[0].formattedPrice
            }
        }
        else {
            shippingObj = {
                shippingMethodId: shippingArr[shippings.length - 1].shippingMethodId,
                shippingPrice: shippingArr[shippings.length - 1].price,
                formatShippingPrice: shippingArr[shippings.length - 1].formattedPrice
            }
        }
        return shippingObj;
    }
    checkHasGiftItem() {
        let isHasGift = false;
        const checkedProducts = document.querySelectorAll('input[name="product"]:checked');

        this.sliceArray(checkedProducts).forEach(checkedProduct => {
            if(checkedProduct.closest('.productItem').classList.contains('gift-item')) {
                isHasGift = true;
            }
        });
        return isHasGift;
    }
    saveToLocalCart() {
        localStorage.removeItem(constants.CART);
        this.products = [];

        const checkedProducts = document.querySelectorAll('input[name="product"]:checked');
        let totalQuantity = 0,
            shippingFee = {},
            formatTotalPrice,
            totalPrice = 0,
            tmpFormatPrice = '';

        this.sliceArray(checkedProducts).forEach(checkedProduct => {
            const dataProduct = JSON.parse(checkedProduct.dataset.product),
                quantity = !!checkedProduct.closest('.productItem').querySelector('.js-quantity') ? Number(checkedProduct.closest('.productItem').querySelector('.js-quantity').value) : dataProduct.quantity;

            totalQuantity += quantity;
            totalPrice += dataProduct.productPrices.DiscountedPrice.Value * quantity;
            tmpFormatPrice = dataProduct.productPrices.DiscountedPrice.FormattedValue;
            shippingFee = this.getShippingFee(dataProduct.shippings, true); // true: Assumed FREE shipping

            this.products.push({
                productName: checkedProduct.dataset.productname,
                productId: dataProduct.productId,
                discountedPrice: dataProduct.productPrices.RootDiscountedPrice.Value,
                formattedPrice: dataProduct.productPrices.RootDiscountedPrice.FormattedValue,
                quantity: quantity,
                shippingMethodId: shippingFee.shippingMethodId,
                shippingPrice: shippingFee.shippingPrice,
                formatShippingPrice: shippingFee.formatShippingPrice
            });
        });

        if(totalQuantity === 1 || (totalQuantity === 2 && !!this.checkHasGiftItem())) {
            shippingFee = this.getShippingFee(JSON.parse(checkedProducts[checkedProducts.length - 1].dataset.product).shippings, false);
            this.products[checkedProducts.length - 1].shippingMethodId = shippingFee.shippingMethodId;
            // Save for Confirm page
            this.products[checkedProducts.length - 1].shippingPrice = shippingFee.shippingPrice;
            this.products[checkedProducts.length - 1].formatShippingPrice = shippingFee.formatShippingPrice;
            totalPrice += shippingFee.shippingPrice;
        }

        localStorage.setItem(constants.CART, JSON.stringify({
            sessionId: this.sessionId || '',
            items: this.products,
            totalQuantity: totalQuantity,
            shippingFee: {
                price: shippingFee.shippingPrice,
                formatPrice: shippingFee.formatShippingPrice
            },
            totalPrice: Number(totalPrice.toFixed(2)),
            formatTotalPrice: this.formatPrice(totalPrice.toFixed(2), tmpFormatPrice)
        }));

        this.generateSummary();
    }

    syncingQuantity(pid, value) {
        try {
            if(!!this.currentPackage) {
                const index = this.currentPackage.indexOf(pid);
                for(const pack of this.packages) {
                    if(pack.indexOf(pid) === -1) {
                        document.querySelector('#product_' + pack[index]).closest('.productItem').querySelector('.js-quantity').value = value;
                    }
                }
            }
        }
        catch(e) {
            console.log(e);
        }
    }
    updateQuantity(parentElm, num, limit) {
        try {
            const input = parentElm.querySelector('.js-quantity'),
                inputVal = Number(input.value);

            switch(num) {
                case -1:
                    if(inputVal > limit) {
                        input.value = inputVal + num;
                    }
                    break;
                case 1:
                    if(inputVal < limit) {
                        input.value = inputVal + num;
                    }
                    break
            }
            this.syncingQuantity(parentElm.querySelector('input[name="product"]').value, input.value);
            this.saveToLocalCart();
        }
        catch(e) {
            console.log(e);
        }
    }

    addAdditionTextIntoProductName() {
        const productNameElms = document.querySelectorAll('.productItem .pro-title'),
            additionText = document.querySelector('.productItem.special_offer.gift-item .best-seller-text').innerText;

        this.sliceArray(productNameElms).forEach(productNameElm => {
            productNameElm.insertAdjacentHTML('beforeend', additionText);
        });
    }

    bindEvents() {
        const productItems = document.querySelectorAll('input[name="product"]');
        this.sliceArray(productItems).forEach(productItem => {
            productItem.addEventListener('change', (e) => {
                if(!!productItem.checked) {
                    productItem.closest('.productItem').classList.add('checked-item');
                    if(!!e.currentTarget.closest('.productItem').querySelector('.js-quantity') &&
                        e.currentTarget.closest('.productItem').querySelector('.js-quantity').value === '0') {
                        this.updateQuantity(e.currentTarget.closest('.productItem'), 1, Number(e.currentTarget.closest('.productItem').querySelector('.qty-plus').dataset.max));
                    }
                }
                else {
                    productItem.closest('.productItem').classList.remove('checked-item');
                }
                if(!!document.querySelector('.prl-error')) {
                    document.querySelector('.prl-error').classList.add('hidden');
                }
                this.saveToLocalCart();
            });
        });

        if(!!this.tabItems) {
            this.packageEvents();
        }

        // Free Gift
        if(!!document.getElementById('btn-free-gift')) {
            document.getElementById('btn-free-gift').addEventListener('click', (e) => {
                e.preventDefault();
                if(!!document.querySelector('.free-gift-apply')) {
                    document.querySelector('.free-gift-apply').style.display = 'block';
                }
                if(document.querySelector('.productItem.special_offer')) {
                    this.btnYesExitPopupEvent();
                    if(document.querySelector('.productItem.special_offer').classList.contains('gift-item')) {
                        this.addAdditionTextIntoProductName();
                    }
                }
            }, false);
        }

        // Quantity
        const quantityWraps = document.querySelectorAll('.productItem .quantity-wrap');
        this.sliceArray(quantityWraps).forEach(quantityWrap => {
            quantityWrap.querySelector('.qty-minus').addEventListener('click', (e) => {
                e.preventDefault();
                this.updateQuantity(e.currentTarget.closest('.productItem'), -1, 0);
                if(!!e.currentTarget.closest('.productItem').querySelector('input[name="product"]').checked &&
                    e.currentTarget.closest('.productItem').querySelector('.js-quantity').value === '0') {
                    e.currentTarget.closest('.js-unitDiscountRate').click();
                }
                else if(!e.currentTarget.closest('.productItem').querySelector('input[name="product"]').checked &&
                    e.currentTarget.closest('.productItem').querySelector('.js-quantity').value !== '0') {
                    e.currentTarget.closest('.js-unitDiscountRate').click();
                }
            });

            quantityWrap.querySelector('.qty-plus').addEventListener('click', (e) => {
                e.preventDefault();
                this.updateQuantity(e.currentTarget.closest('.productItem'), 1, Number(e.currentTarget.dataset.max));
                if(!e.currentTarget.closest('.productItem').querySelector('input[name="product"]').checked) {
                    e.currentTarget.closest('.js-unitDiscountRate').click();
                }
            });
        });
    }

    init() {
        this.generateEvents();
        if(document.querySelector('.productItem.special_offer') && Utils.getQueryParameter('et') === '1') {
            this.showSpecialItem();
        }
        // this.events.on('bindOrderPage', () => {});
        document.addEventListener('DOMContentLoaded', () => {
            this.getProductList();
            this.implementPackageTab();
            this.bindEvents();
        });
    }
}
