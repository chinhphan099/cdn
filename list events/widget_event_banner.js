((utils) => {
    if(!utils) {
        return;
    }

    function handleShowBanner(elm) {
        let currentDate = new Date(),
            endDate = new Date(elm.dataset.enddate),
            beginDate = new Date(elm.dataset.begindate);

        endDate.setDate(endDate.getDate() + 1);
        beginDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        if(beginDate <= currentDate && currentDate < endDate) {
            _q('html').classList.add('black-friday');
            elm.style.display = 'block';

            // Add event for Close button
            elm.querySelector('.cm_close').addEventListener('click', function(e) {
                _q('html').classList.remove('black-friday');
                _getClosest(e.target, '.cm_banner').style.display = 'none';
            });
        }

        // Countdown time
        setInterval(function() {
            let date = new Date(),
                hour = date.getHours(),
                minutes = date.getMinutes(),
                seconds = date.getSeconds(),
                currentTimeMs = (hour * 60 * 60 * 1000) + (minutes * 60 * 1000) + (seconds * 1000),
                countdown = 24*60*60*1000 - currentTimeMs;

            let hours = Math.floor(countdown / (60 * 60 * 1000)),
                min = Math.floor((countdown - (hours * 60 * 60 * 1000)) / (60 * 1000)),
                sec = Math.floor((countdown - (min *60 * 1000) - (hours * 60 * 60 * 1000)) / 1000);

            elm.querySelector('.cm_inner .cm_hours').innerText = hours < 10 ? '0' + hours : hours;
            elm.querySelector('.cm_inner .cm_minutes').innerText = min < 10 ? '0' + min : min;
            elm.querySelector('.cm_inner .cm_seconds').innerText = sec < 10 ? '0' + sec : sec;
        }, 1000);
    }

    function init() {
        const banners = _qAll('.cm_banner');
        for(const banner of banners) {
            handleShowBanner(banner);
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        init();
    });
})(window.utils);
