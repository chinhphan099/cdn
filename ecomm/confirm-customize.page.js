import { constants } from '../common/constant.js';
import Utils from '../common/utils.js';
import CakePixel from '../common/cakepixel.js';
import EverFlow from '../common/everflow.js';

class Confirm {
    constructor() {
        this.checkoutSuccessInfo = Utils.getCheckoutSuccessInfo();
    }

    bindTexts(totalOrder, shippingTotal, data) {
        if (!this.checkoutSuccessInfo) return;

        //total product have shipping
        const orderTotalProduct = fCurrency.replace('######', (totalOrder + shippingTotal).toFixed(2));

        //shippingTotal of product
        shippingTotal = Number(shippingTotal) == 0 ? js_translate.freeShipping : fCurrency.replace('######', shippingTotal.toFixed(2));

        //total product
        totalOrder = fCurrency.replace('######', totalOrder.toFixed(2));

        const orderNumberElem = document.querySelectorAll('.order-summary');
        let customerName = data.shippingAddress ? data.shippingAddress.firstName + ' ' + data.shippingAddress.lastName : '';

        Array.prototype.slice.call(document.querySelectorAll('.order-summary')).forEach((orderNumber) => {
            orderNumber.innerHTML = orderNumber.innerHTML
                .replace(/\{orderNumber\}/g, data.cartNumber)
                .replace(/\{paymentMethod\}/g, data.paymentMethod ? data.paymentMethod : '')
                .replace(/\{customerName\}/g, customerName)
                .replace(/\{orderTotal\}/g, totalOrder)
                .replace(/\{orderTotalProduct\}/g, orderTotalProduct)
                .replace(/\{shippingTotal\}/g, shippingTotal)
                .replace(/\{orderDate\}/g, this.formatDate(null, null))
                .replace(/\{customerEmail\}/g, data.email);
        });
    }

    clearCart() {
        localStorage.removeItem(constants.CART);
    }

    fireFacebookPixel() {
        if (this.checkoutSuccessInfo) {
            if (typeof fbq !== 'undefined') {
                fbq('track', 'Purchase');
            }
        }
    }

    bindProductList() {
        if (!this.checkoutSuccessInfo) return;

        //fCurrency
        const fvalue = this.checkoutSuccessInfo.products[0].formattedPrice.replace(/[,|.]/g, '');
        const pValue = Number(this.checkoutSuccessInfo.products[0].discountedPrice).toFixed(2).toString().replace(/\./, '');
        window.fCurrency = fvalue.replace(pValue, '######');

        let tmp = document.querySelector('.receipt-list ul').innerHTML;
        let shipping, shippingTotal = 0;
        let productItem, listItems = '',
            total = 0,
            priceType = 'discountedPrice';
        if (this.checkoutSuccessInfo.couponCode && this.checkoutSuccessInfo.couponCode !== '') {
            priceType = 'appliedCouponPrice';
        }

        for (let item of this.checkoutSuccessInfo.products) {
            if (!item.productType && !!document.querySelector('.productType')) {
                const listItemProduct = document.querySelector('.receipt-list ul');
                tmp = listItemProduct.querySelector('.productType').classList.add('hidden');
                tmp = listItemProduct.innerHTML;
            }
            productItem = tmp.replace('{productName}', item.productName);
            shipping = Number(item.shippingValue) == 0 ? js_translate.freeShipping : fCurrency.replace('######', item.shippingValue);
            shippingTotal += Number(item.shippingValue);
            productItem = productItem.replace('{shipping}', shipping);
            productItem = productItem.replace('{quantity}', item.quantity);
            productItem = productItem.replace(/{productType}/g, item.productType ? item.productType : ''); //update
            productItem = productItem.replace(/{productImageUrl}/g, item.productImageUrl ? item.productImageUrl : ''); //update
            productItem = productItem.replace(/{titleProductName}/g, item.titleProductName ? item.titleProductName : '');
            productItem = productItem.replace('{midDescriptor}', this.checkoutSuccessInfo.paymentMethod);
            productItem = productItem.replace('{price}', fCurrency.replace('######', Number(item[priceType]).toFixed(2)));
            productItem = productItem.replace('{total}', fCurrency.replace('######', Number(item[priceType] * item.quantity).toFixed(2)));
            productItem = productItem.replace('{productTotal}', fCurrency.replace('######', Number(item[priceType] * item.quantity).toFixed(2)));
            total += item[priceType] * item.quantity;

            listItems += productItem;
        }

        //append product list
        document.querySelector('.receipt-list ul').innerHTML = listItems;
        let shippingAddressOrder = this.checkoutSuccessInfo.shippingAddress ? this.checkoutSuccessInfo.shippingAddress : this.checkoutSuccessInfo;
        let billingAddressOrder = this.checkoutSuccessInfo.billingAddress ? this.checkoutSuccessInfo.billingAddress : shippingAddressOrder;
        this.shippingAddress(shippingAddressOrder);
        this.billingAddress(billingAddressOrder);

        //bind customer info
        this.bindTexts(total, shippingTotal, this.checkoutSuccessInfo);

        //Implement Transaction Event in GTM
        this.transactionEventInGTM(total);
    }

