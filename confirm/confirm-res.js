(function (utils) {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    let confirm = {
        orderInfo: JSON.parse(utils.localStorage().get('orderInfo')),
        mainWebKey: siteSetting.webKey,
        CID: siteSetting.CID
    };

    if(!confirm.orderInfo) return;

    console.log(`used field useCreditCard ${confirm.orderInfo.useCreditCard}`);

    const eCRM = new EmanageCRMJS({
        webkey: confirm.mainWebKey,
        cid: confirm.CID,
        lang: '',
        isTest: utils.getQueryParameter('isCardTest') ? true : false
    });

    const orderToken = window.sessionStorage.getItem('orderToken');
    eCRM.Order.getRelatedOrders(confirm.orderInfo.orderNumber, function (result) {
        console.log(result);
        bindData(result);
    }, orderToken);

    const isUpdatedUpsells = utils.localStorage().get('isUpdatedUpsells');
    // if(!isUpdatedUpsells && confirm.orderInfo.paymentProcessorId !== 31) {
    if (!isUpdatedUpsells && confirm.orderInfo.useCreditCard) {    //only for credit card
        //update upsells status in CRM from NEW status to PAID
        eCRM.Order.updateUpsellsStatus(confirm.orderInfo.orderNumber, function (result) {
            utils.localStorage().set('isUpdatedUpsells', 'true');
            if(result) {
                console.log('upsells status is updated');
            }
        });
    }

    function bindData(data) {
        //console.log(data);

        const fvalue = data.receipts[0].formattedAmount.replace(/[,|.]/g, '');
        const pValue = data.receipts[0].amount.toFixed(2).toString().replace(/\./, '');
        const fCurrency = fvalue.replace(pValue, '######');
        const shippingPriceFormatted = data.shippingPriceFormatted;
        //bind orde summary on header
        const orderSummaryElem = _qAll('.js-order-summary');
        if (!!orderSummaryElem) {
            const d = new Date();

            for(let i = 0, n = orderSummaryElem.length; i < n; i++) {
                let orderTotal = data.orderPrice;

                if (!!data.relatedOrders) {
                    for(let i = 0; i < data.relatedOrders.length; i++ ) {
                        if(data.relatedOrders[i].orderStatus !== 'Cancel') {
                            orderTotal += data.relatedOrders[i].orderPrice;
                        }
                    }
                }

                orderSummaryElem[i].innerHTML = orderSummaryElem[i].innerHTML.replace('orderNumber', data.orderNumber)
                    .replace('orderDate', utils.formatDate(js_translate.dateFormat, js_translate.splitSymbol))
                    .replace('customerName', data.firstName + ' ' + data.lastName)
                    .replace('customerEmail', data.customerEmail)
                    .replace('orderTotalValue', orderTotal.toFixed(2))
                    .replace(/\{priceDeposit\}/g, data.receipts[0].formattedAmount)
                    .replace('orderTotal', utils.formatPrice(orderTotal.toFixed(2), fCurrency, shippingPriceFormatted))
                    .replace('orderSaved', utils.formatPrice(confirm.orderInfo.savedTotal.toFixed(2), fCurrency, shippingPriceFormatted));
            }
        }

        //bind shipping address
        const shippingElem = _q('.js-shippingaddress');
        const billingElem = _q('.js-billingaddress');
        const shippingTmp = `<div class="receipt-details">
                                <span>${data.shippingAddress.firstName} ${data.shippingAddress.lastName}</span>
                                <span>${data.shippingAddress.address1}</span>
                                <span>${data.shippingAddress.city} ${data.shippingAddress.state} ${data.shippingAddress.countryCode}</span>
                                <span>${data.shippingAddress.zipCode}</span>
                            </div>`;
        const billingTmp = `<div class="receipt-details">
                                <span>${data.billingAddress.firstName} ${data.billingAddress.lastName}</span>
                                <span>${data.billingAddress.address1}</span>
                                <span>${data.billingAddress.city} ${data.billingAddress.state} ${data.billingAddress.countryCode}</span>
                                <span>${data.billingAddress.zipCode}</span>
                            </div>`;
        shippingElem.innerHTML += shippingTmp;
        billingElem.innerHTML += billingTmp;

        /*--------add address2 to form------------*/
        if(!!data.shippingAddress.address2) {
            shippingElem.querySelectorAll('span')[2].insertAdjacentHTML('beforebegin', `<span>${data.billingAddress.address2}</span>`);
            billingElem.querySelectorAll('span')[2].insertAdjacentHTML('beforebegin', `<span>${data.billingAddress.address2}</span>`);
        }

        //bind product list
        let shipping = "Shipping",
            total = "Total",
            paidToday = "Your Deposit Paid Today:",
            remainingBalance = "Remaining Balance Due Upon Shipment:",
            totalPreOrder,
            lwPreOrder = "Lifetime Warranty Monthly Subscription",
            totalLwPreOrder = "Total Monthly Charge",
            totalBalance = 0,
            grandTotal = 0,
            totalProductsWhenReady = 0,
            remainingPrice = 0,
            charges_statement = "Charges on your statement will be processed for {productPrice} and will appear as {midDescriptor}";
        if(window.js_translate) {
            shipping = js_translate.shipping;
            total = js_translate.total;
            charges_statement = js_translate.product_charges_statement_confirm_page;
        }
        if(window.js_translate.paidToday){
            paidToday = js_translate.paidToday;
            remainingBalance = js_translate.remainingBalance;
        }
        if(window.js_translate.lwPreOrder){
            lwPreOrder = js_translate.lwPreOrder;
            totalLwPreOrder = js_translate.totalLwPreOrder;
        }
        if(utils.localStorage().get('preOrderUpsell') === 'true') {
             charges_statement = js_translate.pre_order_product_charges_statement_confirm_page || 'Your deposit will be processed for {productTotal} ({orderNumber}) and will appear as {midDescriptor}. You will be charged the price of the products when they ship.';
        }
        let productItemTmp = `<li class="item">
                                    <div class="inner">
                                        <span>{productName}</span>
                                    </div>
                                    <div class="inner">
                                        <span>${paidToday}</span>
                                        <span>{productPrice}</span>
                                    </div>
                                    <div class="inner">
                                        <span>${remainingBalance}</span>
                                        <span>{productTotalPreOrder}</span>
                                    </div>
                                    {tax}
                                    <div class="inner">
                                        <span>${total}</span>
                                        <span>{remainingBalancePrice}</span>
                                    </div>
                                    <div class="inner"><span>${charges_statement}</span></div>
                                </li>`,
            productItemMainTmp = productItemTmp;

        let productItemTmpWarranty = `<li class="item">
                                        <div class="inner">
                                            <span>{productName}</span>
                                            <span>{productPrice}</span>
                                        </div>
                                        <div class="inner">
                                            <span>${shipping}</span>
                                            <span>{shippingPrice}</span>
                                        </div>
                                        <div class="inner" style="display:none;">
                                        </div>
                                        {tax}
                                        <div class="inner">
                                            <span>${total}</span>
                                            <span>{productTotal}</span>
                                        </div>
                                        <div class="inner"><span>${js_translate.product_charges_statement_confirm_page}</span></div>
                                    </li>`;
        let productItemTmpWarrantyMonthLyCharge = `<li class="item">
                                    <div class="inner">
                                        <span>${lwPreOrder}</span>
                                    </div>
                                    {tax}
                                    <div class="inner">
                                        <span class="color-red">${totalLwPreOrder}</span>
                                        <span>{productTotal}</span>
                                    </div>
                                    <div class="inner"><span>${js_translate.product_charges_statement_confirm_page}</span></div>
                                </li>`;

        if(utils.localStorage().get('preOrder') === 'true') {
            let pre_order_product_charges_statement_confirm_page = js_translate.pre_order_product_charges_statement_confirm_page || 'Your deposit will be processed for {productTotal} ({orderNumber}) and will appear as {midDescriptor}. You will be charged the price of the products when they ship.';
            pre_order_product_charges_statement_confirm_page = pre_order_product_charges_statement_confirm_page.replace(/\{productTotal\}/gi, '{productPricePreOrder}');
            productItemMainTmp = `<li class="item">
                                    <div class="inner">
                                        <span>{productName}</span>
                                        <span></span>
                                    </div>
                                     <div class="inner">
                                        <span>${paidToday}</span>
                                        <span>{productPrice}</span>
                                    </div>
                                    <div class="inner">
                                        <span>${remainingBalance}</span>
                                        <span>{remainingBalancePrice}</span>
                                    </div>
                                    {tax}
                                    <div class="inner">
                                        <span>${total}</span>
                                        <span>{productTotalPreOrder}</span>
                                    </div>
                                    <div class="inner"><span>${pre_order_product_charges_statement_confirm_page}</span></div>
                                </li>`;
        }
        //if(utils.localStorage().get('preOrderUpsell') === 'true') {
        //    productItemTmp = productItemTmp.replace(/\{productTotal\}/gi, '{productTotalPreOrder}');
        //}
        //Installment Payment : only for Brazil
        let installmentText = '';
        if(confirm.orderInfo.installmentValue && confirm.orderInfo.installmentValue !== '') {
            const mainPrice = (data.orderPrice / confirm.orderInfo.installmentValue).toFixed(2);
            installmentText = ' (' + confirm.orderInfo.installmentText
                .replace(/N/, confirm.orderInfo.installmentValue)
                .replace(/\$price/, utils.formatPrice(mainPrice, fCurrency, shippingPriceFormatted)) + ')';
        }

        let mainProductNames = (typeof mainProducts !== 'undefined') ? mainProducts : false;
        let upsellProductNames = (typeof upsellProducts !== 'undefined') ? upsellProducts : false;

        let taxLine = '';
        let mainProductTax = localStorage.getItem('mainProductTax');
        if(mainProductTax) {
            mainProductTax = JSON.parse(mainProductTax);
            if(mainProductTax.tax != 0) {
                taxLine = `
                        <div class="inner">
                            <span>Tax</span>
                            <span>${'$' + mainProductTax.tax}</span>
                        </div>
                `;
            }
        }

        totalPreOrder = utils.formatPrice((data.orderPrice).toFixed(2), fCurrency, shippingPriceFormatted);
        remainingPrice = utils.formatPrice((data.orderPrice - data.receipts[0].amount).toFixed(2), fCurrency, shippingPriceFormatted);
        //grandTotal += (data.orderPrice - data.orderProductPrice);
        totalBalance += data.receipts[0].amount;
        totalProductsWhenReady += data.orderPrice - data.receipts[0].amount; //(data.orderPrice - data.orderProductPrice);
        let listProduct = productItemMainTmp.replace('{productName}', data.productName)
            .replace(/\{productPrice\}/g, data.receipts[0].formattedAmount)
            .replace(/\{remainingBalancePrice\}/g, remainingPrice)
            .replace(/\{tax\}/g, taxLine)
            .replace(/\{productPricePreOrder\}/g, `${data.receipts[0].formattedAmount}`)
            .replace(/\{productTotalPreOrder\}/g, `${totalPreOrder}<em>${installmentText}</em>`)
            .replace('{shippingPrice}', data.shippingPriceFormatted)
            .replace('{midDescriptor}', data.receipts[0].midDescriptor ? data.receipts[0].midDescriptor : 'Paypal')
            .replace(/\{orderNumber\}/g, data.orderNumber);

        if(!!mainProductNames) {
            for(let i = 0; i < mainProductNames.length; i++) {
                if(data.productName.trim() === mainProductNames[i].split(',')[0].trim()) {
                    listProduct = listProduct.replace(mainProductNames[i].replace(/\,/, '::').split('::')[0].trim(), mainProductNames[i].replace(/\,/, '::').split('::')[1].trim());
                    break;
                }
            }
        }

        if (!!data.relatedOrders) {
            for(let i = 0; i < data.relatedOrders.length; i++) {
                if(data.relatedOrders[i].orderStatus === 'Cancel') continue;

                if(confirm.orderInfo.installmentValue && confirm.orderInfo.installmentValue !== '') {
                    const mainPrice = (data.relatedOrders[i].orderPrice / confirm.orderInfo.installmentValue).toFixed(2);
                    installmentText = ' (' + confirm.orderInfo.installmentText
                        .replace(/N/, confirm.orderInfo.installmentValue)
                        .replace(/\$price/, utils.formatPrice(mainPrice, fCurrency, shippingPriceFormatted)) + ')';
                }

                let itemTmp = '';
                if (
                    data.relatedOrders[i].productName.toLowerCase().indexOf('warranty') > -1 && utils.localStorage().get('preOrderWarranty') !== 'true' &&
                    utils.localStorage().get('warrantyMonthlyCharge') !== 'true')
                {
                    itemTmp = productItemTmpWarranty.replace('{productName}', data.relatedOrders[i].productName)
                        .replace(/\{productPrice\}/g, data.relatedOrders[i].orderPriceFormatted)
                        .replace(/\{remainingBalancePrice\}/g, data.relatedOrders[i].orderPriceFormatted)
                        .replace(/\{tax\}/g, '')
                        .replace(/\{productTotalPreOrder\}/g, `${totalPreOrder}<em>${installmentText}</em>`)
                        .replace(/\{productTotal\}/g, `${data.relatedOrders[i].orderPriceFormatted}<em>${installmentText}</em>`)
                        .replace('{shippingPrice}', data.relatedOrders[i].shippingPriceFormatted)
                        .replace('{midDescriptor}', data.relatedOrders[i].receipts[0].midDescriptor ? data.relatedOrders[i].receipts[0].midDescriptor : 'Paypal')
                        .replace(/\{orderNumber\}/g, data.relatedOrders[i].orderNumber);

                    totalBalance = totalBalance + data.relatedOrders[i].orderPrice;
                    grandTotal += data.relatedOrders[i].orderPrice;
                }
                else if (
                    data.relatedOrders[i].productName.toLowerCase().indexOf('warranty') > -1 && utils.localStorage().get('preOrderWarranty') !== 'true' &&
                    utils.localStorage().get('warrantyMonthlyCharge') === 'true')
                {
                    itemTmp = productItemTmpWarrantyMonthLyCharge.replace('{productName}', data.relatedOrders[i].productName)
                        .replace(/\{productPrice\}/g, data.relatedOrders[i].receipts[0].formattedAmount)
                        .replace(/\{remainingBalancePrice\}/g, data.relatedOrders[i].receipts[0].formattedAmount)
                        .replace(/\{tax\}/g, '')
                        .replace(/\{productTotalPreOrder\}/g, `${totalPreOrder}<em>${installmentText}</em>`)
                        .replace(/\{productTotal\}/g, `${data.relatedOrders[i].orderPriceFormatted}<em>${installmentText}</em>`)
                        .replace('{shippingPrice}', data.relatedOrders[i].shippingPriceFormatted)
                        .replace('{midDescriptor}', data.relatedOrders[i].receipts[0].midDescriptor ? data.relatedOrders[i].receipts[0].midDescriptor : 'Paypal')
                        .replace(/\{orderNumber\}/g, data.relatedOrders[i].orderNumber);

                    totalBalance = totalBalance + data.relatedOrders[i].orderPrice;
                    grandTotal += data.relatedOrders[i].orderPrice;
                }
                else {
                    //set Total for upsells preOrder
                    let pricePreOrder = (data.relatedOrders[i].futureEvents && data.relatedOrders[i].futureEvents.length > 0) ? Number(data.relatedOrders[i].futureEvents[0].price) : data.relatedOrders[i].receipts[0].amount;
                    totalPreOrder = utils.formatPrice(((data.relatedOrders[i].orderPrice - pricePreOrder).toFixed(2)),
                        fCurrency, shippingPriceFormatted);

                    //grandTotal += data.relatedOrders[i].orderPrice - data.relatedOrders[i].orderProductPrice;
                    totalBalance += pricePreOrder;
                    totalProductsWhenReady += (data.relatedOrders[i].orderPrice - pricePreOrder);

                    let productPrice = (data.relatedOrders[i].futureEvents && data.relatedOrders[i].futureEvents.length > 0) ? data.relatedOrders[i].futureEvents[0].price : data.relatedOrders[i].orderProductPrice;
                    productPrice = utils.formatPrice(productPrice.toFixed(2), fCurrency, shippingPriceFormatted);

                    itemTmp = productItemTmp.replace('{productName}', data.relatedOrders[i].productName)
                        .replace(/\{productPrice\}/g, data.relatedOrders[i].receipts[0].formattedAmount) // 1
                        .replace(/\{productTotalPreOrder\}/g, `${totalPreOrder}<em>${installmentText}</em>`)// 2
                        .replace(/\{remainingBalancePrice\}/g, data.relatedOrders[i].orderPriceFormatted) // 3
                        .replace(/\{productTotal\}/g, `${productPrice}<em>${installmentText}</em>`) // 4
                        .replace(/\{tax\}/g, '')
                        .replace('{shippingPrice}', data.relatedOrders[i].shippingPriceFormatted)
                        .replace('{midDescriptor}', data.relatedOrders[i].receipts[0].midDescriptor ? data.relatedOrders[i].receipts[0].midDescriptor : 'Paypal')
                        .replace(/\{orderNumber\}/g, data.relatedOrders[i].orderNumber);
                }

                if(!!upsellProductNames) {
                    for(let j = 0; j < upsellProductNames.length; j++) {
                        itemTmp = itemTmp.replace(upsellProductNames[j].replace(/\,/, '::').split('::')[0].trim(), upsellProductNames[j].replace(/\,/, '::').split('::')[1].trim());
                    }
                }
                listProduct += itemTmp;
            }
        }
        const ul = document.createElement('ul');
        ul.innerHTML = listProduct;
        let receiptList = _q('.receipt-list');
        if(receiptList) {
            receiptList.appendChild(ul);
        }

        //Payment summary
        let paymentSummary = _q('.payment-summary').innerHTML,
            orderInfo = JSON.parse(utils.localStorage().get('orderInfo')),
            shippingFromOrder = orderInfo.feeShipping,
            shippingOrder = orderInfo.feeShipping;
        shippingOrder = shippingOrder > 0 ? shippingOrder : js_translate.FREESHIP || 'FREE';
        formatCurrency(fCurrency,shippingPriceFormatted);

        _q('.totalBalance').innerHTML =  utils.formatPrice(totalBalance.toFixed(2), fCurrency, shippingPriceFormatted);
        _q('.totalProductsWhenReady').innerHTML = utils.formatPrice((totalProductsWhenReady).toFixed(2), fCurrency, shippingPriceFormatted)
        _q('.grandTotal').innerHTML = utils.formatPrice((totalBalance + totalProductsWhenReady).toFixed(2), fCurrency, shippingPriceFormatted);
        if(isNaN(shippingOrder)){
            _q('.shippingOrder').innerHTML = shippingOrder;
        }else{
            _q('.shippingOrder').innerHTML = utils.formatPrice(shippingOrder.toFixed(2), fCurrency, shippingPriceFormatted);
        }

        //Payment summary

        if(!!utils.localStorage().get('additionTextConfirmName')) {
            _q('.receipt-list ul .item').querySelector('.inner span').insertAdjacentText('beforeend', ' ' + utils.localStorage().get('additionTextConfirmName'));
        }
    }

    //Format dynanic currency price
    function formatCurrency(fCurrency,shippingPriceFormatted){
        let formatElm = _qAll('.formatPrice');
        let priceVal;
        if(!!formatElm.length > 0){
            for(let item of formatElm){
                priceVal = Number(item.innerHTML.replace(/[^0-9|.|,]/g,''));
                item.innerHTML = utils.formatPrice(priceVal,fCurrency,shippingPriceFormatted);
            }
        }
    }

    function replaceTokenSummary(){
        const allElements = _qAll('.payment-summary');
        for(let elem of allElements) {
            elem.innerHTML = elem.innerHTML.replace(/\{totalBalance\}/g, '<span class="totalBalance"></span>');
            elem.innerHTML = elem.innerHTML.replace(/\{totalProductsWhenReady\}/g, '<span class="totalProductsWhenReady"></span>');
            elem.innerHTML = elem.innerHTML.replace(/\{grandTotal\}/g, '<span class="grandTotal"></span>');
            elem.innerHTML = elem.innerHTML.replace(/\{shippingOrder\}/g, '<span class="shippingOrder"></span>');

        }
    }

    utils.checkAffAndFireEvents();

    /*
    //Fire Cake Pixel
    utils.fireCakePixel();
    utils.fireEverFlow();
    utils.firePicksell();
    */

    /*--------start : run common confirm------------*/
    const CommonConfirm = utils.CommonConfirm;
    class ConfirmV1 extends CommonConfirm {
    }
    const insConfirmV1 = new ConfirmV1();
    insConfirmV1.init();

    /*--------/end : run common confirm------------*/

    //------------------START--CREATE BUTTON CLAIM MORE DEAL - TU NGUYEN
        let createButtonClaimDeals = function(){
            let urlBtnClaimParam = utils.getQueryParameter('lead');

            //STOP the functional when url Button Claim Deals  Param  =  lead
            if(!urlBtnClaimParam){
                //console.log('invalid listicle param');
                return;
            }

            //Create HTML
            let divWrap = document.createElement('div'),
                span = document.createElement('span'),
                button = document.createElement('a'),
                btnTextDefault = js_translate.btnUrlDefault ? js_translate.btnUrlDefault : "Claim more deals",
                btnUrlDefault = urlBtnClaimParam === "us" ? "https://www.acptaofficial.com/" : "https://global.acptaofficial.com/",
                timer;

            let param = location.href.split("?").length > 1 ? location.href.split("?")[1] : "";
            if(param !== "") btnUrlDefault = btnUrlDefault + "?" + param;

            //Append Child to DOM
            divWrap.id = "btn-claimdeals";
            button.href = btnUrlDefault;
            button.innerHTML = btnTextDefault;
            divWrap.appendChild(span)
            divWrap.appendChild(button);

            _q('main').appendChild(divWrap);
            //Style Button Back
                //Wrap Style
                divWrap.style.position = "fixed";
                divWrap.style.right = "0px";
                divWrap.style.top = "50%";
                divWrap.style.backgroundColor = "rgba(0, 139, 204,0.9)";
                divWrap.style.zIndex = "10";
                divWrap.style.transform = "rotate(-90deg) translateY(-50%) translateX(100%)";
                divWrap.style.transformOrigin = "right center";
                divWrap.style.borderRadius = "5px 5px 0px 0px";
                //Arrow style
                span.style.position = "absolute";
                span.style.top = "50%";
                span.style.marginTop = "-6px";
                span.style.left = "10px";
                span.style.borderLeft = "8px solid transparent";
                span.style.borderRight = "8px solid transparent";
                span.style.borderBottom = "10px solid #fff";
                span.style.borderRadius = "3px";
                span.style.zIndex = "-1";
                //Button Style style
                button.style.display = "inline-block";
                button.style.padding = "10px 15px 10px 35px";
                button.style.color = "#fff";
                button.style.lineHeight = "1.15em";
                button.style.textDecoration = "none";
                button.style.fontWeight = "normal";
                button.style.fontFamily = "Roboto";
                button.style.fontSize = "16px";
                button.classList.add('no-tracking');

            //Create timming point to trigger click button on new tab
            timer = setTimeout(function(){
                if(utils.localStorage().get('leadClick') === "true") return;
                utils.localStorage().set('leadClick','true');
                button.click();
            },8000);
        }
    //-------------------END--CREATE BUTTON CLAIM MORE DEAL
    window.addEventListener('DOMContentLoaded', () => {

        //replace replaceTokenSummary
        replaceTokenSummary();

        //Create Button Claim deals
        createButtonClaimDeals();

    if(utils.localStorage().get('preOrder') === 'true') {
        _q('.receipt-list .title').innerHTML = js_translate.pre_order_title || 'ITEMS PRE-ORDERED';
    }
});
})(window.utils);
