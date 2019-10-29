((utils) => {
    if(!utils) {
        return;
    }

    function getEndDate(elm) {
        let timeValid = elm.dataset.nightowls.split('-'),
            timeStart = Number(timeValid[0]),
            timeEnd = Number(timeValid[1]),
            currentDate = new Date(),
            beginDate = new Date(),
            endDate = new Date(),
            midNight = new Date();

        beginDate.setHours(timeStart, 0, 0, 0);
        endDate.setHours(timeEnd, 0, 0, 0);
        midNight.setHours(0, 0, 0, 0);

        if(timeStart > timeEnd) {
            if(beginDate <= currentDate) {
                endDate = new Date(endDate.setDate(endDate.getDate() + 1));
                return endDate;
            }
            if(currentDate <= endDate) {
                return endDate;
            }
        }
        else {
            if(beginDate <= currentDate && currentDate <= endDate) {
                return endDate;
            }
        }

        return false;
    }

    function adjustLayout(elm) {
        if(!!getEndDate(elm)) {
            _q('html').classList.add('hide-black-friday');
        }
    }

    function handleShowBanner(elm) {
        const endDate = getEndDate(elm);
        if(!!endDate) {
            _q('html').classList.add('show-nightowls');
            elm.style.display = 'block';

            if(!!_qById('couponBtn')) {
                console.log(123123);
                _qById('couponBtn').classList.remove('disabled');
                _qById('couponBtn').click();
            }

            // Apply coupon
            /*if(!_qById('couponCode') && !!window.couponCodeId) {
                let couponCodeElm = document.createElement('input');
                couponCodeElm.id = 'couponCode';
                couponCodeElm.type = 'hidden';
                _q('body').appendChild(couponCodeElm);
                _qById('couponCode').value = window.couponCodeId;
            }*/

            // Add event for Close button
            elm.querySelector('.nightowls_close').addEventListener('click', function() {
                _q('html').classList.remove('show-nightowls');
            });
        }
        else {
            return;
        }

        // Countdown time
        setInterval(function() {
            let date = new Date(),
                countdown = Math.abs(date - endDate);

            let hours = Math.floor(countdown / (60 * 60 * 1000)),
                min = Math.floor((countdown - (hours * 60 * 60 * 1000)) / (60 * 1000)),
                sec = Math.floor((countdown - (min *60 * 1000) - (hours * 60 * 60 * 1000)) / 1000);

            elm.querySelector('.nightowls_hour').innerText = hours < 10 ? '0' + hours : hours;
            elm.querySelector('.nightowls_minute').innerText = min < 10 ? '0' + min : min;
            elm.querySelector('.nightowls_second').innerText = sec < 10 ? '0' + sec : sec;
        }, 1000);
    }

    function implementPrices(data) {
        let currency = data.fCurrency;
        const couponElms = _qAll('.nightowls .coupon-value'),
            couponValue = utils.formatPrice(window.couponValue, currency, data.discountPrice);

        for(const couponElm of couponElms) {
            couponElm.querySelector('.js-img-loading').classList.add('hidden');
            couponElm.insertAdjacentText('beforeend', couponValue);
        }

        const nightowls = _qAll('[data-nightowls]');
        for(const nightowl of nightowls) {
            handleShowBanner(nightowl);
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        utils.events.on('bindOrderPage', implementPrices);
        const nightowls = _qAll('[data-nightowls]');
        for(const nightowl of nightowls) {
            adjustLayout(nightowl);
        }
    });
})(window.utils);
