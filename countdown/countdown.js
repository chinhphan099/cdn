// Callback after countdown is done: window.timeOver(); => To use: Just need define function window.timeOver
((utils) => {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    const timeHTML = `
            <div class="cd_item">
                <div class="ex_minute"></div>
                <div class="minute_text">${js_translate.minutes ? js_translate.minutes : 'MINUTES'}</div>
            </div>
            <div class="cd_item">
                <div class="semicolon">:</div>
            </div>
            <div class="cd_item">
                <div class="ex_second"></div>
                <div class="second_text">${js_translate.seconds ? js_translate.seconds : 'SECONDS'}</div>
            </div>
        `,
        hasHourHTML = `
                <div class="cd_item">
                    <div class="ex_hour"></div>
                    <div class="hour_text">${js_translate.hours ? js_translate.hours : 'HOURS'}</div>
                </div>
                <div class="cd_item">
                    <div class="semicolon">:</div>
                </div>
                ${timeHTML}
            `,
        hasDayHTML = `
                <div class="cd_item">
                    <div class="ex_day"></div>
                    <div class="day_text">${js_translate.days ? js_translate.days : 'DAYS'}</div>
                </div>
                <div class="cd_item">
                    <div class="semicolon">:</div>
                </div>
                ${hasHourHTML}
            `;

    function timeRemaining(endtime) {
        const t = Date.parse(endtime) - Date.parse(new Date()),
            seconds = Math.floor( (t/1000) % 60 ),
            minutes = Math.floor( (t/1000/60) % 60 ),
            hours = Math.floor( (t/(1000*60*60)) % 24 ),
            days = Math.floor( t/(1000*60*60*24) );

        return {
            'total': t,
            'days': days,
            'hours': hours,
            'minutes': minutes,
            'seconds': seconds
        };
    }

    function handleCountDown(elm, endtime) {
        let timeinterval;
        const dayElm = elm.querySelector('.ex_day'),
            hourElm = elm.querySelector('.ex_hour'),
            minuteElm = elm.querySelector('.ex_minute'),
            secondElm = elm.querySelector('.ex_second');

        function updateClock() {
            let t = timeRemaining(endtime);
            if(t.total <= 0) {
                clearInterval(timeinterval);
                utils.events.emit('onTimeOver');
            }
            minuteElm.innerHTML = t.minutes < 10 ? '0' + t.minutes : t.minutes;
            secondElm.innerHTML = t.seconds < 10 ? '0' + t.seconds : t.seconds;
            if(hourElm) {
                hourElm.innerHTML = t.hours < 10 ? '0' + t.hours : t.hours;
            }
            if(dayElm) {
                dayElm.innerHTML = t.days < 10 ? '0' + t.days : t.days;
            }
        }

        updateClock(); // Run on first time
        timeinterval = setInterval(updateClock, 1000);
    }

    function generateCountDown(elm, min, sec, hour, day) {
        let currentTime = Date.parse(new Date()),
            deadline = new Date(currentTime + min * 60 * 1000 + sec * 1000);

        elm.innerHTML = timeHTML;
        if(hour !== undefined) {
            elm.innerHTML = hasHourHTML;
            deadline = new Date(currentTime + hour * 60 * 60 * 1000 + min * 60 * 1000 + sec * 1000);
        }
        if(day !== undefined) {
            elm.innerHTML = hasDayHTML;
            deadline = new Date(currentTime + day * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000 + min * 60 * 1000 + sec * 1000);
        }

        handleCountDown(elm, deadline);
    }

    function initCountDown(elm) {
        let day, hour, min, sec;
        const timer = elm.innerHTML,
            countColons = timer.match(/:/g).length;

        switch(countColons) {
            case 1: // min, sec
                min = Number(timer.split(':')[0]);
                sec = Number(timer.split(':')[1]);

                generateCountDown(elm, min, sec);
                break;
            case 2: // hour, min, sec
                hour = Number(timer.split(':')[0]);
                min = Number(timer.split(':')[1]);
                sec = Number(timer.split(':')[2]);

                generateCountDown(elm, min, sec, hour);
                break;
            case 3: // day, hour, min, sec
                day = Number(timer.split(':')[0]);
                hour = Number(timer.split(':')[1]);
                min = Number(timer.split(':')[2]);
                sec = Number(timer.split(':')[3]);

                generateCountDown(elm, min, sec, hour, day);
                break;
        }
        console.log(timer);
    }

    function initial() {
        const countDownElms = document.querySelectorAll('[data-countdown]');
        for(let countDownElm of countDownElms) {
            initCountDown(countDownElm);
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        initial();
    });
})(window.utils);
