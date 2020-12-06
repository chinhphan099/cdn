(function (global, document) {
    function polyfill() {
        //matches
        if (!Element.prototype.matches) {
            Element.prototype.matches = Element.prototype.msMatchesSelector ||
                Element.prototype.webkitMatchesSelector;
        }

        //closest
        if (!Element.prototype.closest) {
            Element.prototype.closest = function (s) {
                let el = this;
                if (!document.documentElement.contains(el)) return null;
                do {
                    if (el.matches(s)) return el;
                    el = el.parentElement || el.parentNode;
                } while (el !== null && el.nodeType === 1);
                return null;
            };
        }

        //custom event : support IE 11
        if (typeof window.CustomEvent !== 'function') {
            function CustomEvent(event, params) {
                params = params || { bubbles: false, cancelable: false, detail: null };
                var evt = document.createEvent('CustomEvent');
                evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
                return evt;
            }
            CustomEvent.prototype = window.Event.prototype;
            window.CustomEvent = CustomEvent;
        }
    }
    polyfill();

    global._q = (selector) => {
        return document.querySelector(selector);
    }

    global._qAll = (selector) => {
        return document.querySelectorAll(selector);
    }

    global._qById = (id) => {
        return document.getElementById(id);
    }

    global._createElem = (elem) => {
        return document.createElement(elem);
    }

    global._getClosest = (elem, selector) => {
        if (!Element.prototype.matches) {
            Element.prototype.matches =
                Element.prototype.matchesSelector ||
                Element.prototype.mozMatchesSelector ||
                Element.prototype.msMatchesSelector ||
                Element.prototype.oMatchesSelector ||
                Element.prototype.webkitMatchesSelector ||
                function (s) {
                    let matches = (this.document || this.ownerDocument).querySelectorAll(s),
                        i = matches.length;
                    while (--i >= 0 && matches.item(i) !== this) { }
                    return i > -1;
                }
        }

        // Get the closest matching element
        for (; elem && elem !== document; elem = elem.parentNode) {
            if (elem.matches(selector)) {
                return elem;
            }
        }
        return null;
    }

    global.sha256 = function sha256(ascii) {
        function rightRotate(value, amount) {
            return (value >>> amount) | (value << (32 - amount));
        }

        var mathPow = Math.pow;
        var maxWord = mathPow(2, 32);
        var lengthProperty = 'length'
        var i, j; // Used as a counter across the whole file
        var result = ''

        var words = [];
        var asciiBitLength = ascii[lengthProperty] * 8;

        //* caching results is optional - remove/add slash from front of this line to toggle
        // Initial hash value: first 32 bits of the fractional parts of the square roots of the first 8 primes
        // (we actually calculate the first 64, but extra values are just ignored)
        var hash = sha256.h = sha256.h || [];
        // Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
        var k = sha256.k = sha256.k || [];
        var primeCounter = k[lengthProperty];
        /*/
        var hash = [], k = [];
        var primeCounter = 0;
        //*/

        var isComposite = {};
        for (var candidate = 2; primeCounter < 64; candidate++) {
            if (!isComposite[candidate]) {
                for (i = 0; i < 313; i += candidate) {
                    isComposite[i] = candidate;
                }
                hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
                k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
            }
        }

        ascii += '\x80'
        while (ascii[lengthProperty] % 64 - 56) ascii += '\x00' // More zero padding
        for (i = 0; i < ascii[lengthProperty]; i++) {
            j = ascii.charCodeAt(i);
            if (j >> 8) return; // ASCII check: only accept characters in range 0-255
            words[i >> 2] |= j << ((3 - i) % 4) * 8;
        }
        words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
        words[words[lengthProperty]] = (asciiBitLength)

        // process each chunk
        for (j = 0; j < words[lengthProperty];) {
            var w = words.slice(j, j += 16); // The message is expanded into 64 words as part of the iteration
            var oldHash = hash;
            // This is now the undefinedworking hash", often labelled as variables a...g
            // (we have to truncate as well, otherwise extra entries at the end accumulate
            hash = hash.slice(0, 8);

            for (i = 0; i < 64; i++) {
                var i2 = i + j;
                // Expand the message into 64 words
                // Used below if
                var w15 = w[i - 15], w2 = w[i - 2];

                // Iterate
                var a = hash[0], e = hash[4];
                var temp1 = hash[7]
                    + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) // S1
                    + ((e & hash[5]) ^ ((~e) & hash[6])) // ch
                    + k[i]
                    // Expand the message schedule if needed
                    + (w[i] = (i < 16) ? w[i] : (
                        w[i - 16]
                        + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) // s0
                        + w[i - 7]
                        + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10)) // s1
                    ) | 0
                    );
                // This is only used once, so *could* be moved below, but it only saves 4 bytes and makes things unreadble
                var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) // S0
                    + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])); // maj

                hash = [(temp1 + temp2) | 0].concat(hash); // We don't bother trimming off the extra ones, they're harmless as long as we're truncating when we do the slice()
                hash[4] = (hash[4] + temp1) | 0;
            }

            for (i = 0; i < 8; i++) {
                hash[i] = (hash[i] + oldHash[i]) | 0;
            }
        }

        for (i = 0; i < 8; i++) {
            for (j = 3; j + 1; j--) {
                var b = (hash[i] >> (j * 8)) & 255;
                result += ((b < 16) ? 0 : '') + b.toString(16);
            }
        }
        return result;
    }

    async function callAjax(url, options = {}) {
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

        let res = await fetch(url, setting);

        if (res.ok) {
            return res.json();
        } else {
            return Promise.reject(new Error(res.statusText));
        }
    }

    function formatPrice(price, fCurrency, shippingPriceFormatted) {
        if (shippingPriceFormatted.indexOf(',') > -1) {
            return fCurrency.replace('######', price.toString().replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')); // x.xxx.xxx,xx
        }
        return fCurrency.replace('######', price.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')); // x,xxx,xxx.xx
    }

    function getCurrencySymbol(formattedValue, value) {
        return formattedValue.replace(/[.|,]/, '').replace(' ', '').replace(value.toString().replace(/[.|,]/, ''), '');
    }

    function isEmail(str) {
        if (str.trim().length === 0) return false;
        const filter = /^([\w-\.\+]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,8}|[0-9]{1,3})(\]?)$/;
        if (filter.test(str)) {
            return true;
        } else {
            return false;
        }
    }

    function validatePhoneBr(input) {
        const phoneVal = input.value.replace(/\(|\)|\ |\-|\+/gi, '');
        if (/^[0-9]{8,15}$/.test(phoneVal)) {
            return true;
        }
        else {
            return false;
        }
    }

    function validateInput(input) {
        if (input.attributes['required'] != undefined && input.value.trim() === '') {
            addInputError(input);
        } else if (input.attributes['email'] != undefined) { //validate email
            if (utils.isEmail(input.value)) {
                removeInputError(input);
            } else {
                addInputError(input);
            }
        } else if (input.attributes['phonebr'] != undefined) { //validate Brazil phone number
            if (utils.validatePhoneBr(input)) {
                removeInputError(input);
            } else {
                addInputError(input);
            }
        } else if ((input.id.indexOf('_postal') > 0 || input.id.indexOf('_cep') > 0) && typeof input.pattern !== 'undefined') {
            if (new RegExp(input.pattern.toLowerCase()).test(input.value.toLowerCase())) {
                removeInputError(input);
            } else {
                addInputError(input);
            }
        } else {
            removeInputError(input);
        }
    }

    function validateCheckbox(input) {
        if (input.attributes['required'] != undefined) {
            if (!input.checked) {
                addInputError(input);
            }
            else {
                removeInputError(input);
            }
        }
    }

    function validForm(formId) {
        const form = document.forms[formId];
        if (form) {
            const inputs = form.getElementsByTagName('input');
            if (inputs && inputs.length > 0) {
                for (let input of inputs) {
                    if (input.type === 'checkbox') {
                        validateCheckbox(input);
                    }
                    else {
                        validateInput(input);
                    }
                }
            }
        }
        let isValid = _q(`#${formId} input.input-error`) ? false : true;
        return isValid;
    }

    function addInputError(input) {
        input.classList.add('input-error');
        input.classList.remove('input-valid');
        if (input.closest('.form-group').querySelector('.error-message')) {
            input.closest('.form-group').querySelector('.error-message').classList.remove('hidden');
        }
    }

    function removeInputError(input) {
        input.classList.remove('input-error');
        input.classList.add('input-valid');
        if (input.closest('.form-group').querySelector('.error-message')) {
            input.closest('.form-group').querySelector('.error-message').classList.add('hidden');
        }
    }

    String.prototype.formatString = function (format) {
        let value = '';
        switch (format) {
            case '0000-0000-0000-0000':
                var vls = [];
                for (let i = 0; i < this.length; i += 4) {
                    if (vls.length < 4) {
                        vls.push(this.substring(i, i + 4));
                    }
                }
                value = vls.join('-');
                break;
            case '0000-0000-0000-0000-000':
                var vls = [];
                for (var i = 0; i < this.length; i += 4) {
                    if (vls.length == 4) {
                        vls.push(this.substring(i, i + 3));
                    } else {
                        vls.push(this.substring(i, i + 4));
                    }
                }
                value = vls.join('-');
                break;
            case '0000':
                value = (this.length > 4) ? this.substring(0, 4) : this;
                break;
            case '00/00':
                var vls = []
                for (let i = 0; i < this.length; i += 2) {
                    if (vls.length < 2) {
                        vls.push(this.substring(i, i + 2));
                    }
                }

                value = vls.join('/');
                break;
            case '0000-****-****-0000':
                var vls = [];
                for (let i = 0; i < this.length; i += 4) {
                    if (vls.length < 4) {
                        if (vls.length > 0 && vls.length < 3) {
                            vls.push('****');
                        } else {
                            vls.push(this.substring(i, i + 4));
                        }
                    }
                }
                value = vls.join('-');
                break;
            case '00000-000':
                var vls = [];
                for (let i = 0; i < this.length; i += 5) {
                    if (vls.length < 5) {
                        vls.push(this.substring(i, i + 5));
                    }
                }
                value = vls.join('-');
                break;
            default:
                value = this;
                break;
        }
        return value;
    }

    function maskNumber(input, formatString) {
        input.addEventListener('keypress', function (e) {
            const code = e.which || e.keyCode;
            let value = '';
            if ((code > 47 && code < 58) //number
                || code == 8 || code == 46 //del
                || (code > 36 && code < 41) //forword
                || (code > 15 && code < 19) //shift ctrl atl
                || code == 9 || code == 13 //tab enter
            ) {
                value = this.value.toString().replace(/\-/g, '').replace(/\//g, '').substring(0, formatString.length);
            } else {
                e.preventDefault();
                return;
            }

            this.value = value.formatString(formatString);
            if (value.length >= formatString.length) e.preventDefault();
        });
    }

    function resetForm(formId) {
        const elems = _qAll(formId + ' .input-error');
        for (const i of Object.keys(elems)) {
            const elem = elems[i];
            elem.classList.remove('input-error');
            elem.parentElement.getElementsByClassName('error-message')[0].classList.add('hidden');
        }
    }

    /** Handle window locaStorage of html5 */
    function localStorage() {
        return {
            get: (key) => {
                if (typeof (Storage) !== 'undefined') {
                    return window.localStorage.getItem(key);
                } else {
                    console.log('Sorry! No Web Storage support ....');
                    return null;
                }
            },
            set: (key, value) => {
                if (typeof (Storage) !== 'undefined') {
                    window.localStorage.setItem(key, value);
                } else {
                    console.log('Sorry! No Web Storage support ...');
                }
            },
            remove: (item) => {
                if (typeof (Storage) !== 'undefined') {
                    window.localStorage.removeItem(item);
                } else {
                    console.log('Sorry! No Web Storage support ...');
                }
            }
        }
    }

    /**
     * This method is used to redirect to specific page with keep all parameters of current page
     * @param {string} page - url will be redirected to
     * @param {string} target - example : _blank, _self, ...
     */
    function redirectPage(page, target) {
        const currentQueryString = location.search.length > 0 ? location.search.substr(1) : '';
        //const pageQueryString = (page.indexOf('?') > 0) ? page.substr(page.indexOf('?') + 1) : '';

        if (page.indexOf('?') > 0) {
            page += (currentQueryString !== '' ? '&' + currentQueryString : '');
        } else {
            page += (currentQueryString !== '' ? '?' + currentQueryString : '');
        }

        if (typeof target !== 'undefined' && target == '_blank') {
            window.open(page);
        } else {
            window.location = page;
        }
        return false;
    }

    function removeParamFromUrl(key, paramsStr) {
        let param, params_arr = [];
        if (paramsStr !== '') {
            params_arr = paramsStr.split('&');
            for (let i = params_arr.length - 1; i >= 0; i--) {
                param = params_arr[i].split('=')[0];
                if (param === key) {
                    params_arr.splice(i, 1);
                }
            }
        }

        return params_arr.join('&');
    }

    /**
     * Get value of url query string by parameter
     * @param {string} param - url parameter
     */
    function getQueryParameter(param) {
        let href = '';
        if (location.href.indexOf('?')) {
            href = location.href.substr(location.href.indexOf('?'));
        }

        const value = href.match(new RegExp('[\?\&]' + param + '=([^\&]*)(\&?)', 'i'));
        return value ? value[1] : null;
    }

    function addParamIntoUrl(param, value) {
        const currentUrl = window.location.href,
            newparam = currentUrl.indexOf('?') > -1 ? `&${param}=${value}` : `?${param}=${value}`,
            newurl = currentUrl + newparam;

        window.history.pushState({ path: newurl }, '', newurl);
    }

    function loadLazyImages() {
        new Blazy({
            selector: 'img:not(.no-lazy)', // all images
            loadInvisible: true,
            offset: 1000,
            breakpoints: [{
                width: 767, // max-width
                src: 'data-src-small'
            },
            {
                width: 991, // max-width
                src: 'data-src-medium'
            }
            ],
            error: function (ele, msg) {
                console.log('lazy load image error: ', ele.src, ': ', msg)
            },
            success: function (ele) {
                //console.log('success: ', ele);
            }
        });
    }

    //events - a super-basic Javascript (publish subscribe) pattern
    const events = (function () {
        const events = {};

        function on(eventName, fn) {
            events[eventName] = events[eventName] || [];
            events[eventName].push(fn);
        }

        function off(eventName, fn) {
            if (events[eventName]) {
                for (let i = 0; i < events[eventName].length; i++) {
                    if (events[eventName][i] === fn) {
                        events[eventName].splice(i, 1);
                        break;
                    }
                }
            }
        }

        function emit(eventName, data) {
            let count = 0;
            const timer = setInterval(() => {
                count++;
                if (count >= 50) { //20 * 200 = 10 seconds
                    clearInterval(timer);
                }

                if (events[eventName]) {
                    clearInterval(timer);
                    Array.prototype.slice.call(events[eventName]).forEach(function (fn) {
                        fn(data);
                    });
                }
            }, 200);

            // if (events[eventName]) {
            //     Array.prototype.slice.call(events[eventName]).forEach(function (fn) {
            //         fn(data);
            //     });
            // }
        }

        return {
            on: on,
            off: off,
            emit: emit
        };
    })();

    function removeClassOfSelector(selector, className) {
        const elements = _qAll(selector);
        for (let elem of elements) {
            elem.classList.remove(className);
        }
    }

    function removeStyleOfSelector(selector, style) {
        const elements = _qAll(selector);
        for (let elem of elements) {
            elem.style[style] = null;
        }
    }

    function isDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    function convertHref() {
        const links = _qAll('a');
        for (let link of links) {
            if (link.classList.contains('no-tracking') || link.href.indexOf('tel:') > -1 || link.href.indexOf('mailto:') > -1) {
                continue;
            }
            let href = link.getAttribute('href');
            let hrefParams = '';
            if (!!href && href.indexOf('?') > -1) {
                hrefParams = href.split('?')[1];
            }
            if (!!window.siteSetting && !!window.siteSetting.redirectURL && window.siteSetting.redirectURL.trim() !== '') {
                if (href && href.indexOf('contact-us') < 0 && href.indexOf('terms') < 0 && href.indexOf('policy') < 0 && href.indexOf('affiliate') < 0 && href.indexOf('usermanual') < 0 && href.indexOf('impressum.html') < 0 && href.indexOf('javascript') < 0 && href.indexOf('www') < 0 && href.indexOf('//') < 0 && link.className.indexOf('no-redirect') < 0) {
                    href = window.siteSetting.redirectURL;
                }
            }
            if (href && href.trim() !== '' && href.indexOf('javascript') < 0) {
                const currentQueryString = location.search.length > 0 ? location.search.substr(1) : '';
                if (href.indexOf('?') > 0) {
                    href += (currentQueryString !== '' ? '&' + currentQueryString : '');
                } else {
                    href += (currentQueryString !== '' ? '?' + currentQueryString : '');
                }
                if (!!window.siteSetting && !!window.siteSetting.redirectURL && window.siteSetting.redirectURL.trim() !== '') {
                    if (href && href.indexOf('contact-us') < 0 && href.indexOf('terms') < 0 && href.indexOf('policy') < 0 && href.indexOf('affiliate') < 0 && href.indexOf('usermanual') < 0 && href.indexOf('javascript') < 0 && href.indexOf('www') < 0 && href.indexOf('//') < 0 && link.className.indexOf('no-redirect') < 0) {
                        if (href.indexOf('?') > 0) {
                            href += (hrefParams !== '' ? '&' + hrefParams : '');
                        } else {
                            href += (hrefParams !== '' ? '?' + hrefParams : '');
                        }
                    }
                }
                link.href = href;
            }
        }
    }

    function showAjaxLoading() {
        const preloadingElem = _q('.preloading-wrapper');
        const preloadingNumber = utils.getQueryParameter('preloading') ? utils.getQueryParameter('preloading') : 1;
        const preloading = document.getElementById('preloading' + preloadingNumber);
        if (preloading) {
            preloading.style.display = 'block';
            preloading.style.opacity = '1';
        } else if (preloadingElem) {
            preloadingElem.style.display = 'block';
            preloadingElem.style.opacity = '1';
        }
    }

    //Format Date
    function formatDate(formatString, splitSymbol) {
        var date = (new Date()).toISOString().split('T')[0];
        var result = '',
            arrDate = date.split('-')
        var splitSymbol = splitSymbol ? splitSymbol : '-';

        switch (formatString) {
            case 'dd/mm/yyyy':
                result = arrDate[2] + splitSymbol + arrDate[1] + splitSymbol + arrDate[0];
                break;
            case 'mm/dd/yyyy':
                result = arrDate[1] + splitSymbol + arrDate[2] + splitSymbol + arrDate[0];
                break;
            default:
                result = date;
        }

        return result;
    }

    function fireCakePixel() {
        const orderInfo = JSON.parse(utils.localStorage().get('orderInfo'));
        const pixelUrl = 'https://#DOMAIN/p.ashx?o=#S4&e=#EVENT&t=TRANSACTION_ID&r=#S5';

        try {
            let isCakePixelFired = false;
            if (utils.localStorage().get('isCakePixelFired')) {
                isCakePixelFired = true;
            }

            //hot fix : set domain to blvedr.com because the domain tqlsnrs.com is died
            let domain = utils.getQueryParameter('domain');
            if (domain === 'tqlsnrs.com' && utils.getQueryParameter('direct') && utils.getQueryParameter('direct').toLowerCase() === 'y') {
                domain = 'blvedr.com';
            }

            if (orderInfo && orderInfo.orderNumber && !isCakePixelFired && domain) {
                let url = pixelUrl.replace('TRANSACTION_ID', orderInfo.orderNumber);
                const s4 = utils.getQueryParameter('s4') || '';
                const s5 = utils.getQueryParameter('s5') || '';
                const event = utils.getQueryParameter('event') || '';
                url = url.replace('#S4', s4);
                url = url.replace('#S5', s5);
                url = url.replace('#EVENT', event);
                url = url.replace('#DOMAIN', domain);

                const iframe = document.createElement('iframe');
                iframe.src = url;
                iframe.id = 'pixelmator';
                iframe.setAttribute('frameborder', 0);
                iframe.setAttribute('scrolling', 'no');
                iframe.style = 'width: 1px; height: 1px';
                document.body.appendChild(iframe);

                utils.localStorage().set('isCakePixelFired', true);
            }
        } catch (err) {
            console.log('error: ', err);
        }
    }

    function fireEverFlow() {
        const orderInfo = JSON.parse(utils.localStorage().get('orderInfo'));
        const everFlowUrl = 'https://#DOMAIN/?nid=#NETWORK_ID&oid=#OFFER_ID&transaction_id=#TRANSACTION_ID&adv1=#ADV1&coupon_code=#CC&sub1=#S1&sub2=#S2&sub3=#S3&sub4=#S4&sub5=#S5&source_id=#SOURCE_ID';
        try {
            let isEverFlowFired = false;
            if (utils.localStorage().get('isEverFlowFired')) {
                isEverFlowFired = true;
            }

            let domain = utils.getQueryParameter('domain1');

            if (orderInfo && orderInfo.orderNumber && !isEverFlowFired && domain) {
                const offer_id = utils.getQueryParameter('S4') || '';
                const transaction_id = utils.getQueryParameter('S5') || '';
                const network_id = utils.getQueryParameter('NETWORK_ID') || '';
                const coupon_code = utils.getQueryParameter('CC') || '';
                const sub1 = utils.getQueryParameter('S1') || '';
                const sub2 = utils.getQueryParameter('S2') || '';
                const sub3 = utils.getQueryParameter('S3') || '';
                const sub4 = utils.getQueryParameter('S4') || '';
                const sub5 = utils.getQueryParameter('S5') || '';
				const source_id = utils.getQueryParameter('source_id') || '';

                let url = everFlowUrl.replace('#ADV1', orderInfo.orderNumber);
                url = url.replace('#NETWORK_ID', network_id);
                url = url.replace('#OFFER_ID', offer_id);
                url = url.replace('#TRANSACTION_ID', transaction_id);
                url = url.replace('#DOMAIN', domain);
                url = url.replace('#CC', coupon_code);
                url = url.replace('#S1', sub1);
                url = url.replace('#S2', sub2);
                url = url.replace('#S3', sub3);
                url = url.replace('#S4', sub4);
                url = url.replace('#S5', sub5);
				url = url.replace('#SOURCE_ID', source_id);

                const iframe = document.createElement('iframe');
                iframe.src = url;
                iframe.id = 'everflow';
                iframe.setAttribute('frameborder', 0);
                iframe.setAttribute('scrolling', 'no');
                iframe.style = 'width: 1px; height: 1px';
                document.body.appendChild(iframe);

                utils.localStorage().set('isEverFlowFired', true);
            }
        } catch (err) {
            console.log('error: ', err);
        }
    }

    function firePicksell() {
        //Fire picksell
        if (typeof $picksell !== 'undefined') {
            let isPicksellFired = utils.localStorage().get('isPicksellFired');
            if (!isPicksellFired) {
                const orderInfo = JSON.parse(utils.localStorage().get('orderInfo'));
                if (orderInfo && orderInfo.orderTotalFull) {
                    $picksell.trackingConversion(orderInfo.orderTotalFull);
                    utils.localStorage().set('isPicksellFired', true);
                }
            }
        }
    }

    function trackConversionWithFP() {
        try {
            if (utils.localStorage().get('isCrmConversionTracked')) {
                return;
            }

            const orderInfo = JSON.parse(utils.localStorage().get('orderInfo'));
            const currencyCode = utils.localStorage().get('currencyCode');
            const ip = utils.localStorage().get('ip');
            const mainCampaignName = utils.localStorage().get('mainCampaignName');
            const mainWebKey = utils.localStorage().get('mainWebKey');
            const user_firstname = utils.localStorage().get('user_firstname');
            const user_lastname = utils.localStorage().get('user_lastname');
            const customerId = utils.localStorage().get('customerId');

            const timer = setInterval(() => {
                if (window._EA_ID && window._EA_PUSH) {
                    if (orderInfo && typeof window._EA_PUSH === "function") {
                        const mainProd = orderInfo.orderedProducts.filter(prod => { return prod.type === 'main' });
                        if (!mainProd || mainProd.length < 1) return;

                        _EA_PUSH('CONVERSION', [{
                            "orderNumber": orderInfo.orderNumber,
                            "currencyCode": currencyCode ? currencyCode : "",
                            "orderPrice": parseFloat(orderInfo.orderTotalFull).toFixed(2),
                            "ip": ip ? ip : "",
                            "productId": mainProd[0].pid,
                            //"productName": mainProd[0].name,
                            "sku": mainProd[0].sku,
                            "campaignName": mainCampaignName ? mainCampaignName : "",
                            "campaignWebKey": mainWebKey ? mainWebKey : "",
                            "customeremail": orderInfo.cusEmail,
                            "customerphone": orderInfo.cusPhone || "",
                            "customerId": customerId ? customerId : "",
                            "firstName": user_firstname ? user_firstname : "",
                            "lastName": user_lastname ? user_lastname : ""
                        }]);

                        console.log('isCrmConversionTracked');
                        utils.localStorage().set('isCrmConversionTracked', true);
                    }

                    clearInterval(timer);
                }
            }, 1000);
        } catch (err) {
            console.log("trackConversionWithFP error: ", err);
        }
    }

    function _updateThrottled(throttled, siteDomain) {
        try {
            const affParam = utils.getQueryParameter('Affid');
            utils.callAjax('https://yz3or1urua.execute-api.us-east-1.amazonaws.com/prod/updateThrottled', {
                method: 'POST',
                data: {
                    affId: affParam,
                    siteDomain: siteDomain,
                    throttled: parseInt(throttled) + 1
                }
            }).then(result => {
                console.log('updated sc successfully!');
            }).catch(err => {
                _fireTracking();
            });
        } catch (err) {
            _fireTracking();
        }
    }

    function checkAffAndFireEvents() {
        try {
            console.log('checkAffAndFireEvents V2');
            const affParam = utils.getQueryParameter('Affid');
            const orderInfo = JSON.parse(utils.localStorage().get('orderInfo'));
            const checkedAff = utils.localStorage().get('checkedAff');
            const mainOrderLink = utils.localStorage().get('mainOrderLink');
            if (!checkedAff) {
                if (affParam && orderInfo && mainOrderLink && mainOrderLink !== '') {
                    const siteDomain = location.host.replace(/(www|test)\./, '') + mainOrderLink;
                    const countryCode = window.localStorage.getItem('countryCode') ? window.localStorage.getItem('countryCode') : '';
                    utils.callAjax('https://yz3or1urua.execute-api.us-east-1.amazonaws.com/prod/so', {
                        method: 'POST',
                        data: {
                            affId: affParam,
                            siteDomain: siteDomain,
                            countryCode: countryCode
                        }
                    }).then(result => {
                        if (result && result.status) {
                            utils.localStorage().set('checkedAff', 'true');

                            const aff = result.data;
                            const shouldThrottled = (aff.percent / 100) * (aff.totalOrders);
                            if ((shouldThrottled - aff.throttled) >= 1) {
                                //no fire and update throttled
                                _updateThrottled(aff.throttled, siteDomain);
                            } else {
                                _fireTracking();
                            }
                        } else {
                            _fireTracking();
                        }
                    }).catch(err => {
                        console.log(err);
                        _fireTracking();
                    });
                } else {
                    _fireTracking();
                }
            }

            // if (affParam && orderInfo && !checkedAff && mainOrderLink && mainOrderLink !== '') {
            //     const siteDomain = location.host.replace(/(www|test)\./, '') + mainOrderLink;
            //     const countryCode = window.localStorage.getItem('countryCode') ? window.localStorage.getItem('countryCode') : '';
            //     utils.callAjax('https://yz3or1urua.execute-api.us-east-1.amazonaws.com/prod/so', {
            //         method: 'POST',
            //         data: {
            //             affId: affParam,
            //             siteDomain: siteDomain,
            //             countryCode: countryCode
            //         }
            //     }).then(result => {
            //         if (result && result.status) {
            //             utils.localStorage().set('checkedAff', 'true');

            //             const aff = result.data;
            //             const shouldThrottled = (aff.percent / 100) * (aff.totalOrders);
            //             if ((shouldThrottled - aff.throttled) >= 1) {
            //                 //no fire and update throttled
            //                 _updateThrottled(aff.throttled, siteDomain);
            //             } else {
            //                 _fireTracking();
            //             }
            //         } else {
            //             _fireTracking();
            //         }
            //     }).catch(err => {
            //         console.log(err);
            //         _fireTracking();
            //     });
            // } else {
            //     _fireTracking();
            // }
        } catch (err) {
            console.log(err);
            _fireTracking();
        }

        // utils.fireEverFlow();
        // utils.firePicksell();
    }

    function _fireTracking() {
        //Fire Pixels
        //utils.fireCakePixel();
        const ersParam = utils.getQueryParameter('ERS');
        if (!ersParam || ersParam.toLowerCase() !== 'y') {
            utils.fireEverFlow();
        } else {
            console.log('not fire EF');
        }
        //utils.firePicksell();
        utils.fireMainOrderToGTMConversion();
        utils.trackConversionWithFP();
        utils.fireCTRwowTrackingConversion();
    }

    //check and fire gtm convertion event for order pages
    function fireMainOrderToGTMConversion() {
        try {
            const orderInfo = JSON.parse(utils.localStorage().get('orderInfo'));
            let isMainOrderToGTMConversionFired = false;
            if (utils.localStorage().get('isMainOrderToGTMConversionFired')) {
                isMainOrderToGTMConversionFired = true;
            }

            if (orderInfo && orderInfo.orderNumber && !isMainOrderToGTMConversionFired) {
                window.dataLayer = window.dataLayer || [];
                let counter = 1;
                const timer = setInterval(() => {
                    if (counter > 10) {
                        window.dataLayer.push({
                            'event': 'Conversion',
                            'orderId': orderInfo.orderNumber,
                            //'price': orderInfo.orderTotal,
                            'price': orderInfo.orderTotalFull ? orderInfo.orderTotalFull : '',
                            "customeremail": sha256(orderInfo.cusEmailPP || orderInfo.cusEmail), // DFSB-6160
                            "customerphone": !!orderInfo.cusPhone ? sha256(`${Number(orderInfo.cusPhone.match(/\d/g).join(""))}`) : "",
                            "customerFirstName": !!orderInfo.cusFirstName ? sha256(orderInfo.cusFirstName) : "",
                            "customerLastName": !!orderInfo.cusLastName ? sha256(orderInfo.cusLastName) : "",
                            "customerCity": !!orderInfo.cusCity ? sha256(orderInfo.cusCity) : "",
                            "customerState": !!orderInfo.cusState ? sha256(orderInfo.cusState) : "",
                            "customerCountry": !!orderInfo.cusCountry ? sha256(orderInfo.cusCountry) : "",
                            "customerZip": !!orderInfo.cusZip ? sha256(orderInfo.cusZip) : ""
                        });
                        clearInterval(timer);
                    }

                    if (window._EA_ID) {
                        window.dataLayer.push({
                            'event': 'Conversion',
                            'fpid': window._EA_ID,
                            'orderId': orderInfo.orderNumber,
                            'price': orderInfo.orderTotalFull ? orderInfo.orderTotalFull : '',
                            "customeremail": sha256(orderInfo.cusEmailPP || orderInfo.cusEmail),
                            "customerphone": !!orderInfo.cusPhone ? sha256(`${Number(orderInfo.cusPhone.match(/\d/g).join(""))}`) : "",
                            "customerFirstName": !!orderInfo.cusFirstName ? sha256(orderInfo.cusFirstName) : "",
                            "customerLastName": !!orderInfo.cusLastName ? sha256(orderInfo.cusLastName) : "",
                            "customerCity": !!orderInfo.cusCity ? sha256(orderInfo.cusCity) : "",
                            "customerState": !!orderInfo.cusState ? sha256(orderInfo.cusState) : "",
                            "customerCountry": !!orderInfo.cusCountry ? sha256(orderInfo.cusCountry) : "",
                            "customerZip": !!orderInfo.cusZip ? sha256(orderInfo.cusZip) : ""
                        });
                        clearInterval(timer);
                    }

                    counter++;
                }, 200);

                utils.localStorage().set('isMainOrderToGTMConversionFired', true);
                console.log('fireMainOrderToGTMConversion fire event Conversion');
            }
        } catch (err) {
            console.log('error: ', err);
        }
    }

    //check and fire gtm convertion event for order pages
    function fireMainOrderToGTMConversionV2() {
        try {
            const orderInfo = JSON.parse(utils.localStorage().get('orderInfo'));
            if (orderInfo && orderInfo.orderNumber) {
                window.dataLayer = window.dataLayer || [];
                let counter = 1;
                const timer = setInterval(() => {
                    if (counter > 10) {
                        window.dataLayer.push({
                            'event': 'Conversion',
                            'orderId': orderInfo.orderNumber,
                            'price': orderInfo.orderTotal
                        });
                        clearInterval(timer);
                    }

                    if (window._EA_ID) {
                        window.dataLayer.push({
                            'event': 'Conversion',
                            'fpid': window._EA_ID,
                            'orderId': orderInfo.orderNumber,
                            'price': orderInfo.orderTotalFull ? orderInfo.orderTotalFull : ''
                        });
                        clearInterval(timer);
                    }

                    counter++;
                }, 200);

                console.log('fireMainOrderToGTMConversionV2 fire event Conversion');
            }
        } catch (err) {
            console.log('error: ', err);
        }
    }

    //check and fire gtm purchase event for upsell
    function fireGtmPurchaseEvent() {
        try {
            const fireUpsellForGTMPurchase = utils.localStorage().get('fireUpsellForGTMPurchase');
            if (fireUpsellForGTMPurchase && fireUpsellForGTMPurchase !== '') {
                window.dataLayer = window.dataLayer || [];
                let counter = 1;
                const timer = setInterval(() => {
                    if (counter > 10) {
                        window.dataLayer.push({ 'event': `Upsell "${fireUpsellForGTMPurchase}"` });
                        clearInterval(timer);
                    }

                    if (window._EA_ID) {
                        window.dataLayer.push({ 'event': `Upsell "${fireUpsellForGTMPurchase}"`, 'fpid': window._EA_ID });
                        clearInterval(timer);
                    }

                    counter++;
                }, 200);

                utils.localStorage().remove('fireUpsellForGTMPurchase');
                console.log('fireUpsellForGTMPurchase fire with event: Upsell ', fireUpsellForGTMPurchase);
            }
        } catch (err) {
            console.log(err);
        }
    }

    //CTRwow FP tracking pixel
    function ctrwowTrackingFPPixel() {
        window.__CTR_FP_TRACKING_SETTINGS = { MODE: "prod" };

        const script = document.createElement('script');
        //script.src = 'https://ctrwow-commonstorage.azureedge.net/common/js/CTR_FP_TRACKING-v1.0.1.min.js';
        script.src = 'https://ctrwow-commonstorage.azureedge.net/common/js/CTR_FP_TRACKING-v2.0.0.min.js';
        script.defer = true;
        document.body.appendChild(script);
    }

    function fireCTRwowTrackingConversion() {
        let count = 0;
        const timer = setInterval(() => {
            if (window.__CTR_FP_TRACKING) {
                try {
                    const orderInfo = JSON.parse(utils.localStorage().get('orderInfo'));
                    let isMainOrderToCTRwowConversionFired = false;
                    if (utils.localStorage().get('isMainOrderToCTRwowConversionFired')) {
                        isMainOrderToCTRwowConversionFired = true;
                    }

                    if (orderInfo && orderInfo.orderNumber && !isMainOrderToCTRwowConversionFired) {
                        const totalAmount = orderInfo.orderTotalFull ? orderInfo.orderTotalFull : 0;
                        window.__CTR_FP_TRACKING.trackExConversion(totalAmount);

                        utils.localStorage().set('isMainOrderToCTRwowConversionFired', true);
                        console.log('isMainOrderToCTRwowConversionFired fire Conversion event');
                    }
                } catch (err) {
                    console.log(err);
                }

                clearInterval(timer);
            } else {
                count++;
                if (count > 10) {
                    clearInterval(timer);
                }
            }
        }, 200);
    }

    function createCookie(name, value, days) {
        var expires = '';
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + value + expires + '; path=/';
    }

    function readCookie(name) {
        var nameEQ = name + '=',
            ca = document.cookie.split(';');

        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
        return null;
    }

    function eraseCookie(name) {
        createCookie(name, '', -1);
    }

    function checkCamp(webKey) {
        let isExisted = true;
        let campProducts = utils.localStorage().get('campproducts');
        if (campProducts) {
            try {
                campProducts = JSON.parse(campProducts);
                const camps = campProducts.camps.filter(item => {
                    return item[webKey];
                });

                if (camps.length > 0) {
                    const beforeDate = new Date(camps[0][webKey].timestamp);
                    const newDate = new Date();
                    const res = Math.abs(newDate - beforeDate) / 1000;
                    const minutes = Math.floor(res / 60);
                    //console.log('check time of keeping prices in local storage: ', minutes);
                    if (minutes > 20) isExisted = false;
                } else {
                    isExisted = false;
                }
            } catch (err) {
                console.log(err);
                isExisted = false;
            }
        } else {
            isExisted = false;
        }
        return isExisted;
    }

    //save informations to local storage for upsells
    function saveInfoToLocalForUpsells(responseData, upsell) {
        let _getUpParam = () => {
            let upParam = '';
            if (location.href.split('special-offer-', 2).length > 1) {
                upParam = 'up_' + location.href.split('special-offer-', 2)[1].split('.html', 1);
            }
            return upParam;
        };

        let _handleLastUpsellOrError = () => {
            let upParam = '';
            if (location.href.split('special-offer-', 2).length > 1) {
                upParam = '?up_' + location.href.split('special-offer-', 2)[1].split('.html', 1);

                if (upsell.orderInfo.isUpsellOrdered == 1) {
                    upParam += '=1';
                } else {
                    upParam += '=0';
                }
            }

            let redirectUrl = siteSetting.successUrl;
            utils.redirectPage(redirectUrl + upParam);
        };

        if (responseData != null && responseData.success) {
            //store param in localStorage to fire gtm event of purchase
            //const upsellCampaignName = typeof upsell.upsellCampaignName !== 'undefined' ? upsell.upsellCampaignName : _getUpParam();
            utils.localStorage().set('fireUpsellForGTMPurchase', _getUpParam());
            //utils.localStorage().set('paypal_isMainOrder', 'upsell');
            utils.localStorage().set('isMainOrder', 'upsell');
            utils.localStorage().set('upsellOrderNumber', responseData.orderNumber);

            upsell.orderInfo.upsellIndex += 1;
            const savedOfUpsell = upsell.products[window.upsell_productindex].productPrices.FullRetailPrice.Value - upsell.products[window.upsell_productindex].productPrices.DiscountedPrice.Value;
            upsell.orderInfo.upsellPriceToUpgrade = upsell.products[window.upsell_productindex].productPrices.DiscountedPrice.Value;
            upsell.orderInfo.savedTotal += savedOfUpsell;
            upsell.orderInfo.isUpsellOrdered = 1;
            const { upsellUrls = [] } = upsell.orderInfo;
            upsellUrls.push({
                index: upsell.orderInfo.upsellIndex,
                orderNumber: responseData.orderNumber,
                url: location.pathname,
                price: upsell.products[window.upsell_productindex].productPrices.DiscountedPrice.Value
            });
            upsell.orderInfo.upsellUrls = upsellUrls;
            utils.localStorage().set('orderInfo', JSON.stringify(upsell.orderInfo));

            utils.localStorage().set('webkey_to_check_paypal', upsell.upsellWebKey);

            //success page will use this trackingNumber to call comfirm payment api
            if (responseData.trackingNumber) {
                utils.localStorage().set('trackingNumber', responseData.trackingNumber);
            }

            if (responseData.callBackUrl) {
                document.location = responseData.callBackUrl;
            } else if (responseData.paymentContinueResult && responseData.paymentContinueResult.actionUrl !== "") {
                document.location = responseData.paymentContinueResult.actionUrl;
            } else if (upsell.orderInfo.upsellIndex < upsell.orderInfo.upsells.length) {
                let upsellUrl = upsell.orderInfo.upsells[upsell.orderInfo.upsellIndex].upsellUrl;
                const redirectUrl = upsellUrl.substring(upsellUrl.lastIndexOf('/') + 1, upsellUrl.indexOf('?') >= 0 ? upsellUrl.indexOf('?') : upsellUrl.length);
                utils.redirectPage(redirectUrl + '?' + _getUpParam() + '=1');
            } else {
                _handleLastUpsellOrError();
            }
        } else {
            _handleLastUpsellOrError();
        }
    }

    //Filter first of Error field to excute event scrollIntoView - Animation will not work on IE browser
    function focusErrorInputField() {
        try {
            //get first error input
            let input = _qAll('.input-error')[0];

            if (!!input) {
                input.scrollIntoView({ behavior: "smooth", block: "center" });

                //set timer to detect Element in center view of screen then excute focus event for input
                let timerFocus = setInterval(function () {
                    if (input.getBoundingClientRect().bottom > 0 && (window.innerHeight / 2 + input.getBoundingClientRect().height / 2) < input.getBoundingClientRect().bottom) {
                        clearInterval(timerFocus);
                        input.focus();
                    }
                }, 100);
            }
        } catch (err) {
            console.log(err);
        }
    }

    function saveUserInfoWithFingerprint() {
        try {
            let firstName = _qById('customer_firstname') ? _qById('customer_firstname').value : _qById('shipping_firstname') ? _qById('shipping_firstname').value : '';
            let lastName = _qById('customer_lastname') ? _qById('customer_lastname').value : _qById('shipping_lastname') ? _qById('shipping_lastname').value : '';
            let phoneNumber = _qById('customer_phone') ? _qById('customer_phone').value : '';

            let emailElem = _qById('customer_email');
            if (window._EA_ID && firstName !== '' && lastName !== '' && emailElem && !emailElem.classList.contains('input-error')) {
                //const url = `https://ctrwow-dev-fingerprint-microservice.azurewebsites.net/api/userinfo/${window._EA_ID}?code=5twg5EUTiWQLF2LzvHYonk6PsRREMi7qjRlRGCQSNJqHCaxsYVlgsA==`; test env
                const url = `https://ctrwow-prod-fingerprint-microservice.azurewebsites.net/api/userinfo/${window._EA_ID}?code=hjQxSRcBk48Gii/2xmzwb2d08D1sazWO3qzOLwiRwndnSQ3w9zNITw==`; //prod env
                const options = {
                    method: 'POST',
                    data: {
                        'userInfo': {
                            'firstName': firstName,
                            'lastName': lastName,
                            'email': emailElem.value,
                            'phoneNumber': phoneNumber
                        }
                    }
                }

                utils.callAjax(url, options).then((result) => {
                    console.log(result);
                })
                    .catch(error => console.log(error));
            }
        } catch (err) {
            console.log('saveUserInfoWithFingerprint error: ', err);
        }
    }

    function bindTaxForUpsell(upsellInfo) {
        try {
            if (typeof window.applyTax === 'undefined') return;

            let countryCode = window.localStorage.getItem('countryCode');
            let stateCode = window.localStorage.getItem('stateCode');

            const userPaymentType = window.localStorage.getItem('userPaymentType');
            if (userPaymentType && userPaymentType === 'paypal') {
                let campProducts = window.localStorage.getItem('campproducts');
                const mainWebKey = window.localStorage.getItem('mainWebKey');
                if (campProducts && mainWebKey) {
                    campProducts = JSON.parse(campProducts);
                    const camp = campProducts.camps.filter(camp => {
                        return camp[mainWebKey];
                    });

                    if (camp && camp.length > 0) {
                        countryCode = camp[0][mainWebKey].location.countryCode;
                        stateCode = camp[0][mainWebKey].location.regionCode;
                    }
                }
            }

            if (!countryCode || !stateCode) {
                const spanUpsellPriceElems = _qAll('.spanUpsellPrice');
                for (let spanUpsellPrice of spanUpsellPriceElems) {
                    spanUpsellPrice.innerHTML = upsellInfo.products[0].productPrices.DiscountedPrice.FormattedValue;
                }
                return;
            }

            const url = `https://websales-api.tryemanagecrm.com/api/campaigns/${upsellInfo.upsellWebKey}/taxes/${countryCode}/${stateCode}`;
            const options = {
                headers: {
                    X_CID: siteSetting.CID
                }
            }

            utils.callAjax(url, options).then(result => {
                window.productsTaxes = result.productsTaxes;

                const upsellIndex = window.upsell_productindex ? window.upsell_productindex : 0;
                const productId = upsellInfo.products[upsellIndex].productId;
                const taxProduct = result.productsTaxes.filter(p => p.productId == productId)[0];
                if (taxProduct) {
                    const priceWithTax = parseFloat(upsellInfo.products[upsellIndex].productPrices.DiscountedPrice.Value) + parseFloat(taxProduct.tax.taxValue);
                    const spanUpsellPriceElems = _qAll('.spanUpsellPrice');
                    for (let spanUpsellPrice of spanUpsellPriceElems) {
                        spanUpsellPrice.innerHTML = '$' + priceWithTax.toFixed(2);
                    }
                }
                console.log(result);
            }).catch(error => {
                console.log('call tax error : ', error);
            });
        } catch (err) {
            console.log('bind tax error : ', err);
        }
    }

    //Common Upsell classs is used in all sites
    class CommonUpsell {
        fireGtmPurchaseEvent() {
            utils.fireGtmPurchaseEvent();
        }

        init() {
            this.fireGtmPurchaseEvent();
            utils.ctrwowTrackingFPPixel();
        }
    }

    //Common Order classs is used in all sites
    class CommonOrder {
        //Save gtmId to localStorage to use in confirm page for multiple flow order
        saveGtmId() {
            const gtmId = document.getElementById('gtmId');
            if (gtmId) {
                window.localStorage.setItem('orderGtmId', gtmId.value);
            }
        }

        init() {
            this.saveGtmId();
            utils.ctrwowTrackingFPPixel();
        }
    }

    //Common Confirm classs is used in all sites
    class CommonConfirm {
        fireGtmPurchaseEvent() {
            utils.fireGtmPurchaseEvent();
        }

        init() {
            this.fireGtmPurchaseEvent();
            utils.ctrwowTrackingFPPixel();
        }
    }

    //Custom Events inject to CTA Button - Tu Nguyen
    class injectCustomEventsToCTABtn {
        preventCheckout(paypentType = true, cbFnc) {
            //Paypemt Type
            //-- 'paypal' : prevent checkout only with paypal
            //-- 'cc' : prevent checkout only with creditcard
            //-- true : prevent checkout with both of paypal and creditcard
            //cbFnc
            //-- Excute callback function
            switch (paypentType) {
                case 'paypal':
                    window.preventCheckoutPaypal = true;
                    break;
                case 'cc':
                    window.preventCheckoutCredit = true;
                    break;
                case 'ideal':
                    window.preventCheckoutIdeal = true;
                    break;
                case 'redirectCheckout':
                    window.preventCheckoutRedirect = true;
                    break;
                default:
                    window.preventCheckout = true;
            }
            if (typeof cbFnc === 'function') {
                cbFnc();
            }
        }

        //Enable Checkout normally
        disablePreventCheckout(paypentType = true, cbFnc) {
            switch (paypentType) {
                case 'paypal':
                    window.preventCheckoutPaypal = false;
                    break;
                case 'cc':
                    window.preventCheckoutCredit = false;
                    break;
                default:
                    window.preventCheckoutPaypal = false;
                    window.preventCheckoutCredit = false;
                    window.preventCheckout = false;
            }
            if (typeof cbFnc === 'function') {
                cbFnc();
            }
        }

        emitEventAfterCheckout(paypentType = true, registerFnc, stopRedirect = false) {
            //@paypentType
            //-- 'paypal' : emit events only with paypal successfully
            //-- 'cc' : emit events only with credit card successfully
            //-- true : emit events with both of paypal  and creditcard successfully
            //@stopRedirect
            //-- if @true, enable variable window.stopRedirect & prevent page are moving on next Url
            //@registerFnc
            //-- register Event to emitted after checkout success page.

            switch (paypentType) {
                case 'paypal':
                    window.emitAfterSuccessPaypal = true;
                    //Register Events
                    if (typeof registerFnc === 'function') {
                        utils.events.on('fireAfterSuccessPP', function (data) {
                            registerFnc(data);
                        });
                    }
                    break;
                case 'cc':
                    window.emitAfterSuccessCredit = true;

                    if (!!stopRedirect) window.stopRedirect = true;

                    if (typeof registerFnc === 'function') {
                        utils.events.on('fireAfterSuccessCC', function (data) {
                            registerFnc(data);
                        });
                    }
                    break;
                case 'redirectCheckout':
                    window.emitAfterSuccessRedirectCheckout = true;
                    //Register Events
                    if (typeof registerFnc === 'function') {
                        utils.events.on('fireAfterSuccessRedirectCheckout', function (data) {
                            registerFnc(data);
                        });
                    }
                    break;
                default:
                    window.emitAfterSuccess = true;

                    if (typeof registerFnc === 'function') {
                        utils.events.on('fireAfterSuccess', function (data) {
                            registerFnc(data);
                        });
                    }
            }
        }
    }

    global.utils = {
        CommonUpsell: CommonUpsell,
        CommonOrder: CommonOrder,
        CommonConfirm: CommonConfirm,
        callAjax: callAjax,
        getCurrencySymbol: getCurrencySymbol,
        formatPrice: formatPrice,
        isEmail: isEmail,
        validatePhoneBr: validatePhoneBr,
        maskNumber: maskNumber,
        validateInput: validateInput,
        validateCheckbox: validateCheckbox,
        validForm: validForm,
        addInputError: addInputError,
        removeInputError: removeInputError,
        resetForm: resetForm,
        localStorage: localStorage,
        redirectPage: redirectPage,
        removeParamFromUrl: removeParamFromUrl,
        getQueryParameter: getQueryParameter,
        loadLazyImages: loadLazyImages,
        events: events,
        removeClassOfSelector: removeClassOfSelector,
        removeStyleOfSelector: removeStyleOfSelector,
        convertHref: convertHref,
        isDevice: isDevice,
        showAjaxLoading: showAjaxLoading,
        formatDate: formatDate,
        fireCakePixel: fireCakePixel,
        fireEverFlow: fireEverFlow,
        firePicksell: firePicksell,
        trackConversionWithFP: trackConversionWithFP,
        checkAffAndFireEvents: checkAffAndFireEvents,
        fireMainOrderToGTMConversion: fireMainOrderToGTMConversion,
        fireMainOrderToGTMConversionV2: fireMainOrderToGTMConversionV2,
        fireGtmPurchaseEvent: fireGtmPurchaseEvent,
        createCookie: createCookie,
        readCookie: readCookie,
        eraseCookie: eraseCookie,
        checkCamp: checkCamp,
        saveInfoToLocalForUpsells: saveInfoToLocalForUpsells,
        focusErrorInputField: focusErrorInputField,
        saveUserInfoWithFingerprint: saveUserInfoWithFingerprint,
        bindTaxForUpsell: bindTaxForUpsell,
        injectCustomEventsToCTABtn: injectCustomEventsToCTABtn,
        ctrwowTrackingFPPixel: ctrwowTrackingFPPixel,
        addParamIntoUrl: addParamIntoUrl,
        fireCTRwowTrackingConversion: fireCTRwowTrackingConversion
    }
})(window, document);
