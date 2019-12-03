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
            elm.style.display = 'block';
            _q('html').classList.add('show-holiday-banner');
        }

        // Add event for Close button
        elm.querySelector('.h_close').addEventListener('click', function(e) {
            _q('html').classList.remove('show-holiday-banner');
            _getClosest(e.target, '.holiday-banner').style.display = 'none';
        });
    }

    function init() {
        const banners = _qAll('.holiday-banner');
        for(const banner of banners) {
            handleShowBanner(banner);
        }
    }

    function adjustPosition(bottomValue) {
        const holidayBanners = _qAll('.holiday-banner');
        Array.prototype.slice.call(holidayBanners).forEach(holidaybanner => {
            const bottom = bottomValue + 'px';
            if(bottomValue === 0 && holidaybanner.classList.contains('has-floating-btn')) {
                holidaybanner.classList.remove('has-floating-btn');
            }
            else if(bottomValue !== 0 && !holidaybanner.classList.contains('has-floating-btn')) {
                holidaybanner.classList.add('has-floating-btn');
            }
            if(holidaybanner.style.bottom !== bottom) {
                holidaybanner.style.bottom = bottom;
            }
        });
    }

    function checkFloating() {
        if(!!_q('.floating-bar')) {
            if(!!_q('.floating-bar').classList.contains('floating-visible')) {
                adjustPosition(_q('.floating-bar').clientHeight);
            }
            else {
                adjustPosition(0);
            }
        }
    }

    window.addEventListener('load', function() {
        if(!!_q('body').classList.contains('edit_mode') || !!_q('body').classList.contains('editMode')) {
            return;
        }
        init();
        checkFloating();
    });
    window.addEventListener('scroll', function() {
        if(!!_q('body').classList.contains('edit_mode') || !!_q('body').classList.contains('editMode')) {
            return;
        }
        checkFloating();
    });
})(window.utils);
