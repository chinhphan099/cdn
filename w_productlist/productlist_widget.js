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
                    elem.innerHTML = elem.innerHTML.replace('{UnitDiscountRate}', '<span class="spanUnitDiscountRate">$00.00</span>')
                                            .replace('{DiscountedPrice}', '<span class="discountedPrice"></span>')
                                            .replace('{FullPrice}', '<del class="fullPrice"></del>');
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
                            const elemDiscountedPrice = _qAll('label[for="' + 'product_' + product.productId + '"] .discountedPrice');
                            const elemFullPrice = _qAll('label[for="' + 'product_' + product.productId + '"] .fullPrice');

                            if (elemUnitDiscountRate) elemUnitDiscountRate.innerHTML = product.productPrices.UnitDiscountRate.FormattedValue;
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
                        priceShipping = "free";
                    }
                } else {
                    priceShipping = shipping.formattedPrice;
                }
            } else {
                if (window.js_translate && window.js_translate.free) {
                    priceShipping = window.js_translate.free;
                } else {
                    priceShipping = "free";
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
    const getClosest = (elem, selector) => {
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
    };

    //create Extend Functional
    const q = function(selector) {
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
    };
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
        let indexItem = currentPackage.indexOf(_q('input[name=product]:checked').value);

        if(!!titleElm) {
            rootActiveText = titleElm.innerHTML;
            activeText = rootActiveText;
        }
        function listener() {
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
                }, false);
            }

            _qById('btn-yes-exit-popup').addEventListener('click', function(e) {
                indexItem = 0;
                init(true);
            }, false);
        }

        function setupTab() {
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
        }

        function updateIndexItem() {
            indexItem = currentPackage.indexOf(_q('input[name=product]:checked').value);
        }

        function activeTab(tabItem) {
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
                    titleElm.innerHTML = rootActiveText;
                    activeText = rootActiveText;
                }
                showDefaultProduct(packageDisplay, isPopup);
            }
        }

        function showDefaultProduct(packageDisplay, isPopup = false) {
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
        }

        function checkProduct() {
            // indexItem
            for(let [index, proId] of currentPackage.entries()) {
                if(index === indexItem) {
                    let input = _q('input[name="product"][value="' + proId + '"]');
                    getClosest(input, '.productRadioListItem').querySelector('.js-unitDiscountRate').click();
                }
            }
        }

        // Initialize
        function init(isPopup = false) {
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
        }

        init(utils.getQueryParameter('et') === '1');
        listener();
    }
    // End Product list Category ----------------------------------------------------------------------------------------
})(window.utils);
