(function (utils) {
    if (!utils) {
        console.log('utils module is not found');
        return;
    }

    const eCRM = new EmanageCRMJS({
        webkey: siteSetting.webKey,
        cid: siteSetting.CID,
        lang: '',
        isTest: utils.getQueryParameter('isCardTest') ? true : false
    });

    const billingFormId = 'frmBilling';
    let sameAsShipping = true;
    let initedCountriesAndStates = false;

    function bindEvents() {
        //binding event choose billing same as shipping or not
        const radioChooseBilling = _qAll('input[name="radio_choose_billing"]');
        for (let item of radioChooseBilling) {
            item.addEventListener('click', handleChooseBilling);
        }
    }

    function handleChooseBilling(e) {
        if (this.id === 'radio_same_as_shipping') {
            _qById(billingFormId).classList.add('hidden');
        } else if (this.id === 'radio_different_shipping') {
            if (!initedCountriesAndStates) {
                initCountries();
                initStates();
                initedCountriesAndStates = true;
            }
            _qById(billingFormId).classList.remove('hidden');
            sameAsShipping = false;

            addPostalCodeRegex(_qById('billing_country').value);
        }
    }

    function initCountries() {
        if (!window.countries) {
            console.log('billing form can not bind countries');
            return;
        }

        const selectCountry = _qById('billing_country');
        let listOptions = '<option value="">----</option>';
        window.countries.forEach(country => {
            listOptions += `<option value="${country.countryCode}">${country.countryName}</option>`
        });
        selectCountry.innerHTML = listOptions;

        const countryCode = utils.localStorage().get('countryCode');
        if(countryCode) {
            if(_q(`#billing_country option[value="${countryCode}"]`)) {
                selectCountry.value = countryCode;
            };
        }

        selectCountry.addEventListener('change', handleCountryChange);
    }

    function initStates() {
        bindCountryStates(window.states);
    }

    function handleCountryChange() {
        _qById('billing_province').setAttribute('disabled', 'true');
        initCountryStates(this.value);
        addPostalCodeRegex(this.value);
    }

    function bindCountryStates(states) {
        const select = _qById('billing_province');
        utils.removeInputError(select);
        select.options.length = 0;

        if(!select.classList.contains('no-required')) {
            select.setAttribute('required', '');
        }
        let listOptions = '<option value="">----</option>';

        if (states instanceof Error || typeof states === 'undefined') {
            select.removeAttribute('required');
        } else {
            for (const i of Object.keys(states)) {
                listOptions += `<option value="${states[i].StateCode}">${states[i].StateName}</option>`;
            };
        }

        select.innerHTML = listOptions;
        select.removeAttribute('disabled');
        //use for gg address autocomplete
        utils.events.emit('billingStatesUpdated');
    }

    //init state
    function initCountryStates(countryCode) {
        eCRM.Campaign.getCountryStates(countryCode, function (states) {
            bindCountryStates(states);
        });
    }

    function initFromValidation() {
        const form = document.forms[billingFormId];
        if (form) {
            const inputs = form.getElementsByTagName('input');
            for (const j of Object.keys(inputs)) {
                const input = inputs[j];

                input.addEventListener('blur', function (e) {
                    utils.validateInput(this);
                });

                input.addEventListener('change', function (e) {
                    utils.validateInput(this);
                });

                input.addEventListener('keyup', function (e) {
                    utils.validateInput(this);
                });
            }

            const selects = form.getElementsByTagName('select');
            for (const select of selects) {
                select.addEventListener('change', function (e) {
                    utils.validateInput(this);
                });
            }
        }
    }

    function isValid() {
        const form = document.forms[billingFormId];
        if (form) {
            var inputs = form.getElementsByTagName('input');
            if (inputs && inputs.length > 0) {
                for (const i of Object.keys(inputs)) {
                    utils.validateInput(inputs[i]);
                }
            }

            var selects = form.getElementsByTagName('select');
            if (selects && selects.length > 0) {
                for (let select of selects) {
                    utils.validateInput(select);
                }
            }
        }

        const inputValid = _q(`#${billingFormId} input.input-error`) ? false : true;
        const selectValid = _q(`#${billingFormId} select.input-error`) ? false : true;

        return (inputValid && selectValid);
    }

    function addPostalCodeRegex(countryCode) {
        if(window.countries && countryCode) {
            const country = countries.filter(c => c.countryCode === countryCode)[0];
            if(country) {
                const postalCode = _qById('billing_postal');
                if(country.postalCodeRegex) {
                    postalCode.setAttribute('pattern', country.postalCodeRegex);
                } else {
                    postalCode.removeAttribute('pattern');
                }
            }
        }
    }

    //Binding address field from street number and street name for Billing by Tu Nguyen
    function bindingAddressField(){

        try {
            var input = _qAll('.billing_address_field'),
                billingAddress = _qById('billing_address1'),
                streetName = _qById('billing_streetname'),
                streetNumber = _qById('billing_streetnumber');

            if( !streetName && !streetNumber){
                return;
            }
            for (let item of input){
                item.addEventListener('keyup', function(){
                    billingAddress.value = streetNumber.value +' '+ streetName.value;
                })
            }
        } catch (err){
            console.log('error: ', err);
        }
    }

    utils.billingForm = {
        isValid: isValid
    }

    document.addEventListener('DOMContentLoaded', () => {
        bindEvents();
        initFromValidation();
        bindingAddressField();
        //initFromValidation();
        // $('#customer_phone').intlTelInput({
        //     utilsScript: "pub-assets/js/intltelinput-utils.js"
        // });
    });
})(window.utils);
