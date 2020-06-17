((utils) => {
    if (!utils) {
        return;
    }

    let isInstallment = false;
    window.widget = window.widget ? window.widget : {};
    function handleInstallmentValues() {
        if (isInstallment) {
            window.widget.installmentpayment = {
                selectedMonth: '4',
                optionText: '4 installments of $price every two weeks no interest'
            };
        }
        else {
            delete window.widget.installmentpayment;
        }
    }

    const btnNext = _q('.btn-next');
    const btnInstallment = _q('.btn-installment');
    function buttonEvents() {
        if (!!btnNext) {
            btnNext.addEventListener('click', (e) => {
                e.currentTarget.classList.add('hidden');
                !!_q('.btn-installment') && _q('.btn-installment').classList.remove('hidden');
                !!_q('.installment-divider') && _q('.installment-divider').classList.add('hidden');
                !!_q('.installment-divider-2') && _q('.installment-divider-2').classList.remove('hidden');
                !!_q('.details-installment') && _q('.details-installment').classList.add('hidden');
                !!_q('.js-customer-title') && _q('.js-customer-title').classList.remove('hidden');
                !!_q('.js-customer-installment') && _q('.js-customer-installment').classList.add('hidden');
                _qById('js-basic-cta-button').classList.remove('btn-pay-installment');
                _q('.orderst-form').classList.remove('hidden');
                if (window.innerWidth > 767) {
                    _q('.orderst-form').scrollIntoView({ behavior: 'smooth' });
                }
                else {
                    window.scrollTo(0, 100);
                    document.querySelector('body').classList.add('cc-in-progress');
                }

                isInstallment = false;
                handleInstallmentValues();
            });
        }
        if (!!btnInstallment) {
            btnInstallment.addEventListener('click', (e) => {
                e.currentTarget.classList.add('hidden');
                !!btnNext && btnNext.classList.remove('hidden');
                !!_q('.installment-divider') && _q('.installment-divider').classList.remove('hidden');
                !!_q('.installment-divider-2') && _q('.installment-divider-2').classList.add('hidden');
                !!_q('.details-installment') && _q('.details-installment').classList.remove('hidden');
                !!_q('.js-customer-title') && _q('.js-customer-title').classList.add('hidden');
                !!_q('.js-customer-installment') && _q('.js-customer-installment').classList.remove('hidden');
                _qById('js-basic-cta-button').classList.add('btn-pay-installment');
                _q('.orderst-form').classList.remove('hidden');
                if (window.innerWidth > 767) {
                    _q('.orderst-form').scrollIntoView({ behavior: 'smooth' });
                }
                else {
                    window.scrollTo(0, 100);
                    document.querySelector('body').classList.add('cc-in-progress');
                }

                isInstallment = true;
                handleInstallmentValues();
            });
        }
    }

    function getWarrantyPrice(fCurrency, taxes) {
        let wPrice = 0, wFormatPrice = false;

        if (!!_qById('txtProductWarranty') && _qById('txtProductWarranty').checked) {
            const checkedItem = _q('.productRadioListItem input:checked'),
                data = JSON.parse(checkedItem.dataset.product),
                warrantyRate = [0.1, 0.2, 0.2, 0.2, 0.2, 0.3, 0.5, 0.15, 0.25, 0.35, 0.4, 0.45, 0.55, 0.6],
                funnelId = _qById('txtProductWarranty').value,
                funnelPrice = warrantyRate[parseInt(funnelId) - 1];

            let warrantyPrice = (Math.round(100 * data.productPrices.DiscountedPrice.Value * funnelPrice) / 100).toFixed(2);
            wPrice = Number(warrantyPrice);

            wFormatPrice = utils.formatPrice(warrantyPrice, fCurrency, taxes);
        }

        return { wPrice, wFormatPrice };
    }

    function installment() {
        const checkedItem = _q('.productRadioListItem input:checked'),
            data = JSON.parse(checkedItem.dataset.product),
            discountPrice = data.productPrices.DiscountedPrice.FormattedValue,
            fValue = data.productPrices.DiscountedPrice.FormattedValue.replace(/[,|.]/g, ''),
            pValue = data.productPrices.DiscountedPrice.Value.toString().replace(/\./, ''),
            fCurrency = fValue.replace(pValue, '######').replace(/\d/g, ''),
            warranty = getWarrantyPrice(fCurrency, discountPrice),
            grandTotal = (data.shippings[0].price + data.productPrices.DiscountedPrice.Value + warranty.wPrice).toFixed(2),
            installmentPrice = (Number(grandTotal) / 4).toFixed(2),
            installmentPriceFormat = utils.formatPrice(installmentPrice, fCurrency, discountPrice);

        if (!!btnInstallment && btnInstallment.querySelector('.js-img-loading')) {
            btnInstallment.querySelector('.js-img-loading').classList.add('hidden');
            if (btnInstallment.querySelector('.price')) {
                btnInstallment.querySelector('.price').parentNode.removeChild(btnInstallment.querySelector('.price'));
            }
            btnInstallment.querySelector('.js-img-loading').insertAdjacentHTML('afterend', `<span class="price">${installmentPriceFormat}</span>`);
        }
        if (!!_q('.js-customer-installment') && !!_q('.js-customer-installment').querySelector('.js-img-loading')) {
            const customerInstallmentTitle = _q('.js-customer-installment');
            customerInstallmentTitle.querySelector('.js-img-loading').classList.add('hidden');
            if (customerInstallmentTitle.querySelector('.price')) {
                customerInstallmentTitle.querySelector('.price').parentNode.removeChild(customerInstallmentTitle.querySelector('.price'));
            }
            customerInstallmentTitle.querySelector('.js-img-loading').insertAdjacentHTML('afterend', `<span class="price">${installmentPriceFormat}</span>`);
        }
    }

    function onClickProductRadio() {
        const inputs = _qAll('input[name="product"]');
        for (let input of inputs) {
            input.addEventListener('change', (e) => {
                if (!!e.target.dataset.product) {
                    handleInstallmentValues();
                    installment();
                }
            }, false);
        }
    }

    function onActiveCoupon() {
        if (!!_qById('couponBtn')) {
            _qById('couponBtn').addEventListener('click', (e) => {
                if (!_q('.productRadioListItem.special_offer')) {
                    installment();
                }
            }, false);
        }
    }

    function viewDetailsInstallmentsEvents() {
        const detailsInstallment = _q('.details-installment a');
        if (!!detailsInstallment) {
            detailsInstallment.addEventListener('click', function (e) {
                e.preventDefault();
                const modalId = e.currentTarget.getAttribute('href');
                !!_q(modalId) && _q(modalId).classList.remove('hidden');
            });
        }

        const closeDetailsInstallments = _qAll('.installment_modal .icon-close');
        for (const closeDetailsInstallment of closeDetailsInstallments) {
            closeDetailsInstallment.addEventListener('click', function (e) {
                _getClosest(e.target, '.installment_modal').classList.add('hidden');
            });
        }
    }

    function updatePopupPrice(data) {
        const popCurrencyElms = _qAll('#installment_modal .currency');
        Array.prototype.slice.call(popCurrencyElms).forEach(item => {
            item.textContent = utils.formatPrice(item.textContent, data.fCurrency, data.discountPrice);
        });
    }

    function buttonPreEvent() {
        !!document.querySelector('.btn-prev') && document.querySelector('.btn-prev').addEventListener('click', () => {
            document.querySelector('body').classList.remove('cc-in-progress');

            !!btnNext && btnNext.classList.remove('hidden');
        });
    }

    function listener() {
        buttonEvents();
        onClickProductRadio();
        onActiveCoupon();
        viewDetailsInstallmentsEvents();
        buttonPreEvent();
    }

    utils.events.on('bindOrderPage', function (data) {
        installment();
        updatePopupPrice(data);
    });

    const inputs = _qAll('.js_choose_billing input');
    for (let input of inputs) {
        input.addEventListener('click', function () {
            if (_q('.js_choose_billing').classList.contains('clicked')) {
                _q('.js_choose_billing').classList.remove('clicked');
            }
            else {
                _q('.js_choose_billing').classList.add('clicked');
            }
        });
    }

    function initial() {
        listener();
    }

    window.addEventListener('load', function () {
        initial();
    });
})(window.utils);
