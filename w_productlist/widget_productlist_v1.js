(function (utils) {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    if (!siteSetting) {
        console.log('window.siteSetting object is not found');
        return;
    }

    function replaceUserString() {
        //Product List Widget
        if (_qById('js-widget-products')) {
            const unitDiscountRateLables = _qAll('.js-unitDiscountRate');
            if (unitDiscountRateLables) {
                for(let elem of unitDiscountRateLables) {
                    elem.innerHTML = elem.innerHTML.replace(/{UnitDiscountRate}/gi, '<span class="spanUnitDiscountRate">$00.00</span>')
                                            .replace(/{UnitFullRate}/gi, '<span class="spanUnitFullRate"></span>')
                                            .replace(/{DiscountedPrice}/gi, '<span class="discountedPrice"></span>')
                                            .replace(/{SavePrice}/gi, '<span class="savePrice"></span>')
                                            .replace(/{FullPrice}/gi, '<del class="fullPrice"></del>');
                }
            }
        }
    }
    replaceUserString();

    function initWidgetProducts() {
        const eCRM = new EmanageCRMJS({
            webkey: siteSetting.webKey,
            cid: siteSetting.CID,
            lang: '',
            isTest: utils.getQueryParameter('isCardTest') ? true : false
        });

        eCRM.Campaign.getProducts(function (data) {
            if (!(data instanceof Error) && data.prices.length > 0) {
                console.log(data);
                Array.prototype.slice.call(data.prices).forEach(product => {
                    try {
                        const radio = _qById('product_' + product.productId);
                        if (radio) {
                            radio.setAttribute('data-product', JSON.stringify(product));
                            radio.onchange = handleProductChange;

                            const elemUnitDiscountRate = _q('label[for="' + 'product_' + product.productId + '"] span.spanUnitDiscountRate');
                            const elemUnitFullRate = _q('label[for="' + 'product_' + product.productId + '"] span.spanUnitFullRate');
                            const elemDiscountedPrice = _qAll('label[for="' + 'product_' + product.productId + '"] .discountedPrice');
                            const elemFullPrice = _qAll('label[for="' + 'product_' + product.productId + '"] .fullPrice');
                            const elemSavePrice = _qAll('label[for="' + 'product_' + product.productId + '"] .savePrice');
                            const fValue = product.productPrices.DiscountedPrice.FormattedValue.replace(/[,|.]/g, '');
                            const pValue = product.productPrices.DiscountedPrice.Value.toString().replace(/\./, '');
                            const fCurrency = fValue.replace(pValue, '######').replace(/\d/g, '');

                            if (elemUnitDiscountRate) {
                                elemUnitDiscountRate.innerHTML = product.productPrices.UnitDiscountRate.FormattedValue;
                            }
                            if (elemUnitFullRate) {
                                elemUnitFullRate.innerHTML = product.productPrices.UnitFullRetailPrice.FormattedValue;
                            }
                            if (elemDiscountedPrice) {
                                for(let discountedPrice of elemDiscountedPrice) {
                                    discountedPrice.innerHTML = product.productPrices.DiscountedPrice.FormattedValue;
                                }
                            }
                            if (elemFullPrice) {
                                for(let fullPrice of elemFullPrice) {
                                    fullPrice.innerHTML = product.productPrices.FullRetailPrice.FormattedValue;
                                }
                            }
                            if (elemSavePrice) {
                                for(let savePrice of elemSavePrice) {
                                    let savePriceValue = (product.productPrices.FullRetailPrice.Value - product.productPrices.DiscountedPrice.Value).toFixed(2);

                                    savePrice.innerHTML = fCurrency.replace('######', savePriceValue);
                                }
                            }
                        }
                    } catch (err) {
                        console.log(err);
                    }
                });

                siteSetting.countryCode = data.location.countryCode;

                //emit events
                try {
                    const productInfo = getHiddenSelectedProduct();
                    utils.events.emit('bindProductDiscountInfo', productInfo);
                    utils.localStorage().set('countryCode', data.location.countryCode);
                    utils.events.emit('triggerAddressForm', data.location.countryCode);
                    utils.events.emit('triggerProductBannerSidebar', productInfo);
                    utils.events.emit('triggerWarranty', getSelectedProduct());
                    utils.events.emit('bindOrderPage', productInfo);
                    utils.events.emit('triggerInstallmentPayment', productInfo);
                } catch (err) {
                    console.log(err);
                }
            }
        });
    }
    initWidgetProducts();

    function handleProductChange() {
        const productInfo = getSelectedProduct();
        utils.events.emit('triggerWarranty', productInfo);
        utils.events.emit('triggerInstallmentPayment', {
            discountPrice: productInfo.productPrices.DiscountedPrice.FormattedValue,
            discountPriceValue: productInfo.productPrices.DiscountedPrice.Value,
            fullPrice: productInfo.productPrices.FullRetailPrice.FormattedValue,
            fullPriceValue: productInfo.productPrices.FullRetailPrice.Value
        });
    }

    function getSelectedProduct() {
        const product = _q('input[name="product"]:checked').dataset.product;
        if (product) {
            return JSON.parse(product);
        } else {
            return null;
        }
    }

    /**
     * This function is used to get hidden selected product which is used to bind shipping price and discount info
     */
    function getHiddenSelectedProduct() {
        let result = null;
        try {
            const productId = _qById('hdfSelectedProduct').value;
            const product = JSON.parse(_qById('product_' + productId).dataset.product);
            let priceShipping = '';
            if (product.shippings.length > 0) {
                var shipping = product.shippings[0];
                if (shipping.price == 0) {
                    if (window.js_translate && window.js_translate.free) {
                        priceShipping = window.js_translate.free;
                    } else {
                        priceShipping = 'free';
                    }
                } else {
                    priceShipping = shipping.formattedPrice;
                }
            } else {
                if (window.js_translate && window.js_translate.free) {
                    priceShipping = window.js_translate.free;
                } else {
                    priceShipping = 'free';
                }
            }

            result = {
                priceShipping: priceShipping,
                discountPrice: product.productPrices.DiscountedPrice.FormattedValue,
                discountPriceValue: product.productPrices.DiscountedPrice.Value,
                fullPrice: product.productPrices.FullRetailPrice.FormattedValue,
                fullPriceValue: product.productPrices.FullRetailPrice.Value,
                currencyCode: product.productPrices.FullRetailPrice.GlobalCurrencyCode != null ? product.productPrices.FullRetailPrice.GlobalCurrencyCode : ''
            }

        } catch (err) {
            console.log('getHiddenSelectedProduct : ', err);
        }
        return result;
    }


    // Product list Category ----------------------------------------------------------------------------------------
    function getClosest(elem, selector) {
        if (!Element.prototype.matches) {
            Element.prototype.matches =
                Element.prototype.matchesSelector ||
                Element.prototype.mozMatchesSelector ||
                Element.prototype.msMatchesSelector ||
                Element.prototype.oMatchesSelector ||
                Element.prototype.webkitMatchesSelector ||
                function(s) {
                    let matches = (this.document || this.ownerDocument).querySelectorAll(s),
                        i = matches.length;
                    while (--i >= 0 && matches.item(i) !== this) {}
                    return i > -1;
                }
        }

        // Get the closest matching element
        for ( ; elem && elem !== document; elem = elem.parentNode ) {
            if (elem.matches(selector)) {
                return elem;
            }
        }
        return null;
    }

    //create Extend Functional
    function q(selector) {
        var qSelector = _qAll(selector);

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
    //End Create Extends Functional

    // Tab click
    if(!!_q('.js-list-group li')) {
        const tabItems = _qAll('.js-list-group li');
        const titleElm = _q('.js-list-group h5');
        const packageDisplay = _q('.js-list-group ul').dataset.packagedisplay.split(',');
        let currentPackage = packageDisplay;
        let isMissingTab = true;
        let rootActiveText = '';
        let activeText = '';
        let indexItem = currentPackage.indexOf(_q('input[name="product"]:checked').value);
        let waitTime;

        if(!!titleElm) {
            rootActiveText = titleElm.innerHTML;
            activeText = rootActiveText;
        }

        const saveActiveTabIndex = () => {
            utils.localStorage().set('indexTab', -1);
            for(let [index, tabItem] of tabItems.entries()) {
                if(tabItem.classList.contains('active')) {
                    utils.localStorage().set('indexTab', index);
                    break;
                }
            }
        };
        const updateIndexItem = () => {
            indexItem = currentPackage.indexOf(_q('input[name="product"]:checked').value);
        };
        const checkProduct = () => {
            // indexItem
            for(let [index, proId] of currentPackage.entries()) {
                if(index === indexItem) {
                    let input = _q('input[name="product"][value="' + proId + '"]');
                    getClosest(input, '.productRadioListItem').querySelector('.js-unitDiscountRate').click();
                }
            }
        };
        const showDefaultProduct = (packageDisplay, isPopup) => {
            // Hide all product items
            currentPackage = packageDisplay;
            q('.productRadioListItem').addClass('hidden');

            for(let proId of packageDisplay) {
                let inputElm = _qById('product_' + proId);
                let proItem = getClosest(inputElm, '.productRadioListItem');

                let options = JSON.parse(_qById('js-widget-products').dataset.options);
                if(isPopup) {
                    if(proItem.classList.contains('special_offer')) {
                        proItem.classList.remove('hidden');
                    }
                    if(!options.specialOnly) {
                        proItem.classList.remove('hidden');
                    }
                }
                else if(!proItem.classList.contains('special_offer')) {
                    proItem.classList.remove('hidden');
                }
            }

            checkProduct();
        };
        const setupTab = () => {
            if(!!titleElm) {
                activeText = rootActiveText;
                titleElm.innerHTML = activeText;
            }
            q('.js-list-group li').removeClass('active');
            for(let tabItem of tabItems) {
                if(_q('.js-list-group ul').dataset.packagedisplay === tabItem.dataset.package) {
                    tabItem.classList.add('active');
                    isMissingTab = false;
                    break;
                }
            }

            if(!!waitTime) {
                clearTimeout(waitTime);
            }
            waitTime = setTimeout(function() {
                saveActiveTabIndex();
            }, 3000);
        };
        const activeTab = (tabItem) => {
            let isPopup = utils.getQueryParameter('et') === '1';
            updateIndexItem();

            q('.js-list-group li').removeClass('clicked');
            tabItem.classList.add('clicked');
            if(!tabItem.classList.contains('active')) {
                q('.js-list-group li').removeClass('active');
                tabItem.classList.add('active');
                showDefaultProduct(tabItem.dataset.package.split(','), isPopup);
            }
            else if(isMissingTab && tabItem.classList.contains('active')) {
                q('.js-list-group li').removeClass('active');
                tabItem.classList.remove('clicked');
                if(!!titleElm) {
                    activeText = rootActiveText;
                    titleElm.innerHTML = activeText;
                }
                showDefaultProduct(packageDisplay, isPopup);
            }
        };
        const init = (isPopup) => {
            setupTab();
            showDefaultProduct(packageDisplay, isPopup);

            if(isPopup) {
                // Remove all Best seller
                var selectedPro = _qAll('.productRadioListItem:not(.special_offer) .best-seller-text');
                for(let elm of selectedPro) {
                    if(elm) {
                        elm.parentNode.removeChild(elm);
                    }
                }

                // Remove default class for defaul item (not speical_offer)
                q('.default:not(.special_offer)').removeClass('default');
            }
        };
        const listener = () => {
            for(let tabItem of tabItems) {
                if(!!titleElm) {
                    tabItem.addEventListener('mouseenter', function() {
                        titleElm.innerHTML = tabItem.dataset.replacetext;
                    }, false);

                    tabItem.addEventListener('mouseleave', function() {
                        titleElm.innerHTML = activeText;
                    }, false);
                }

                tabItem.addEventListener('click', function() {
                    // Update Text
                    if(!!titleElm) {
                        activeText = tabItem.dataset.replacetext;
                        titleElm.innerHTML = activeText;
                    }

                    activeTab(tabItem);
                    saveActiveTabIndex();
                }, false);
            }

            if(!!_qById('btn-yes-exit-popup')) {
                _qById('btn-yes-exit-popup').addEventListener('click', function() {
                    indexItem = 0;
                    init(true);
                }, false);
            }
        };

        init(utils.getQueryParameter('et') === '1');
        listener();
    }
    // End Product list Category ----------------------------------------------------------------------------------------
})(window.utils);

// Quantify
const quantity = (() => {
    let isChangeTab = false;
    const getVisibleItems = () => {
        let visibleElms = [];
        const productItems = _qAll('.productRadioListItem');

        for(let item of productItems) {
            if(window.getComputedStyle(item).display !== 'none') {
                visibleElms.push(item);
            }
        }
        return visibleElms;
    };

    const setActiveItem = () => {
        const visibleItems = getVisibleItems();
        let qt = utils.getQueryParameter('qt'),
            qtNumber = Number(qt);

        if(!!qt && qtNumber > 0 && qtNumber <= visibleItems.length) {
            qtNumber -= 1;

            const listProduct = _qAll('.productRadioListItem');
            for(let itemProduct of listProduct) {
                itemProduct.classList.remove('default');
            }
            visibleItems[qtNumber].classList.add('default');
            if(!isChangeTab) {
                visibleItems[qtNumber].querySelector('input').click();
            }
        }
    };

    const waitingOrderData = () => {
        utils.events.on('bindOrderPage', setActiveItem);
    };

    const onClickTabPackage = () => {
        const tabItems = _qAll('.js-list-group li');
        if(!!tabItems.length) {
            for(let tabItem of tabItems) {
                tabItem.addEventListener('click', function() {
                    isChangeTab = true;
                    setActiveItem();
                }, false);
            }
        }
    };

    const onClickListAdapter = () => {
        const tabItems = _qAll('.list-adapters input');
        if(!!tabItems.length) {
            for(let tabItem of tabItems) {
                tabItem.addEventListener('change', function() {
                    isChangeTab = true;
                    setActiveItem();
                }, false);
            }
        }
    }

    const listener = () => {
        onClickTabPackage(); // NewProductListWidget
        onClickListAdapter(); // For Tu's widget
    };

    const initial = () => {
        listener();
    };

    return {
        initial: initial,
        waitingOrderData: waitingOrderData
    }
})();

quantity.waitingOrderData();
window.addEventListener('DOMContentLoaded', () => {
    quantity.initial();
});
