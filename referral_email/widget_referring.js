(function (utils) {
    const referralFormId = 'frmReferral';

    function addClassValidForInput(input) {
        if(!!input.value && input.className.indexOf('input-error') == -1) {
            input.classList.add('input-valid');
        }
        else if(input.className.indexOf('input-error') > -1) {
            input.classList.remove('input-valid');
        }
    }

    function resetErrMess(input) {
        if(input.type === 'email') {
            input.closest('.form-group').querySelector('.error-message').innerText = emailErr;
        }
    }

    function initFromValidation() {
        const form = document.forms[referralFormId];
        if(form) {
            const inputs = form.getElementsByTagName('input');
            for (const j of Object.keys(inputs)) {
                const input = inputs[j];

                input.addEventListener('change', function (e) {
                    utils.validateInput(this);
                    //resetErrMess(this);
                    //addClassValidForInput(input);
                });

                input.addEventListener('keyup', function (e) {
                    utils.validateInput(this);
                    //resetErrMess(this);
                    //addClassValidForInput(input);
                });
            }
        }
    }

    function isValid() {
        const form = document.forms[referralFormId];
        if(form) {
            var inputs = form.getElementsByTagName('input');
            if (inputs && inputs.length > 0) {
                for (let input of inputs) {
                    utils.validateInput(input);
                    //resetErrMess(input);
                    //addClassValidForInput(input);
                }
            }
        }

        let isValid = _q(`#${referralFormId} input.input-error`) ? false : true;
        return isValid;
    }

    function handleEvents() {
        _q('.referral_email .text').addEventListener('click', function (e) {
            e.preventDefault();
            showPopup();
        });

        _qById('btn-yes-refer').addEventListener('click', function (e) {
            e.preventDefault();
            handleYesButton();
        });

        _qById('btn-no-refer').addEventListener('click', function (e) {
            e.preventDefault();
            hidePopup();
        });
    }

    function checkToRedirect() {
        if(_q('#referEmail1').readOnly && _q('#referEmail2').readOnly) {
            window.location = redirectLinkRefer || 'order.html' + window.location.search;
        }
    }

    async function callAjax(url, options = {}) {
        let setting = {
            method: typeof options.method === 'undefined' ? 'GET' : options.method,
            headers: {}
        };

        if (setting.method === 'POST') {
            setting.body = typeof options.data === 'undefined' ? null : options.data;
        }

        if (typeof options.headers !== 'undefined') {
            setting.headers = options.headers;
        }

        if (typeof options.headers['Content-Type'] === 'undefined') {
            setting.headers['Content-Type'] = 'application/json';
        }

        try {
            let res = await fetch(url, setting);

            if (res.ok) {
                return await res.json();
            } else {
                return Promise.reject(new Error(res.statusText));
            }
        }
        catch(err) {
            console.log(err.message);
        }
    }

    function handleYesButton() {
        if(isValid()) {
            let referrerName = _q('#referrerName').value;
            let firstName1 = _q('#referFirstName1').value,
                email1 = _q('#referEmail1').value;
            let firstName2 = _q('#referFirstName2').value,
                email2 = _q('#referEmail2').value;

            let options1 = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: 'contact[email]=' + email1 + '&contact[first_name]=' + firstName1 + '&contact[custom_field][referrer_first_name]=' + referrerName
            };

            let options2 = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: 'contact[email]=' + email2 + '&contact[first_name]=' + firstName2 + '&contact[custom_field][referrer_first_name]=' + referrerName
            };

            if(_q('#referEmail1').value !== _q('#referEmail2').value) { // Check difference Email
                _q('#btn-yes-refer').disabled = true;
                if(!_q('#referEmail1').readOnly) {
                    callAjax(apiUrl, options1).then(result => {
                        if(typeof result === 'object') {
                            _q('#referFirstName1').readOnly = true;
                            _q('#referEmail1').readOnly = true;
                            checkToRedirect();
                        }
                    }).catch(err => {
                        _q('#referEmail1').closest('.form-group').querySelector('.error-message').classList.remove('hidden');
                        _q('#referEmail1').readOnly = false;
                        _q('#referEmail1').classList.add('input-error');
                        _q('#referEmail1').classList.remove('input-valid');
                        _q('#referFirstName1').readOnly = false;
                        _q('#btn-yes-refer').disabled = false;
                    });
                }

                if(!_q('#referEmail2').readOnly) {
                    callAjax(apiUrl, options2).then(result => {
                        if(typeof result === 'object') {
                            _q('#referFirstName2').readOnly = true;
                            _q('#referEmail2').readOnly = true;
                            checkToRedirect();
                        }
                    }).catch(err => {
                        _q('#referEmail2').closest('.form-group').querySelector('.error-message').classList.remove('hidden');
                        _q('#referEmail2').readOnly = false;
                        _q('#referEmail2').classList.add('input-error');
                        _q('#referEmail2').classList.remove('input-valid');
                        _q('#referFirstName2').readOnly = false;
                        _q('#btn-yes-refer').disabled = false;
                    });
                }
            }
            else {
                _q('#referEmail2').classList.add('input-error');
                _q('#referEmail2').classList.remove('input-valid');
                _q('#referEmail2').closest('.form-group').querySelector('.error-message').classList.remove('hidden');
            }
        }
    }

    function showPopup() {
        _q('.w_modal_refer').style.display = 'block';
    }

    function hidePopup() {
        _q('.w_modal_refer').style.display = 'none';
    }

    document.addEventListener('DOMContentLoaded', () => {
        initFromValidation();
        handleEvents();
    });
})(window.utils);
