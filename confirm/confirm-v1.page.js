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

    const eCRM = new EmanageCRMJS({
        webkey: confirm.mainWebKey,
        cid: confirm.CID,
        lang: '',
        isTest: utils.getQueryParameter('isCardTest') ? true : false
    });

    eCRM.Order.getRelatedOrders(confirm.orderInfo.orderNumber, function (result) {
        console.log(result);
        bindData(result);
    });

    //update upsells status in CRM from NEW status to PAID
    eCRM.Order.updateUpsellsStatus(confirm.orderInfo.orderNumber, function (result) {
        if(result) {
            console.log('upsells status is updated');
        }
    });

    function bindData(data) {
        console.log(data);

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

                for(let i = 0; i < data.relatedOrders.length; i++ ) {
                    if(data.relatedOrders[i].orderStatus !== 'Cancel') {
                        orderTotal += data.relatedOrders[i].orderPrice;
                    }
                }

                orderSummaryElem[i].innerHTML = orderSummaryElem[i].innerHTML.replace('orderNumber', data.orderNumber)
                                    .replace('orderDate', utils.formatDate(js_translate.dateFormat, js_translate.splitSymbol))
                                    .replace('customerName', data.firstName + ' ' + data.lastName)
                                    .replace('customerEmail', data.customerEmail)
                                    .replace('orderTotalValue', orderTotal.toFixed(2))
                                    .replace('currencyCode', data.currencyCode)
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
            charges_statement = "Charges on your statement will be processed for {productPrice} and will appear as {midDescriptor}";
        if(window.js_translate) {
            shipping = js_translate.shipping;
            total = js_translate.total;
            charges_statement = js_translate.product_charges_statement_confirm_page;
        }
        const productItemTmp = `<li class="item">
                                    <div class="inner">
                                        <span>{productName}</span>
                                        <span>{productPrice}</span>
                                    </div>
                                    <div class="inner">
                                        <span>${shipping}</span>
                                        <span>{shippingPrice}</span>
                                    </div>
                                    <div class="inner">
                                        <span>${total}</span>
                                        <span>{productTotal}</span>
                                    </div>
                                    <div class="inner"><span>${charges_statement}</span></div>
                                </li>`;
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

        let listProduct = productItemTmp.replace('{productName}', data.productName)
                                .replace(/\{productPrice\}/g, data.orderProductPriceFormatted)
                                .replace(/\{productTotal\}/g, `${data.orderPriceFormatted}<em>${installmentText}</em>`)
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

        for(let i = 0; i < data.relatedOrders.length; i++) {
            if(data.relatedOrders[i].orderStatus === 'Cancel') continue;

            if(confirm.orderInfo.installmentValue && confirm.orderInfo.installmentValue !== '') {
                const mainPrice = (data.relatedOrders[i].orderPrice / confirm.orderInfo.installmentValue).toFixed(2);
                installmentText = ' (' + confirm.orderInfo.installmentText
                                    .replace(/N/, confirm.orderInfo.installmentValue)
                                    .replace(/\$price/, utils.formatPrice(mainPrice, fCurrency, shippingPriceFormatted)) + ')';
            }

            let itemTmp = productItemTmp.replace('{productName}', data.relatedOrders[i].productName)
                                .replace(/\{productPrice\}/g, data.relatedOrders[i].orderProductPriceFormatted)
                                .replace(/\{productTotal\}/g, `${data.relatedOrders[i].orderPriceFormatted}<em>${installmentText}</em>`)
                                .replace('{shippingPrice}', data.relatedOrders[i].shippingPriceFormatted)
                                .replace('{midDescriptor}', data.relatedOrders[i].receipts[0].midDescriptor ? data.relatedOrders[i].receipts[0].midDescriptor : 'Paypal')
                                .replace(/\{orderNumber\}/g, data.relatedOrders[i].orderNumber);

            if(!!upsellProductNames) {
                for(let j = 0; j < upsellProductNames.length; j++) {
                    itemTmp = itemTmp.replace(upsellProductNames[j].replace(/\,/, '::').split('::')[0].trim(), upsellProductNames[j].replace(/\,/, '::').split('::')[1].trim());
                }
            }
            listProduct += itemTmp;
        }
        const ul = document.createElement('ul');
        ul.innerHTML = listProduct;
        let receiptList = _q('.receipt-list');
        if(receiptList) {
           receiptList.appendChild(ul);
        }

        if(!!utils.localStorage().get('additionTextConfirmName')) {
            _q('.receipt-list ul .item').querySelector('.inner span').insertAdjacentText('beforeend', ' ' + utils.localStorage().get('additionTextConfirmName'));
        }
    }

    //Fire Cake Pixel
    utils.fireCakePixel();
    utils.fireEverFlow();
    utils.firePicksell();

    /*--------start : run common confirm------------*/
    const CommonConfirm = utils.CommonConfirm;
    class ConfirmV1 extends CommonConfirm {
    }
    const insConfirmV1 = new ConfirmV1();
    insConfirmV1.init();
    /*--------/end : run common confirm------------*/

})(window.utils);
