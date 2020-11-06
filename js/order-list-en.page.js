const _helper = {
    formatPrice :(priceValue, priceStrValue, total) => {
        var tmp_Value = priceValue.toString().replace(/\./, '');
        var tmp_strValue = priceStrValue.replace(/[,|.]/g, '');
        var tmp_currency = tmp_strValue.replace(tmp_Value, '######').replace(/\d/g, '');
        if(priceStrValue.indexOf(',') >= 0) {
            var tmp_price = total.toString().replace('.', ',');
            return (tmp_currency.replace('######', tmp_price));
        }
        else{
            var tmp_price = total.toString();
            return (tmp_currency.replace('######', tmp_price));
        }
    },
    scrollToDiv : function(classTarget){
        document.querySelector(classTarget).scrollIntoView({behavior: "smooth"});
    },
    detectLabelInput : function(){
        Array.prototype.slice.call(_qAll("select")).forEach((e)=>{
            e.parentElement.parentElement.classList.add("focused");
        });
        Array.prototype.slice.call(_qAll("select")).forEach((e)=>{
            e.parentElement.parentElement.classList.add("focused-select");
        });
        Array.prototype.slice.call(_qAll("input")).forEach(function(e){
            e.setAttribute("placeholder", "");
            if(e.value.length > 0){
                e.classList.add("focused");
            }
            e.addEventListener("change",function(elem){
                if(elem.currentTarget.getAttribute("type") != "radio" && elem.currentTarget.closest(".form-group")!=null){
                    elem.currentTarget.closest(".form-group").classList.add("focused");
                }
            });
            e.addEventListener("focus",function(elem){
                if(elem.currentTarget.getAttribute("type") != "radio" && elem.currentTarget.closest(".form-group")!=null){
                    elem.currentTarget.closest(".form-group").classList.add("focused");
                }
            });
            e.addEventListener("blur",function(elem){
                if(elem.currentTarget.getAttribute("type") != "radio" && elem.currentTarget.closest(".form-group") != null){
                    if(e.value.length > 0){
                        elem.currentTarget.closest(".form-group").classList.add("focused");
                    }
                    else{
                        elem.currentTarget.closest(".form-group").classList.remove("focused");
                    }
                }
            });
        });
    },
    getLifetimePrice : function(product){
        const warrantyRate = [0.1, 0.2, 0.2, 0.2, 0.2, 0.3, 0.5, 0.15, 0.25, 0.35, 0.4, 0.45, 0.55, 0.6];
        const funnelId = document.querySelector('#txtProductWarranty').value;
        const funnelPrice = warrantyRate[parseInt(funnelId) - 1];
        var lifetimePrice = (Math.round(100 * product.productPrices.DiscountedPrice.Value * funnelPrice) / 100).toFixed(2);
        return lifetimePrice;
    },
    addClass: function(elems, target){
        elems.forEach(elem=>{
            if(document.querySelectorAll(elem).length > 0){
                Array.prototype.slice.call(document.querySelectorAll(elem)).forEach(item=>{
                    item.classList.add(target);
                });
            }
        });
    },
    removeClass: function(elems, target){
        elems.forEach(elem=>{
            if(document.querySelectorAll(elem).length > 0){
                Array.prototype.slice.call(document.querySelectorAll(elem)).forEach(item=>{
                    item.classList.remove(target);
                });
            }
        });
    },
    addEventScrollToDiv : function(elems, classTarget){
        var tmpElem;
        elems.forEach(elem=>{
            tmpElem = document.querySelectorAll(elem);
            if(tmpElem.length > 0){
                Array.prototype.slice.call(tmpElem).forEach(item1=>{
                    item1.addEventListener("click", (e)=>{
                        e.preventDefault();
                        _helper.scrollToDiv(classTarget);
                    });
                });
            }
        });
    },
};

