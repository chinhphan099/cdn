import Utils from '../common/utils.js';

(function () {
    //check param and don't bind preloading if true
    if (Utils.getQueryParameter('loader') === '0' || Utils.getQueryParameter('loader') === '1') {
        document.querySelector('body').classList.remove('hidden');
        return;
    }

    function init() {
        document.getElementById('page-loading').style.display = 'block';
        document.querySelector('body').classList.remove('hidden');

        if (typeof window.performance === 'undefined' || typeof window.performance.timing === 'undefined') {
            document.addEventListener("DOMContentLoaded", function (event) {
                document.getElementsByTagName('body')[0].classList.add('loaded');
            });
            return;
        }

        let perfData = window.performance.timing, // The PerformanceTiming interface
            //estimatedTime = -(perfData.loadEventEnd - perfData.navigationStart), // Calculated Estimated Time of Page Load which returns negative value.
            estimatedTime = perfData.responseEnd - perfData.navigationStart, // Calculated Estimated Time of Page Load which returns negative value.
            time = parseInt((estimatedTime / 1000) % 60) * 100,//Converting EstimatedTime from miliseconds to seconds.                    
            start = 0,
            end = 100,
            durataion = time;
        function animateValue(start, end, duration) {
            var range = end - start,
                current = start,
                increment = end > start ? 1 : -1,
                stepTime = Math.abs(Math.floor(duration / range));
            //console.log('step time: ', stepTime);
            stepTime = 15; //stepTime < 10 ? 10 : stepTime;                     
            var timer = setInterval(function () {
                current += increment;
                if (current == end) {
                    document.getElementsByTagName('body')[0].classList.add('loaded');
                    setTimeout(function () {
                        document.querySelector('.preloading-wrapper').style.display = 'none';
                    }, 0);
                    clearInterval(timer);
                }
            }, stepTime);
        }

        animateValue(start, end, durataion);
    }

    init();
})();