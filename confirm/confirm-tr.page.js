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

    const isUpdatedUpsells = utils.localStorage().get('isUpdatedUpsells');
    if (!isUpdatedUpsells && confirm.orderInfo.paymentProcessorId !== 31 && confirm.orderInfo.paymentProcessorId !== 5) {
        //update upsells status in CRM from NEW status to PAID
        eCRM.Order.updateUpsellsStatus(confirm.orderInfo.orderNumber, function (result) {
            utils.localStorage().set('isUpdatedUpsells', 'true');
            if (result) {
                console.log('upsells status is updated');
            }
        });
    }

    function bindData(data) {
        console.log(data);
        let dotOrComma = '.';
        if (data.receipts[0].formattedAmount.indexOf(',') >= 0) {
            dotOrComma = ',';
        }
        const fvalue = data.receipts[0].formattedAmount.replace(/[,|.]/g, '');
        const pValue = data.receipts[0].amount.toFixed(2).toString().replace(/\./, '');
        const fCurrency = fvalue.replace(pValue, '######');

        //bind orde summary on header
        const orderSummaryElem = _qAll('.js-order-summary');
        if (!!orderSummaryElem) {
            const d = new Date();

            for (let i = 0, n = orderSummaryElem.length; i < n; i++) {
                let orderTotal = data.orderPrice;

                for (let i = 0; i < data.relatedOrders.length; i++) {
                    if (data.relatedOrders[i].orderStatus !== 'Cancel') {
                        orderTotal += data.relatedOrders[i].orderPrice;
                    }
                }

                orderSummaryElem[i].innerHTML = orderSummaryElem[i].innerHTML.replace('orderNumber', data.orderNumber)
                    .replace('orderDate', utils.formatDate(js_translate.dateFormat, js_translate.splitSymbol))
                    .replace('customerName', data.firstName + ' ' + data.lastName)
                    .replace('customerEmail', data.customerEmail)
                    .replace('orderTotal', fCurrency.replace('######', orderTotal.toFixed(2).toString().replace('.', dotOrComma)))
                    .replace('orderSaved', fCurrency.replace('######', confirm.orderInfo.savedTotal.toFixed(2).toString().replace('.', dotOrComma)));
            }
        }

        //bind shipping address
        const shippingElem = _q('.js-shippingaddress');
        const billingElem = _q('.js-billingaddress');
        const shippingTmp = `<div class="receipt-details">
                                <span>${data.shippingAddress.firstName} ${data.shippingAddress.lastName}</span>
                                <span>${data.shippingAddress.address1} ${data.shippingAddress.zipCode} ${data.shippingAddress.address2}</span>
                <span>${data.shippingAddress.city} ${data.shippingAddress.countryName}</span>
                                <span></span>
                            </div>`;
        const billingTmp = `<div class="receipt-details">
                                <span>${data.billingAddress.firstName} ${data.billingAddress.lastName}</span>
                                <span>${data.billingAddress.address1} ${data.billingAddress.zipCode} ${data.billingAddress.address2}</span>
                <span>${data.billingAddress.city} ${data.billingAddress.countryName}</span>
                                <span></span>
                            </div>`;
        shippingElem.innerHTML += shippingTmp;
        billingElem.innerHTML += billingTmp;

        /*--------add address2 to form------------*/
        if (!!data.shippingAddress.address2) {
            shippingElem.querySelectorAll('span')[2].insertAdjacentHTML('beforebegin', `<span>${data.billingAddress.address2}</span>`);
            billingElem.querySelectorAll('span')[2].insertAdjacentHTML('beforebegin', `<span>${data.billingAddress.address2}</span>`);
        }

        //bind product list
        let shipping = "Shipping",
            total = "Total",
            charges_statement = "Charges on your statement will be processed for {productPrice} and will appear as {midDescriptor}";
        if (window.js_translate) {
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
        if (confirm.orderInfo.installmentValue && confirm.orderInfo.installmentValue !== '') {
            const mainPrice = (data.orderPrice / confirm.orderInfo.installmentValue).toFixed(2);
            installmentText = ' (' + confirm.orderInfo.installmentText.replace(/N/, confirm.orderInfo.installmentValue).replace(/\$price/, 'R$' + mainPrice.replace(/\./, ',')) + ')';
        }

        let mainProductNames = (typeof mainProducts !== 'undefined') ? mainProducts : false;
        let upsellProductNames = (typeof upsellProducts !== 'undefined') ? upsellProducts : false;

        let listProduct = productItemTmp.replace('{productName}', data.productName)
            .replace(/\{productPrice\}/g, data.orderProductPriceFormatted)
            .replace(/\{productTotal\}/g, `${data.orderPriceFormatted}${installmentText}`)
            .replace('{shippingPrice}', data.shippingPriceFormatted)
            .replace('{midDescriptor}', data.receipts[0].midDescriptor ? data.receipts[0].midDescriptor : 'Paypal')
            .replace(/\{orderNumber\}/g, data.orderNumber);

        if (!!mainProductNames) {
            for (let i = 0; i < mainProductNames.length; i++) {
                if (data.productName.trim() === mainProductNames[i].split(',')[0].trim()) {
                    listProduct = listProduct.replace(mainProductNames[i].split(',')[0].trim(), mainProductNames[i].split(',')[1].trim());
                    break;
                }
            }
        }

        for (let i = 0; i < data.relatedOrders.length; i++) {
            if (data.relatedOrders[i].orderStatus === 'Cancel') continue;

            if (confirm.orderInfo.installmentValue && confirm.orderInfo.installmentValue !== '') {
                const mainPrice = (data.relatedOrders[i].orderPrice / confirm.orderInfo.installmentValue).toFixed(2);
                installmentText = ' (' + confirm.orderInfo.installmentText.replace(/N/, confirm.orderInfo.installmentValue).replace(/\$price/, 'R$' + mainPrice.replace(/\./, ',')) + ')';
            }

            let itemTmp = productItemTmp.replace('{productName}', data.relatedOrders[i].productName)
                .replace(/\{productPrice\}/g, data.relatedOrders[i].orderProductPriceFormatted)
                .replace(/\{productTotal\}/g, `${data.relatedOrders[i].orderPriceFormatted}${installmentText}`)
                .replace('{shippingPrice}', data.relatedOrders[i].shippingPriceFormatted)
                .replace('{midDescriptor}', data.relatedOrders[i].receipts[0].midDescriptor ? data.relatedOrders[i].receipts[0].midDescriptor : 'Paypal')
                .replace(/\{orderNumber\}/g, data.relatedOrders[i].orderNumber);

            if (!!upsellProductNames) {
                for (let j = 0; j < upsellProductNames.length; j++) {
                    itemTmp = itemTmp.replace(upsellProductNames[j].split(',')[0].trim(), upsellProductNames[j].split(',')[1].trim());
                }
            }
            listProduct += itemTmp;
        }
        const ul = document.createElement('ul');
        ul.innerHTML = listProduct;
        let receiptList = _q('.receipt-list');
        if (receiptList) {
            receiptList.appendChild(ul);
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
    class Confirm extends CommonConfirm {
    }
    const insConfirm = new Confirm();
    insConfirm.init();
    /*--------/end : run common confirm------------*/

    //------------------START--CREATE BUTTON CLAIM MORE DEAL - TU NGUYEN
    let createButtonClaimDeals = function () {
        let urlBtnClaimParam = utils.getQueryParameter('lead');

        //STOP the functional when url Button Claim Deals  Param  =  lead
        if (!urlBtnClaimParam) {
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
        if (param !== "") btnUrlDefault = btnUrlDefault + "?" + param;

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
        timer = setTimeout(function () {
            if (utils.localStorage().get('leadClick') === "true") return;
            utils.localStorage().set('leadClick', 'true');
            button.click();
        }, 8000);
    }
    //-------------------END--CREATE BUTTON CLAIM MORE DEAL

    window.addEventListener('DOMContentLoaded', () => {
        //Create Button Claim deals
        createButtonClaimDeals();
    });
})(window.utils);
