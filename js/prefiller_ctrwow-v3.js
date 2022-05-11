(function (win, doc) {
    // Updated: 28/04/2022
    'use strict';
    try {
        var data, fillForm, FormData, len, _rand;

        // I like Chris's (http://chriscoyier.net/) randomize function.  Lets use it here.
        _rand = function (min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };

        var getScriptEmail = (function () {
            var scripts = document.getElementsByTagName('script');
            var index = scripts.length - 1;
            var myScript = scripts[index];
            return function () { return myScript.getAttribute('data-email'); };
        })();

        // Load FakerJS library
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Faker/0.7.2/MinFaker.js'
        script.onload = function () {
            fillForm();
        }
        document.head.appendChild(script);

        /*==========  CREATE DATA OBJECT  ==========*/

        FormData = function (faker) {
            this.randomWord = faker.Internet.domainWord();

            this.firstname = faker.Name.firstName() + '_test';
            this.lastname = faker.Name.lastName() + '_test';

            this.address1 = faker.Address.streetAddress() + '_test';
            this.numberAddress = _rand(100, 999) + '_test';
            this.bairroAddress = _rand(120, 888) + '123_test';
            this.city = faker.Address.city() + '_test';
            this.zip = faker.Address.zipCode();
            if (window.isStickyIO) {
                this.zip = faker.Address.zipCode();
            }
            this.phone = _rand(1000, 120000);

            this.cardNo = '4000000000000010';
            this.cvv = _rand(100, 999);
            if (doc.querySelector('.js-29next-product-list')) {
                this.cardNo = '6011111111111117';
                this.phone = '+8490' + _rand(1111111, 9999999);
            }
            if (doc.querySelector('.js-konnektive-product-list')) {
                this.cardNo = '7111111111111111';
                this.phone = '090' + _rand(1111111, 9999999);
                this.cvv = 100;
            }
            this.cardExpiryYear = fixRandMonth(_rand(1, 12)) + '/' + _rand(17, 37);
        };


        function fixRandMonth(input) {
            if (input < 10) {
                return '0' + input;
            } else {
                return input;
            }
        }

        // FormData.prototype.randomizeParagraph = function (el) {
        //     $(el).val(this.faker.Lorem.sentence(5));
        // };

        FormData.prototype.randomizeEmail = function (el) {
            //var email = getScriptEmail();
            //var random = this.randomWord + _rand(1, 10000);
            //el.value = email.split('@')[0] + '+' + random + '@' + email.split('@')[1];
            el.value = 'dfoqcteam' + _rand(1, 10000) + '@dfo.global';
            el.dispatchEvent(new Event('blur'));
        };



        /*==========  FILL IN THE FORM  ==========*/

        fillForm = function () {
            data = new FormData(win.Faker);

            // var iframe = document.querySelector('iframe');
            // if(iframe) { //check if in dotAdmin with iframe
            //     doc = iframe.contentDocument || iframe.contentWindow.document;
            // }

            if(doc.getElementsByName('firstName').length) {
                doc.getElementsByName('firstName')[0].value = data.firstname;
                doc.getElementsByName('firstName')[0].dispatchEvent(new Event('blur'));
            }

            if(doc.getElementsByName('lastName').length) {
                doc.getElementsByName('lastName')[0].value = data.lastname;
                doc.getElementsByName('lastName')[0].dispatchEvent(new Event('blur'));
            }

            if(doc.getElementById('customer_cpf')) {
                doc.getElementById('customer_cpf').value = '116.968.656-70';
                doc.getElementById('customer_cpf').dispatchEvent(new Event('blur'));

                if(doc.getElementById('customer_phone')) {
                    doc.getElementById('customer_phone').value = '(41) 2381-6677';
                    doc.getElementById('customer_phone').dispatchEvent(new Event('blur'));
                }
            } else {
                if(doc.getElementsByName('phoneNumber').length) {
                    doc.getElementsByName('phoneNumber')[0].value = data.phone;
                    doc.getElementsByName('phoneNumber')[0].dispatchEvent(new Event('blur'));
                }
            }

            if(doc.getElementById('shipping_cep')) {
                doc.getElementById('shipping_cep').value = '13087-430';
                doc.getElementById('shipping_cep').dispatchEvent(new Event('blur'));
            }

            if(doc.getElementById('shipping_numero')) {
                doc.getElementById('shipping_numero').value = 'test+numero';
                doc.getElementById('shipping_numero').dispatchEvent(new Event('blur'));
            }

            if(doc.getElementById('shipping_complemento')) {
                doc.getElementById('shipping_complemento').value = 'test+complemento';
                doc.getElementById('shipping_complemento').dispatchEvent(new Event('blur'));
            }
            if(doc.getElementsByName('customerIdentificationValue').length) {
                doc.getElementsByName('customerIdentificationValue')[0].value = '486.843.016-50';
                doc.getElementsByName('customerIdentificationValue')[0].dispatchEvent(new Event('blur'));
            }
            if(doc.getElementsByName('ruaAddress').length) {
                doc.getElementsByName('ruaAddress')[0].value = data.address1;
                doc.getElementsByName('ruaAddress')[0].dispatchEvent(new Event('blur'));
            }
            if(doc.getElementsByName('numberAddress').length) {
                doc.getElementsByName('numberAddress')[0].value = data.numberAddress;
                doc.getElementsByName('numberAddress')[0].dispatchEvent(new Event('blur'));
            }
            if(doc.getElementsByName('bairroAddress').length) {
                doc.getElementsByName('bairroAddress')[0].value = data.bairroAddress;
                doc.getElementsByName('bairroAddress')[0].dispatchEvent(new Event('blur'));
            }


            if(doc.getElementById('billing_firstname')) {
                doc.getElementById('billing_firstname').value = data.firstname;
                doc.getElementById('billing_firstname').dispatchEvent(new Event('blur'));
            }

            if(doc.getElementById('billing_lastname')) {
                doc.getElementById('billing_lastname').value = data.lastname;
                doc.getElementById('billing_lastname').dispatchEvent(new Event('blur'));
            }

            if(doc.getElementsByName('email').length) {
                data.randomizeEmail(doc.getElementsByName('email')[0]);
            }

            if(doc.getElementById('billing_email')) {
                data.randomizeEmail(doc.getElementById('billing_email'));
            }

            if(doc.getElementById('billing_phone')) {
                doc.getElementById('billing_phone').value = data.phone;
                doc.getElementById('billing_phone').dispatchEvent(new Event('blur'));
            }

            if(doc.getElementsByName('creditcard').length) {
                doc.getElementsByName('creditcard')[0].value = data.cardNo;
                doc.getElementsByName('creditcard')[0].dispatchEvent(new Event('blur'));
            }

            var dt = new Date();
            var mm = _rand(1, 12), yy = dt.getFullYear() - 2000 + _rand(3, 10);
            mm = (mm < 10 ? '0' : '') + mm, yy = (yy < 10 ? '0' : '') + yy;
            if(doc.getElementsByName('creditcard_expirydate').length) {
                doc.getElementsByName('creditcard_expirydate')[0].value = mm + '/' + yy;
            }
            if(doc.getElementsByName('cvv').length) {
                doc.getElementsByName('cvv')[0].value = data.cvv;
                doc.getElementsByName('cvv')[0].dispatchEvent(new Event('blur'));
            }


            if(doc.getElementsByName('address1').length) {
                doc.getElementsByName('address1')[0].value = data.address1;
                doc.getElementsByName('address1')[0].dispatchEvent(new Event('blur'));
            }
            if(doc.getElementsByName('streetAddress').length) {
                doc.getElementsByName('streetAddress')[0].value = data.address1;
                doc.getElementsByName('streetAddress')[0].dispatchEvent(new Event('blur'));
            }

            if(doc.getElementById('billing_address1')) {
                doc.getElementById('billing_address1').value = data.address1;
                doc.getElementById('billing_address1').dispatchEvent(new Event('blur'));
            }

            if(doc.getElementsByName('city').length) {
                doc.getElementsByName('city')[0].value = data.city;
                doc.getElementsByName('city')[0].dispatchEvent(new Event('blur'));
            }

            if(doc.getElementById('billing_city')) {
                doc.getElementById('billing_city').value = data.city;
                doc.getElementById('billing_city').dispatchEvent(new Event('blur'));
            }

            //doc.getElementsByName('countryCode')[0].selectedIndex =10;
            doc.getElementsByName('countryCode')[0].value = 'US';
            doc.getElementsByName('countryCode')[0].dispatchEvent(new Event('change'));
            if(doc.getElementsByName('state').length.length) {
                doc.getElementsByName('state')[0].selectedIndex = 1;
            }

            if(doc.getElementsByName('zipCode').length) {
                doc.getElementsByName('zipCode')[0].value = data.zip;
                doc.getElementsByName('zipCode')[0].dispatchEvent(new Event('blur'));
            }

            if(doc.getElementById('billing_postal')) {
                doc.getElementById('billing_postal').value = data.zip;
                doc.getElementById('billing_postal').dispatchEvent(new Event('blur'));
            }
        };
    } catch(e) {
        console.log(e);
    }
}(window, window.document));
