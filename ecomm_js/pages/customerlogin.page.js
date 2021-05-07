//using es6-promise and isomorphic-fetch just for build tool
try {
    require('es6-promise').polyfill();
    require('isomorphic-fetch');
} catch(err) {
    //console.log(err);
}

import Utils from '../common/utils.js';

class CustomerLogin {
    constructor() {

    }

    login() {
        const btnLogin = document.getElementById('btn-login');
        if(btnLogin) {
            btnLogin.addEventListener('click', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const orderNumber = document.getElementById('order-number').value;

                if(this.isFormValid()) {
                    if(!!document.querySelector('.loading-wrap'))
                        document.querySelector('.loading-wrap').classList.add('active');
                    else Utils.showAjaxPageLoading(true);
                    let url = 'https://emanage-prod-csm-api.azurewebsites.net/';
                    if(orderNumber.search('C') > 0) {
                        url += 'customer/auth/escn';
                    } else {
                        url += 'customer/auth';
                    }

                    const options = {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Basic ' + btoa(email + ':' + orderNumber),
                            'X_CID': siteSetting.CID
                        }
                    }
                    const res = await fetch(url, options);
                    if(res.ok) {
                        const result = await res.json();
                        console.log(result);
                        //save local storage
                        localStorage.setItem('authToken', result.token);
                        if (
                            window.location.host.indexOf('www.infinitikloud.com') > -1 ||
                            window.location.host.indexOf('test.infinitikloud.com') > -1
                        ) {
                            Utils.redirectPage('order.html');
                        }
                        else {
                            Utils.redirectPage('account.html');
                        }
                    } else {
                        if(!!document.querySelector('.loading-wrap'))
                            document.querySelector('.loading-wrap').classList.remove('active');
                        else Utils.hideAjaxPageLoading();
                        document.getElementById('login-fail-msg').classList.remove('hidden');
                        console.log(`Error : ${res.status} - ${res.statusText}`);
                    }
                }
            });
        }
    }

    isLoggedIn() {
        const authToken = localStorage.getItem('authToken');
        if(authToken) {
            console.log('logged in');
            if (
                window.location.host.indexOf('www.infinitikloud.com') > -1 ||
                window.location.host.indexOf('test.infinitikloud.com') > -1
            ) {
                Utils.redirectPage('order.html');
            }
            else {
                Utils.redirectPage('account.html');
            }
        }
    }

    initFormValidation() {
        const frmLogin = document.getElementById('frmLogin');
        if (!frmLogin) return;

        const inputs = frmLogin.querySelectorAll('input');
        for (let input of inputs) {
            input.addEventListener('blur', function (e) {
                Utils.validateInput(this);
            });

            input.addEventListener('change', function (e) {
                Utils.validateInput(this);
            });

            input.addEventListener('keyup', function (e) {
                Utils.validateInput(this);
            });
        }
    }

    isFormValid() {
        const frmLogin = document.getElementById('frmLogin');
        if (frmLogin) {
            var inputs = frmLogin.querySelectorAll('input');
            if (inputs && inputs.length > 0) {
                for (let input of inputs) {
                    Utils.validateInput(input);
                }
            }
        }

        const inputValid = frmLogin.querySelector('input.input-error') ? false : true;

        return inputValid;
    }

    init() {
        this.isLoggedIn();
        this.initFormValidation();
        this.login();
    }
}

const customerLogin = new CustomerLogin();
customerLogin.init();
