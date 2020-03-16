import { constants } from '../common/constant.js';
import Utils from '../common/utils.js';
import CakePixel from '../common/cakepixel.js';
import EverFlow from '../common/everflow.js';

class Confirm {
    constructor() {
        this.checkoutSuccessInfo = Utils.getCheckoutSuccessInfo();
    }

    bindTexts() {
        if(!this.checkoutSuccessInfo) return;

        const orderNumberElem = document.querySelector('.main-title .sub-text');
        if(orderNumberElem) {
            orderNumberElem.innerText = orderNumberElem.innerText.replace('{orderNumber}', this.checkoutSuccessInfo.cartNumber);
        }
    }

    formatPrice(price, formatedPrice) {
        if (formatedPrice.indexOf(',') > -1) {
            return this.fCurrency.replace('######', price.toString().replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')); // x.xxx.xxx,xx
        }
        return this.fCurrency.replace('######', price.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')); // x,xxx,xxx.xx
    }

    clearCart() {
        localStorage.removeItem(constants.CART);
    }

    fireFacebookPixel() {
        if(this.checkoutSuccessInfo) {
            if(typeof fbq !== 'undefined') {
                fbq('track', 'Purchase');
            }
        }
    }

    bindProductList() {
        if(!this.checkoutSuccessInfo) return;
        const fValue = this.checkoutSuccessInfo.products[0].formattedPrice.replace(/[,|.]/g, ''),
            pValue = this.checkoutSuccessInfo.products[0].discountedPrice.toString().replace(/\./, '');
        this.fCurrency = fValue.replace(pValue, '######').replace(/\d/g, '');

        let tmp = `
                    <div class="row-item confirm-order-details">
                        <ul class="list-unstyled">
                            <li class="order-item">
                                <h3><span class="delivery-quantity">{quantity}x {productName}</span></h3>
                                <span class="confirm-price">{price}</span>
                            </li>
                            <li class="order-item">
                                <span class="shipping-text">Shipping</span>
                                <span class="shipping-price">{shipping}</span>
                            </li>
                            <li class="order-item">
                                <span class="total-text">Total</span>
                                <span class="total-price"><b>{total}</b></span>
                            </li>
                        </ul>
                    </div>
                `,
            tmp2 = `
                    <div class="row-item confirm-order-details">
                        <ul class="list-unstyled">
                            <li class="order-item">
                                <h3><span class="delivery-quantity">{productName}</span></h3>
                                <span class="confirm-price">{price}</span>
                            </li>
                            <li class="order-item">
                                <span class="shipping-text">Shipping</span>
                                <span class="shipping-price">{shipping}</span>
                            </li>
                            <li class="order-item">
                                <span class="total-text">Total</span>
                                <span class="total-price"><b>{total}</b></span>
                            </li>
                        </ul>
                    </div>
                `;
        let productItem, listItems = '', total = 0, priceType = 'discountedPrice', shippingFee = 0;
        if(this.checkoutSuccessInfo.couponCode && this.checkoutSuccessInfo.couponCode !== '') {
            priceType = 'appliedCouponPrice';
        }

        for(let item of this.checkoutSuccessInfo.products) {
            shippingFee = !!item.shippingPrice ? item.shippingPrice : 0;
            let itemTotal = item[priceType] * item.quantity + shippingFee;
            if(!!item.isRadio) {
                productItem = tmp2.replace(/{productName}/g, item.productName)
                                .replace('{quantity}', item.quantity)
                                .replace('{shipping}', item.formatShippingPrice || this.formatPrice('0.00', item.formattedPrice))
                                .replace(/{price}/g, this.formatPrice(Number(item[priceType]).toFixed(2), item.formattedPrice))
                                .replace('{total}', this.formatPrice((itemTotal).toFixed(2), item.formattedPrice));
            }
            else {
                productItem = tmp.replace(/{productName}/g, item.productName)
                                .replace('{quantity}', item.quantity)
                                .replace('{shipping}', item.formatShippingPrice || this.formatPrice('0.00', item.formattedPrice))
                                .replace(/{price}/g, this.formatPrice(Number(item[priceType]).toFixed(2), item.formattedPrice))
                                .replace('{total}', this.formatPrice((itemTotal).toFixed(2), item.formattedPrice));
            }
            total += itemTotal;
            listItems += productItem;
        }

        //append product list
        const div = document.createElement('div');
        div.classList.add('order-details');
        div.innerHTML = listItems;
        document.querySelector('.main-container .container').appendChild(div);

        //add statement
        const div2 = document.createElement('div');
        div2.innerText = `Charges on your statement will be processed now for ${this.formatPrice(total.toFixed(2), this.checkoutSuccessInfo.products[0].formattedPrice)} and will appear as ${this.checkoutSuccessInfo.paymentMethod}`;
        document.querySelector('.main-container .container').appendChild(div2);
    }

    init() {
        this.bindTexts();
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