    shippingAddress(data) {
        const address = document.querySelector('.box-shipping-address .receipt-details').innerHTML;
        if (!address) return;
        if(!data.firstName) {
            const layerInfo = document.querySelector('.box-shipping-address .receipt-details').closest('.order-details');
            if(!layerInfo) {
                return;
            }
            layerInfo.classList.add('hidden');
            if(document.querySelector('.title-detail')) {
                document.querySelector('.title-detail').classList.add('hidden');
            }
            if(document.querySelector('.customer-email')) {
                document.querySelector('.customer-email').classList.add('hidden');
            }
        }
        let addressForm;
        addressForm = this.replaceInfo(address, data);
        document.querySelector('.box-shipping-address .receipt-details').innerHTML = addressForm;
    }

    billingAddress(data) {
        if(!data.firstName) return;
        const addressBill = document.querySelector('.box-billing-details .receipt-details').innerHTML;
        if (!addressBill) return;
        let addressForm;
        addressForm = this.replaceInfo(addressBill, data);
        document.querySelector('.box-billing-details .receipt-details').innerHTML = addressForm;
    }

    replaceInfo(address, data) {
        let addressItem, addressForm;
        addressItem = address.replace('{customerName}', data.firstName + ' ' + data.lastName);
        addressItem = addressItem.replace('{customerAddress}', data.address1 + (data.address2 ? ', ' + data.address2 : ''));
        addressItem = addressItem.replace('{city}', data.city);
        addressItem = addressItem.replace('{stateName}', data.stateName);
        addressItem = addressItem.replace('{countryName}', data.customerCountryName);
        addressItem = addressItem.replace('{zipCode}', data.zipCode);
        addressForm = addressItem;
        return addressForm;
    }

    formatDate(formatString, splitSymbol) {
        var date = (new Date()).toISOString().split('T')[0];
        var result = '',
            arrDate = date.split('-')
        var splitSymbol = splitSymbol ? splitSymbol : '-';

        switch (formatString) {
            case 'dd/mm/yyyy':
                result = arrDate[2] + splitSymbol + arrDate[1] + splitSymbol + arrDate[0];
                break;
            case 'mm/dd/yyyy':
                result = arrDate[1] + splitSymbol + arrDate[2] + splitSymbol + arrDate[0];
                break;
            default:
                result = date;
        }

        return result;
    }

    getQueryParameter(param) {
        let href = '';
        if (location.href.indexOf('?')) {
            href = location.href.substr(location.href.indexOf('?'));
        }

        const value = href.match(new RegExp('[\?\&]' + param + '=([^\&]*)(\&?)', 'i'));
        return value ? value[1] : null;
    }

    //Implement Transaction Event in GTM
    transactionEventInGTM(totalOrder) {
        const products = [];
        let sku = '';
        for (let item of this.checkoutSuccessInfo.products) {
            sku = item.sku ? item.sku : '';
            products.push({
                // List of productFieldObjects.
                'name': item.productName,
                'brand': '',
                'category': '',
                'variant': item.productUrl,
                'id': sku,
                'price': item.discountedPrice,
                'quantity': item.quantity
            });
        }

        window.dataLayer = window.dataLayer || [];
        const affid = this.getQueryParameter('Affid') || '',
        currency = localStorage.getItem('currencyCode') || 'USD',
        total = Number(totalOrder).toFixed(2);

        window.dataLayer.push({
            'event': 'transaction',
            'ecommerce': {
                'purchase': {
                    'actionField': {
                        'id': this.checkoutSuccessInfo.cartNumber,
                        'affiliation': affid,
                        'revenue': total,
                        'shipping': 0,
                        'currency': currency,
                    },
                    'products': products
                }
            }
        });
        console.log(window.dataLayer);
    }

    //Init
    init() {
        this.bindProductList();
        this.clearCart();

        //fire facebook pixel
        this.fireFacebookPixel();

        //fire cakepixel
        new CakePixel().fire();

        //fire everflow
        new EverFlow().fire();
    }
}

const confirm = new Confirm();
confirm.init();