const orderList = function(utils){
    if (!utils) {
        console.log('utils module is not found');
        return;
    }

    const initial = () => {
        setDefault();
        handleFAQ();
        handleSelectSize();
        handleSelectTabProduct();
        handleNextButton();
        selectedProductItem();
        handleCheckoutButtonMobile();
        handleCheckoutFloatButton();
        handleLifetimeWarranty();
        _helper.detectLabelInput();
    };

    const setDefault = function(){
        //selected product default
        var handleSelectedProduct = setInterval(function(){
            if(_q(".productRadioListItem.default") == null){
                if(_q(".productRadioListItem.checked-item input").dataset.product != null){
                    _q(".productRadioListItem.checked-item").click();
                    clearInterval(handleSelectedProduct);
                }
            }
        },1000);

        /*add class into elems*/
        _helper.addClass([
            ".product-warranty",
            ".section-4",
            ".item-3",
            ".btn-send",
            ".widget-creditcard-form",
            ".widget-billing-form",
            ".floatbutton-bottom",
            ".currency-widget",

            ], "hidden");

        /*remove class from elems*/
        _helper.removeClass([
            ".widget-customer-form",
            ".widget-shipping-form"
            ],"hidden");

        /*add event click => scroll to .product-list*/
        _helper.addEventScrollToDiv([
            ".button-order button",
            ".button-order a"
            ], ".product-list");

        window.scrollTo(0,0);
    }

    //---------------------- FAQ
    const handleFAQ = function(){
        if(_q(".section-faq") != null && _q(".section-faq .w_outer") != null){
            _q(".section-faq .w_outer").classList.add("hidden");
            _q(".section-faq .w_main_title>span>span").addEventListener("click", function(){
                _q(".section-faq .w_outer").classList.toggle("hidden");
            });
        }
    }
    //---------------------- Select Size Button
    const handleSelectSize = function(){
        if(_q(".select-size") != null){
            _q(".select-size").classList.add("hidden");
            var listElems = _qAll(".select-size a");
            for(var item of listElems){
                item.addEventListener("click", function(e){
                    e.preventDefault();
                    _helper.removeClass([".select-size li.active"], "active");
                    e.currentTarget.parentElement.classList.add("active");
                });
            }
        }
    }
    const handleSelectTabProduct = function(){
        if(!!_q(".js-list-group") && !!_q(".select-size")){
            var htmlTabProduct = _q(".js-list-group");
            _q(".select-size").appendChild(htmlTabProduct);
            Array.prototype.slice.call(_qAll(".js-list-group li")).forEach((item)=>{
                var textSize = item.dataset.replacetext;
                var htmlSize = document.createElement("button");
                htmlSize.innerHTML = textSize;
                item.appendChild(htmlSize);
            });
        }
    }

    //---------------------- Handle Selected Product
    const handleOrderNow = function(){
        if(!!_q(".pd-bot-120")){
            _q(".pd-bot-120").classList.add("active");
            _helper.scrollToDiv(".pd-bot-120");
        }

        _helper.removeClass([
            ".item-2.button-next"
            ], "hidden");

        /*hidden elems faq and footer*/
        _helper.addClass([
            ".section-faq",
            "footer"
            ], "hidden");

        //display and scroll to select size
        if(_q(".select-size")!=null){
            _helper.removeClass([".select-size"],"hidden");
            _helper.scrollToDiv(".select-size");
        }

        //display and scroll to product warranty
        if(!!_q(".product-warranty")){
            _helper.removeClass([".product-warranty"],"hidden");
            _helper.scrollToDiv(".product-warranty");
        }

        //display float button checkout
        if(_q(".floatbutton-bottom")!=null){
            _helper.removeClass([".floatbutton-bottom"],"hidden");

            //display and scroll to product warranty
            if(_q(".product-warranty")){
                _helper.removeClass([".product-warranty"],"hidden");
                _helper.scrollToDiv(".product-warranty");
            }

            //hidden section-4
            _helper.addClass([".section-4"],"hidden");
        }
        else{
            handleForm();
        }
    }
    const getCheckoutInfo = function(){
        var product = null;
        if(_q(".productRadioListItem.active input[type='radio']").dataset.product != undefined){
            product = JSON.parse(_q(".productRadioListItem.active input[type='radio']").dataset.product);
        }

        var productPrice = product.productPrices.DiscountedPrice.FormattedValue;
        var lifetimePrice = 0;
        /*get price and display lifetime from warranty box*/
        if(!!_q("#js-widget-productwarranty") && _q("#js-widget-productwarranty input[type='checkbox']").checked == true){
            if(_q("#txtMiniUpsellPID") != null){
                _q("#txtMiniUpsellPID").checked = false;
            }
            lifetimePrice = _helper.getLifetimePrice(product);
            _q('.productlifetime_price').textContent = _helper.formatPrice(product.productPrices.DiscountedPrice.Value, product.productPrices.DiscountedPrice.FormattedValue, lifetimePrice);
        }
        /*get price and display lifetime or miniupsell price*/
        if(!!_q(".product-warranty")){
            if(_q("#txtMiniUpsellPID") == null){
                //===== Get info lifetime warranty display to product warranty =====
                if(_q(".productlifetime_price")!=null){
                    _q(".productlifetime_price").textContent = _q("#js-widget-productwarranty .spanWarrantyPrice").textContent;
                }
                if(_q(".warrantyDiscountPrice")!=null){
                    _q(".warrantyDiscountPrice").textContent = _q("#js-widget-productwarranty .spanWarrantyPrice").textContent;
                    let warrantyFullPrice = _helper.getLifetimePrice(product)*2;
                    _q(".warrantyFullPrice").textContent = _helper.formatPrice(product.productPrices.DiscountedPrice.Value, product.productPrices.DiscountedPrice.FormattedValue, warrantyFullPrice.toFixed(2));
                }
            }
            else{
                //===== PRODUCT WARRANTY =====
                _q(".productlifetime_price").textContent = _q(".warrantyDiscountPrice").textContent;
                if(_q("#txtMiniUpsellPID").checked == true){
                    lifetimePrice = parseFloat(_q(".warrantyDiscountPrice").dataset.warrantydiscountprice);
                }
            }
        }

        var totalPrice = product.productPrices.DiscountedPrice.Value + product.shippings[0].price + parseFloat(lifetimePrice);
        var strTotalPrice = _helper.formatPrice(product.productPrices.DiscountedPrice.Value, product.productPrices.DiscountedPrice.FormattedValue, totalPrice.toFixed(2));
        /*display price in float-button*/
        if(!!_q(".floatbutton-bottom")){
            _q(".floatbutton-bottom .total_price").textContent = strTotalPrice;
        }
        /*display checkout info*/
        if(!!_q(".section-checkout")){
            Array.prototype.slice.call(_qAll(".section-checkout .total_price")).forEach((item)=>{
                item.textContent = strTotalPrice;
            });

            var strShippingPrice = product.shippings[0].price == 0 ? window.js_translate.free : product.shippings[0].formattedPrice;
            _q(".section-checkout .shipping_price").textContent = strShippingPrice;

            var tax = 0;
            if(!!_q(".tax_price")){
                _q(".tax_price").textContent = _helper.formatPrice(product.productPrices.DiscountedPrice.Value, product.productPrices.DiscountedPrice.FormattedValue, tax.toFixed(2));
            }
        }
    }
    const selectedProductItem = function(){
        Array.prototype.slice.call(_qAll(".product-list .productRadioListItem")).forEach((item)=>{
            item.querySelector('label[for]').addEventListener('click', function(e){
                e.preventDefault();
            })
            item.addEventListener("click", function(e){
                _helper.removeClass([".product-list .productRadioListItem.active"], "active");

                var product = null;
                if(this.querySelector("input[type='radio']").dataset.product != undefined){
                    product = JSON.parse(this.querySelector("input[type='radio']").dataset.product)
                }
                if(!!product){
                    this.classList.add("active");
                    this.querySelector("input[type='radio']").click();
                    // render product info => checkout
                    var productName = e.currentTarget.querySelector("h3").textContent;
                    //var productImage = e.currentTarget.querySelector("p").innerHTML;
                    var imgElm = e.currentTarget.querySelector("img");
                    var productImage =  imgElm.getAttribute("src").indexOf("data:image/") < 0 ? imgElm.getAttribute("src") : imgElm.dataset.src;
                    var productPrice = e.currentTarget.querySelector(".discountedPrice").textContent;
                    //_q(".section-checkout .product_image").innerHTML = productImage;
                    _q(".section-checkout .product_image").innerHTML = `<img src=${productImage} alt="${productName}"/>`;
                    _q(".section-checkout .product_name").textContent = productName;
                    _q(".section-checkout .product_price").textContent = productPrice;
                    getCheckoutInfo();
                }
            });
            item.querySelector(".order-btn button").addEventListener("click", function(e){
                e.preventDefault();
                handleOrderNow();
            });
        });
        _q(".section-logos a").addEventListener("click", function(e){
            e.preventDefault();
            handleOrderNow();
        });
    }

    //---------------------- ShippingForm Next Button
    const handleNextButton = function(){
        if(!!_q(".item-2.button-next")){
            _q(".item-2.button-next").addEventListener("click", function(e){
                e.preventDefault();
                var isCustomerValid = utils.customerForm.isValid(),
                isShippingValid = window.widget.shipping.isValid();
                if(isCustomerValid && isShippingValid) {
                    this.classList.add("hidden");
                    _helper.removeClass([
                        ".item-3",
                        ".widget-creditcard-form",
                        ".widget-billing-form",
                        ".btn-send",
                        ".w_product_warranty"
                        ], "hidden");
                    _q("#creditcard_method").checked = true;
                    _helper.scrollToDiv(".img-text.item-3");
                    if(!!_q(".currency-widget")){
                        _q(".currency-widget").classList.remove("hidden");
                    }
                } else {
                    //Exute functiona focusErrorInputField
                    utils.focusErrorInputField();
                }
            });
        }
    }

    //---------------------- Handle checkout float button
    const handleForm = function(){
        _helper.addClass([".section-checkout"], "active");
        _helper.addClass([".section-checkout"], "open");
        _helper.removeClass([".pd-bot-120"], "active");

        _helper.removeClass([
            ".section-4",
            ], "hidden");
        _helper.addClass([
            ".floatbutton-bottom",
            ".item-3",
            ".btn-send",
            ".widget-creditcard-form",
            ".widget-billing-form"
            ], "hidden");
        _helper.scrollToDiv(".section-4");
    }
    const handleCheckoutFloatButton = function(){
        if(_q(".floatbutton-bottom") != null){
            _q(".floatbutton-bottom a").addEventListener("click", function(e){
                e.preventDefault();
                if(_q(".select-size")!=null){
                    if(_q(".select-size li.active")==null){
                        alert(typeof(window.js_translate.msgSelectSize)=="string"?window.js_translate.msgSelectSize:"Please select a size.");
                    }
                    else{
                        handleForm();
                    }
                }
                else{
                    handleForm();
                }
            });
        }
    }
    const handleCheckoutButtonMobile = function(){
        _q(".section-checkout .hidden-md-up").addEventListener("click", function(e){
            e.currentTarget.parentElement.classList.toggle("open");
        });
    }

    const handleLifetimeWarranty = function(){
        if(_q("#js-widget-productwarranty")!=null){
            _q("#js-widget-productwarranty input[type='checkbox']").addEventListener("click", function(e){
                if(_q(".product-warranty")!=null){
                    _q(".product-warranty .btn-deny").click();
                }
                if(e.currentTarget.checked == true){
                    _q(".productlifetime").classList.remove("hidden");
                    getCheckoutInfo();
                }
                else{
                    getCheckoutInfo();
                    _q(".productlifetime").classList.add("hidden");
                }
            });
        }
    }
    return{
        initial: initial,
        getCheckoutInfo: getCheckoutInfo,
        handleForm: handleForm
    }
}(window.utils);

window.addEventListener('DOMContentLoaded', function(){
    if(document.querySelector("body").classList.contains("edit_mode") != true){
        orderList.initial();
    }
});
