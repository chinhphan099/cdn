(() => {
    async function callAjax(url, options = {}) {
        try {
            let setting = {
                method: typeof options.method === 'undefined' ? 'GET' : options.method,
                headers: {}
            };

            if (setting.method === 'POST') {
                setting.body = typeof options.data === 'undefined' ? null : JSON.stringify(options.data);
            }

            if (typeof options.headers !== 'undefined') {
                setting.headers = options.headers;
            }

            if (typeof setting.headers['Content-Type'] === 'undefined') {
                setting.headers['Content-Type'] = 'application/json';
            }
            const res = await fetch(url, setting);

            /*if(res.ok) {
                try {
                    const jsonData = await res.json();
                    return jsonData;
                } catch(err) {
                    return Promise.resolve('Parse JSON fail');
                }
            }else{
                return Promise.reject(response);
            }*/
            const jsonData = await res.json();
            return jsonData;
        } catch(err) {
            return Promise.reject(err);
        }
    }

    function isValidEmail(str) {
        if (str.trim().length === 0) return false;

        const filter = /^([\w-\.\+]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,8}|[0-9]{1,3})(\]?)$/;
        if (filter.test(str)) {
            return true;
        } else {
            return false;
        }
    }
    function addInputError(input) {
        input.classList.add('input-error');
        if (input.closest('.form-group').querySelector('.error-message')) {
            input.closest('.form-group').querySelector('.error-message').classList.remove("hidden");
        }
    }
    function removeInputError(input) {
        input.classList.remove('input-error');
        if (input.closest('.form-group').querySelector('.error-message')) {
            input.closest('.form-group').querySelector('.error-message').classList.add("hidden");
        }
    }
    function validateInput(input) {
        let minLength = input.getAttribute('minlength');
        if (minLength) {
            minLength = Number(minLength);
        }
        const inputLength = input.value.length;

        if (input.attributes['required'] === undefined) {
            return;
        }

        if (input.attributes['required'] !== undefined && input.value.trim() === '') {
            addInputError(input);
        }
        else if (input.attributes['email'] !== undefined) {
            if (isValidEmail(input.value)) {
                removeInputError(input);
            } else {
                addInputError(input);
            }
        }
        else if (typeof input.pattern !== 'undefined') {
            if (new RegExp(input.pattern.toLowerCase()).test(input.value.toLowerCase())) {
                removeInputError(input);
            } else {
                addInputError(input);
            }
        }
        else {
            if (minLength) {
                if (inputLength > minLength) {
                    removeInputError(input);
                } else {
                    addInputError(input);
                }
            }
            else {
                removeInputError(input);
            }
        }
    }
    function validateFormElms(formId) {
        const inputs = document.getElementById(formId).querySelectorAll('input, textarea');
        for (let input of inputs) {
            input.addEventListener('blur', function (e) {
                validateInput(this);
            });

            input.addEventListener('change', function (e) {
                validateInput(this);
            });

            input.addEventListener('keyup', function (e) {
                validateInput(this);
            });
        }

        const selects = document.getElementById(formId).querySelectorAll('select');
        for (let select of selects) {
            select.addEventListener('change', function (e) {
                validateInput(this);
                let patternOrderNumber = '';
                switch(this.value) {
                    case '1': // website
                        patternOrderNumber = '^[0-9]{6,}'
                        break;
                    case '2': // Amazon
                        patternOrderNumber = '^[0-9]{3}-[0-9]{7}-[0-9]{7}$'
                        break;
                }
                if (patternOrderNumber) {
                    document.getElementById('customer_order_number').setAttribute('pattern', patternOrderNumber);
                }
                else {
                    document.getElementById('customer_order_number').removeAttribute('pattern');
                }
            });
        }
    }
    function validateFormOnClickButton(formId) {
        const frmShipping = document.getElementById(formId);
        if (frmShipping) {
            var inputs = frmShipping.querySelectorAll('input, textarea');
            if (inputs && inputs.length > 0) {
                for (let input of inputs) {
                    validateInput(input);
                }
            }
        }

        const selects = frmShipping.querySelectorAll('select');
        for(let select of selects) {
            validateInput(select);
        }

        const inputValid = frmShipping.querySelector('input.input-error') ? false : true;
        const selectValid = frmShipping.querySelector('select.input-error') ? false : true;
        const validCaptcha = frmShipping.querySelector('#input_RecaptchaField').value ? true : false;
        if (!validCaptcha) {
            document.querySelector('.captcha-error-message').classList.remove('hidden');
        } else {
            document.querySelector('.captcha-error-message').classList.add('hidden');
        }


        return (inputValid && selectValid && validCaptcha);
    }

    function resetReCaptcha(formId) {
        try {
            const frmShipping = document.getElementById(formId);
            frmShipping.querySelector('#input_RecaptchaField').value = '';
            if(grecaptcha) grecaptcha.reset();
        } catch(e) {}
    }

    function getInfo() {
        window.localStorage.setItem('email', document.getElementById('customer_email').value);
        window.localStorage.setItem('where_purchased', document.getElementById('where_purchased').value);
        return {
            email: document.getElementById('customer_email').value || '',
            phone: document.getElementById('customer_phone').value || '',
            firstName: document.getElementById('customer_firstname').value || '',
            lastName: document.getElementById('customer_lastname').value || '',
            orderNumber: document.getElementById('customer_order_number').value || '',
            productRatingStar: Number(document.getElementById('rating_star').value),
            productRatingComment: document.getElementById('customer_review').value || '',
            productPurchasedSource: Number(document.getElementById('where_purchased').value),
            productId: document.getElementById('productId').value
        }
    }
    function getQueryParameter(param) {
        let href = '';
        if (location.href.indexOf('?')) {
            href = location.href.substr(location.href.indexOf('?'));
        }

        const value = href.match(new RegExp('[\?\&]' + param + '=([^\&]*)(\&?)', 'i'));
        return value ? value[1] : null;
    }
    function submitWarrantyRegistration() {
        // const codeParam = getQueryParameter('code');
        const codeParam = 'e0f06eaf-2a52-44d7-b461-d22395a46042';
        if (!codeParam) {
            return;
        }
        const url = `https://dfoglobal-prod-pwrsystem-microservice.azurewebsites.net/api/warrantyregistrations?code=${codeParam}`;
        const options = {
            method: 'POST',
            data: getInfo()
        };
        document.querySelector(".preloading-wrapper").style.display = "block";
        document.querySelector(".preloading-wrapper").style.opacity = 0.8;
        callAjax(url, options).then((result) => {
            if(result) {
                console.log(result);
                if(result.error && result.error.message && result.error.message !== ''){
                    try{
                        alert(JSON.parse(result.error.message).message);
                    }catch(e){
                        alert(result.error.message);
                    }
                } else {
                    const action = document.querySelector('#frmWarrantyRegistration').action;
                    window.location.href = action + location.search;
                }
            } else {
                alert('Submit failed, please try again.');
            }
            document.querySelector(".preloading-wrapper").style.display = "none";
            document.querySelector(".preloading-wrapper").style.opacity = 0;
            resetReCaptcha('frmWarrantyRegistration');
        })
        .catch((error) => {
            console.log(error);
            document.querySelector(".preloading-wrapper").style.display = "none";
            document.querySelector(".preloading-wrapper").style.opacity = 0;
            resetReCaptcha('frmWarrantyRegistration');
        });
    }

    function submitEvent() {
        document.getElementById('btn_confirm').addEventListener('click', (e) => {
            e.preventDefault();
            const isValidForm = validateFormOnClickButton('frmWarrantyRegistration');

            if (isValidForm) {
                submitWarrantyRegistration();
            }
        });
    }

    function onhoverStars() {
        let indexActiveStar = -1;
        const iconStars = document.querySelectorAll('.icon-star-o');

        function removeActiveCls() {
            iconStars.forEach((el) => {
                el.classList.remove('active');
            });
        }
        function addActiveCls(index) {
            for(let i = 0; i < index; i++) {
                iconStars[i].classList.add('active');
            }
        }
        function setStarValue(isCheckValid) {
            const ratingStarInput = document.getElementById('rating_star');
            if (indexActiveStar > 0) {
                ratingStarInput.value = indexActiveStar;
            }
            if (isCheckValid) {
                validateInput(ratingStarInput);
            }
        }

        Array.prototype.slice.call(iconStars).forEach((elm) => {
            elm.addEventListener('click', function(e) {
                const currentIndex = [].indexOf.call(iconStars, e.currentTarget) + 1;
                removeActiveCls();
                if (indexActiveStar !== currentIndex) {
                    indexActiveStar = currentIndex;
                    addActiveCls(indexActiveStar);
                }
                else {
                    indexActiveStar = 1;
                    addActiveCls(indexActiveStar);
                }
                setStarValue(true);
            });
            elm.addEventListener('mouseenter', function(e) {
                removeActiveCls();
                addActiveCls([].indexOf.call(iconStars, e.currentTarget) + 1);
                setStarValue();
            });
            document.querySelector('.rating-stars').addEventListener('mouseleave', function(e) {
                removeActiveCls();
                addActiveCls(indexActiveStar);
                setStarValue();
            });
        });
    }

    function listener() {
        onhoverStars();
        submitEvent();
    }

    window.addEventListener('load', () => {
        validateFormElms('frmWarrantyRegistration');
        listener();
    });
})();
