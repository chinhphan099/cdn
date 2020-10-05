((utils) => {
    if (!utils) {
        console.log('utils module is not found');
        return;
    }

    let layoutData = window.goldStandardLayout,
        stepTitle = _qAll('.step-title'),
        elmArr = [];
    //Additional secure payment
    let renderSecurePayment = function(){
        let div = document.createElement('div'),
            divWrap = document.createElement('div'),
            imgTag = document.createElement('img'),
            span = document.createElement('span'),
            pTag = document.createElement('p'),
            h3Tag = document.createElement('p');

        //Add Class List
        divWrap.classList.add('w_inner');
        imgTag.src = layoutData.imgSecure;
        span.innerHTML = layoutData.textSecure;
        div.classList.add('section-guranteed');
        //Append children
        h3Tag.appendChild(span);
        pTag.appendChild(imgTag);
        divWrap.appendChild(h3Tag);
        divWrap.appendChild(pTag);
        div.appendChild(divWrap);

        return div;
    };

    //Additional Button Next Checkout
    let renderBtnNextCheckout = function(){
        let div = document.createElement('div'),
            button = document.createElement('button'),
            spanText = document.createElement('span');

        //Add Class List
        spanText.innerHTML = layoutData.btnNextCheckout;
        div.classList.add('w_button');
        div.classList.add('btn-next');
        div.classList.add('btn-order-now');
        //Append children
        button.appendChild(spanText);
        div.appendChild(button);

        return div;
    };

    //LIST ALL ELEMENT TO SWITCHOUT
    let stepTitle2 = stepTitle[1],
        stepTitle3 = stepTitle[2],
        stepTitle4 = stepTitle[3],
        summary = _q('.statistical'),
        customerForm = _q('.widget-customer-form'),
        shippingForm = _q('.widget-shipping-form'),
        billingForm = _q('.widget-billing-form'),
        paypalButton = _q('#js-paypal-oneclick-button'),
        devider = _q('.divider'),
        paymentImage = _q('.ct_image_wrap'),
        creditCardForm = _q('.widget-creditcard-form'),
        expirationDate = _q('.expiration_date'),
        ctaButton = _q('#js-basic-cta-button'),
        guaranteeBlock = _q('.guarantee-block'),
        warrantyBlock = _q('#js-widget-productwarranty') ? _q('#js-widget-productwarranty') : false,
        btnNextCheckout = renderBtnNextCheckout(),
        securePayment = renderSecurePayment();

    elmArr.push(
        {
            title: 'stepTitle2',
            elm: stepTitle2
        },
        {
            title: 'stepTitle3',
            elm: stepTitle3
        },
        {
            title: 'stepTitle4',
            elm: stepTitle4
        },
        {
            title: 'summary',
            elm: summary
        },
        {
            title: 'customerForm',
            elm: customerForm
        },
        {
            title: 'shippingForm',
            elm: shippingForm
        },
        {
            title: 'billingForm',
            elm: billingForm
        },
        {
            title: 'paypalButton',
            elm: paypalButton
        },
        {
            title: 'devider',
            elm: devider
        },
        {
            title: 'paymentImage',
            elm: paymentImage
        },
        {
            title: 'creditCardForm',
            elm: creditCardForm
        },
        {
            title: 'expirationDate',
            elm: expirationDate
        },
        {
            title: 'ctaButton',
            elm: ctaButton
        },
        {
            title: 'guaranteeBlock',
            elm: guaranteeBlock
        },
        {
            title: 'securePayment',
            elm: securePayment
        },
        {
            title: 'btnNextCheckout',
            elm: btnNextCheckout
        },
        {
            title: "warrantyBlock",
            elm: warrantyBlock
        }
    );

    for(let item of elmArr){
        if(!item.elm) {
            console.log(item.title + ' was not found');
        }
    }
    //Re-installing the order of Element in  Column Left
    let sortOrderColLeft = function(){
        let colWrap = _qAll('.col-md-6')[0];

        colWrap.insertBefore(summary,_q('#js-widget-products').nextSibling);
    }
    //Re-installing the order of Element in  Column Right
    let sortOrderColRight = function(){
        let colWrap = _qAll('.col-md-6')[1],
            divWrap = document.createElement('div');

        //Append children
        stepTitle2.querySelector('h2').innerText = layoutData.stepTitle2;
        colWrap.appendChild(stepTitle2);
        if (!!paypalButton) {
            colWrap.appendChild(paypalButton);
        }
        if (!!devider) {
            devider.querySelector('.title').innerText = layoutData.devider;
            colWrap.appendChild(devider);
        }
        colWrap.appendChild(paymentImage);
        colWrap.appendChild(btnNextCheckout);

        //Add Div wrap
        divWrap.classList.add('orderst-form');
        divWrap.classList.add('hidden');
        divWrap.appendChild(stepTitle3);
        divWrap.appendChild(customerForm);
        divWrap.appendChild(shippingForm);
        divWrap.appendChild(billingForm);
        divWrap.appendChild(creditCardForm);
        divWrap.appendChild(expirationDate);

        //detect warranty Life block
        if(warrantyBlock){
            divWrap.appendChild(warrantyBlock);
        }
        divWrap.appendChild(ctaButton);

        //End wrap div
        colWrap.appendChild(divWrap);
        colWrap.appendChild(securePayment);
        colWrap.appendChild(guaranteeBlock);
        colWrap.removeChild(stepTitle4);

        // Detect .secure-process-common
        if (!!_q('.secure-process-common')) {
            const firstTitle = colWrap.querySelector('.step-title');
            firstTitle.insertAdjacentElement('afterend', _q('.secure-process-common'));
        }
    }

    let buttonEvents = function () {
        const btnNext = _q('.btn-next');
        if(!!btnNext) {
            btnNext.addEventListener('click', (e) => {
                e.currentTarget.classList.add('hidden');
                _q('.orderst-form').classList.remove('hidden');
                _q('.orderst-form').scrollIntoView({behavior: 'smooth'});
            });
        }
    }
    let jsBillingRadio = function(){
        const inputs = _qAll('.js_choose_billing input');
        for (let input of inputs) {
            input.addEventListener('click', function () {
                if(_q('.js_choose_billing').classList.contains('clicked')) {
                    _q('.js_choose_billing').classList.remove('clicked');
                }
                else {
                    _q('.js_choose_billing').classList.add('clicked');
                }
            });
        }
    }
    window.addEventListener('DOMContentLoaded', function(){
        try {
            sortOrderColLeft();
            sortOrderColRight();
            _q('body').classList.add('gold-layout');

            //initial event
            buttonEvents();
            jsBillingRadio();
        }
        catch(err){
            console.log(err)
        }
    });
})(window.utils);

