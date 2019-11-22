((utils) => {
    if(!utils) {
        return;
    }

    function handleShowBanner(elm) {
        // Countdown time
        var timer = setInterval(function() {
            let currentDate = new Date(),
                endDate = new Date(elm.dataset.enddate),
                beginDate = new Date(elm.dataset.begindate);

            endDate.setDate(endDate.getDate() + 1);
            beginDate.setHours(0, 0, 0, 0);
            currentDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);

            if(beginDate <= currentDate && currentDate < endDate) {
                if(elm.style.display === 'none') {
                    elm.style.display = 'block';
                }
                if(!_q('html').classList.contains('show-holiday-banner')) {
                    _q('html').classList.add('show-holiday-banner');
                }
            }
            else if(elm.style.display === 'block') {
                elm.style.display = 'none';
                if(!!timer) {
                    clearInterval(timer);
                }
                if(!!_q('html').classList.contains('show-holiday-banner')) {
                    _q('html').classList.remove('show-holiday-banner');
                }
            }

            let date = new Date(),
                hour = date.getHours(),
                minutes = date.getMinutes(),
                seconds = date.getSeconds(),
                currentTimeMs = (hour * 60 * 60 * 1000) + (minutes * 60 * 1000) + (seconds * 1000),
                countdown = 24 * 60 * 60 * 1000 - currentTimeMs;

            let hours = Math.floor(countdown / (60 * 60 * 1000)),
                min = Math.floor((countdown - (hours * 60 * 60 * 1000)) / (60 * 1000)),
                sec = Math.floor((countdown - (min *60 * 1000) - (hours * 60 * 60 * 1000)) / 1000);

            elm.querySelector('.h_hours').innerText = hours < 10 ? '0' + hours : hours;
            elm.querySelector('.h_minutes').innerText = min < 10 ? '0' + min : min;
            elm.querySelector('.h_seconds').innerText = sec < 10 ? '0' + sec : sec;
        }, 1000);

        // Add event for Close button
        elm.querySelector('.h_close').addEventListener('click', function(e) {
            _q('html').classList.remove('show-holiday-banner');
            _getClosest(e.target, '.holiday-banner').style.display = 'none';
            if(!!timer) {
                clearInterval(timer);
            }
        });
    }

    function init() {
        const banners = _qAll('.holiday-banner');
        for(const banner of banners) {
            handleShowBanner(banner);
        }
    }

    document.addEventListener('load', function() {
        init();
    });
})(window.utils);
