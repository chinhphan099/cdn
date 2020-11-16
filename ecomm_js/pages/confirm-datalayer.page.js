// import Utils from '../common/utils.js';

class ConfirmDatalayer {
    constructor() {
        // this.checkoutSuccessInfo = Utils.getCheckoutSuccessInfo();
        this.checkoutSuccessInfo = localStorage.getItem('checkoutSuccess')
    }

    fireGtm() {
        if(!this.checkoutSuccessInfo) return;

        this.checkoutSuccessInfo = JSON.parse(this.checkoutSuccessInfo)

        let orderTotal = 0;
        let priceType = 'discountedPrice';

        if (this.checkoutSuccessInfo.couponCode && this.checkoutSuccessInfo.couponCode !== '') {
            priceType = 'appliedCouponPrice';
        }
        for (let item of this.checkoutSuccessInfo.products) {
            const shipping = Number(item.shippingValue) || 0;
            orderTotal += item[priceType] * item.quantity + shipping;
        }

        const isFiredConfirmTotal = localStorage.getItem('isFiredConfirmTotal');
        if (!!isFiredConfirmTotal) return;

        localStorage.setItem('isFiredConfirmTotal', true);
        window.dataLayer = window.dataLayer || [];
        dataLayer.push({
            'event': 'confirmTotal',
            'orderTotal': orderTotal.toFixed(2)
        });
    }

    init() {
        this.fireGtm();
    }
}

const confirmDatalayer = new ConfirmDatalayer();
confirmDatalayer.init();
