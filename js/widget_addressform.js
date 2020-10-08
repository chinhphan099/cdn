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

    const shippingFormId = 'frmShipping';

    function registerEvents() {
        utils.events.on('triggerAddressForm', triggerAddressForm);
    }
    registerEvents();

    function triggerAddressForm(countryCode) {
        const selectCountry = _qById('shipping_country');
        if(selectCountry && countryCode) {
            if(!!window.countries && window.countries.length === 1) {
                countryCode = window.countries[0].countryCode;
                utils.localStorage().set('countryCode', countryCode);
            }
            if(_q(`#shipping_country option[value="${countryCode}"]`)) {
                selectCountry.value = countryCode;
                //if(_qById('shipping_province').options.length < 1) {
                    initCountryStates(countryCode);
                //}
            };

            addPostalCodeRegex(selectCountry.value);
        }
    }

    function bindCountries() {
        let countryCode = utils.localStorage().get('countryCode');
        const languageFolder = window.siteSetting.languageFolder ? window.siteSetting.languageFolder : '';
        eCRM.Campaign.getCountries(function (countries) {
            if (Array.isArray(countries)) {
                //store to use in billing form
                window.countries = Array.prototype.slice.call(countries);

                const selectCountry = _qById('shipping_country');
                let listOptions = '<option value="">----</option>';
                window.countries.forEach(country => {
                    if(window.countries.length === 1) {
                        countryCode = country.countryCode;
                        utils.localStorage().set('countryCode', countryCode);
                    }
                    listOptions += `<option value="${country.countryCode}">${country.countryNameLocalized}</option>`
                });
                selectCountry.innerHTML = listOptions;

                if(!countryCode) {
                    countryCode = utils.localStorage().get('countryCode');
                }
                if(countryCode) {
                    if(_q(`#shipping_country option[value="${countryCode}"]`)) {
                        selectCountry.value = countryCode;
                        initCountryStates(countryCode);
                    };

                    addPostalCodeRegex(selectCountry.value);
                }

                selectCountry.addEventListener('change', handleCountryChange);
            }
        }, languageFolder);
    }
    bindCountries();

    function addPostalCodeRegex(countryCode) {
        if(window.countries && countryCode) {
            const country = countries.filter(c => c.countryCode === countryCode)[0];
            if(country) {
                const postalCode = _qById('shipping_postal');
                if(country.postalCodeRegex) {
                    postalCode.setAttribute('pattern', country.postalCodeRegex);
                } else {
                    postalCode.removeAttribute('pattern');
                }
            }
        }
    }

    function handleCountryChange() {
        _qById('shipping_province').setAttribute('disabled', 'true');
        initCountryStates(this.value);
        addPostalCodeRegex(this.value);
    }

    //init state
    function initCountryStates(countryCode) {
        const select = _qById('shipping_province');
        utils.removeInputError(select);
        select.options.length = 0;

        if(!select.classList.contains('no-required')) {
            select.setAttribute('required', '');
        }
        let listOptions = '<option value="">----</option>';

        if(countryCode !== '' && !select.classList.contains('no-required')) {
            eCRM.Campaign.getCountryStates(countryCode, function (states) {
                //store to use in billing form
                window.states = Array.prototype.slice.call(states);

                if (states instanceof Error || typeof states === 'undefined') {
                    select.removeAttribute('required');
                    return;
                }

                for (let i of Object.keys(states)) {
                    listOptions += `<option value="${states[i].StateCode}">${states[i].StateName}</option>`;
                };
                select.innerHTML = listOptions;
                select.removeAttribute('disabled');
                //use for gg address autocomplete
                utils.events.emit('shippingStatesUpdated');
            });
        } else {
            select.innerHTML = listOptions;
            select.removeAttribute('disabled');
            //use for gg address autocomplete
            utils.events.emit('shippingStatesUpdated');
        }
    }

    function initFromValidation() {
        const form = document.forms[shippingFormId];
        if (form) {
            const inputs = form.getElementsByTagName('input');
            for (const input of inputs) {
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
        const form = document.forms[shippingFormId];
        if (form) {
            var inputs = form.getElementsByTagName('input');
            if (inputs && inputs.length > 0) {
                for (let input of inputs) {
                    utils.validateInput(input);
                }
            }

            var selects = form.getElementsByTagName('select');
            if (selects && selects.length > 0) {
                for (let select of selects) {
                    utils.validateInput(select);
                }
            }
        }

        const inputValid = _q(`#${shippingFormId} input.input-error`) ? false : true;
        const selectValid = _q(`#${shippingFormId} select.input-error`) ? false : true;

        return (inputValid && selectValid);
    }

    function getShippingAddress() {
        const firstName = _qById('customer_firstname') ? _qById('customer_firstname').value : _qById('shipping_firstname').value;
        const lastName = _qById('customer_lastname') ? _qById('customer_lastname').value : _qById('shipping_lastname').value;

        const address = {
            "firstName": firstName,
            "lastName": lastName,
            "address1": _qById('shipping_address1').value,
            "address2": _qById('shipping_address2') != null ? _qById('shipping_address2').value : "",
            "city": _qById('shipping_city').value,
            "countryCode": _qById('shipping_country').value,
            "state": _qById('shipping_province').value,
            "zipCode": _qById('shipping_postal').value,
            "phoneNumber": _qById('customer_phone').value
        }

        return address;
    }

    //Binding address field from street number and street name for Shipping by Tu Nguyen
    function bindingAddressField(){

        try {
            var input = _qAll('.shipping_address_field'),
                shippingAddress = _qById('shipping_address1'),
                streetName = _qById('shipping_streetname'),
                streetNumber = _qById('shipping_streetnumber');

            if( !streetName && !streetNumber){
                return;
            }
            for (let item of input){
                item.addEventListener('keyup', function(){
                    if(this.parentNode.parentNode.classList.contains('top-street-name')){
                        shippingAddress.value = streetName.value +' '+ streetNumber.value;
                    } else {
                        shippingAddress.value = streetNumber.value +' '+ streetName.value;
                    }
                })
            }
        } catch (err){
            console.log('error: ', err);
        }
    }

    window.widget = window.widget ? window.widget : {};
    window.widget.shipping = {
        getShippingAddress: getShippingAddress,
        isValid: isValid
    };

    document.addEventListener('DOMContentLoaded', () => {
        initFromValidation();
        bindingAddressField();
        // $('#customer_phone').intlTelInput({
        //     utilsScript: "pub-assets/js/intltelinput-utils.js"
        // });
    });
})(window.utils);
