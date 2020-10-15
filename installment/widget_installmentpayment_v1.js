'use strict';

class InstallmentPayment {
    constructor() {
        this.fCurrency = 'R$';
        this.months = window.widget.installmentpayment.defaultMonths;
    }

    registerEvents() {
        utils.events.on('triggerInstallmentPayment', productInfo => this.bindInstallmentPayment(productInfo));
        utils.events.on('bindInstallmentWithAmexCard', cardType => this.bindInstallmentWithAmexCard(cardType));
    }

    formatPrice(price) {
        return price.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    }

    bindInstallmentPayment(productInfo) {
        const fValue = productInfo.discountPrice.replace(/[,|.]/g, '');
        const pValue = productInfo.discountPriceValue.toString().replace(/\./, '');
        this.fCurrency = fValue.replace(pValue, '######').replace(/\d/g, '');
        this.generateDropdowList(productInfo.discountPriceValue);
        if (!_q('.installment-text')) {
            this.bindInstallmentPaymentOnProductList();
        }
    }

    generateDropdowList(price) {
        const ddl = _qById('ddl_installpayment');
        if (ddl) {
            window.widget.installmentpayment.selectedMonth = isNaN(ddl.value) ? "1" : ddl.value;
            if(this.months.length > 0 && parseInt(window.widget.installmentpayment.selectedMonth) > this.months[this.months.length - 1]){
                window.widget.installmentpayment.selectedMonth = "1";
            }
            ddl.options.length = 0;
            let installmentpayment = window.widget.installmentpayment;
            let option = '', priceInstallment = '';
            for (let i = 0; i < this.months.length; i++) {
                priceInstallment = (price / this.months[i]).toFixed(2);
                priceInstallment = this.fCurrency.replace('######', this.formatPrice(priceInstallment));
                option = document.createElement('option');
                option.text = installmentpayment.optionText.replace(/N/, this.months[i]).replace(/\$price/, priceInstallment);
                option.value = this.months[i];
                ddl.appendChild(option);
            }

            ddl.value = installmentpayment.selectedMonth;
        }
    }

    bindInstallmentWithAmexCard(cardType) {
        try {
            const price = JSON.parse(_q('input[type="radio"]:checked').dataset.product).productPrices.DiscountedPrice.Value;
            if(cardType === 'amex') {
                this.months = window.widget.installmentpayment.amexMonths;
                this.generateDropdowList(price);
            } else {
                this.months = window.widget.installmentpayment.defaultMonths;
                this.generateDropdowList(price);
            }
        } catch (err) {
            console.log(err);
        }
    }

    bindInstallmentPaymentOnProductList() {
        const productList = _qAll('.productRadioListItem input[name="product"]');
        const months = window.widget.installmentpayment.defaultMonths;
        const maxMonth = months[months.length - 1];
        let product = null, priceInstallment;
        for (let p of productList) {
            if (p) {
                try {
                    const discountedPrice_installmentpayment = p.parentNode.querySelector('.discountedPrice_installmentpayment');
                    product = JSON.parse(p.dataset.product);
                    priceInstallment = (product.productPrices.DiscountedPrice.Value / maxMonth).toFixed(2);

                    if(discountedPrice_installmentpayment) {
                        const installment_price = discountedPrice_installmentpayment.querySelector('.installment-price');
                        const js_total_price = discountedPrice_installmentpayment.querySelector('.js-total-price');
                        installment_price.innerHTML = installment_price.innerHTML.replace('$N', maxMonth).replace('$price', this.fCurrency.replace('######', priceInstallment.replace(/\./, ",")));
                        js_total_price.innerHTML = `${window.js_translate.total}: ${product.productPrices.DiscountedPrice.FormattedValue}`;
                    } else if(!JSON.parse(_q('#js-widget-products').dataset.options).isHideInstallmentText) {
                        const div = document.createElement('div');
                        div.classList.add('installment-text');
                        div.innerHTML = `
                                        <img src="https://d16hdrba6dusey.cloudfront.net/sitecommon/images/installment_icon.png">
                                        <span class="desc">ate
                                            <span class="red-text">${maxMonth}x</span>
                                            de
                                            <span class="red-text">${this.fCurrency.replace('######', priceInstallment.replace(/\./, ","))}</span>
                                            sem juros
                                        </span>
                                `;
                        p.parentNode.querySelector('.js-unitDiscountRate').appendChild(div);
                    }


                } catch (err) {
                    console.log(err);
                }
            }
        }
    }

    //init class
    init() {
        if (!window.utils) {
            console.log('utils module is not found');
            return;
        }

        this.registerEvents();
    }
}

const installmentPayment = new InstallmentPayment();
installmentPayment.init();
