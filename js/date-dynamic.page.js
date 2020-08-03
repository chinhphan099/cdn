var dateFn = {
    num: 6,
    countFormat: 10,
    dateFormat: function() {
        if (!!window.months) {
            for (let count = 0; count < dateFn.countFormat; count++) {
                let clsName = '.date-format';
                let strDateFormat = 'dateFormat';

                if (count != 0) {
                    clsName = clsName + count.toString();
                    strDateFormat = strDateFormat + count.toString();
                }

                if (!_qAll(clsName)) continue;
                for(const el of _qAll(clsName)){
                    let numReplace = el.textContent.toLowerCase().replace('{date-', '').replace('{date+', '').replace('}', '');
                    if (numReplace !== '' && isNaN(numReplace) === false) {
                        dateFn.num = parseInt(numReplace);
                    }

                    let current = new Date(),
                        vDate;
                    if (el.textContent.indexOf('-') > -1) {
                        vDate = new Date(current.setDate(current.getDate() - dateFn.num));
                    } else if (el.textContent.indexOf('+') > -1) {
                        vDate = new Date(current.setDate(current.getDate() + dateFn.num));
                    } else {
                        vDate = new Date(current.setDate(current.getDate() - dateFn.num));
                    }
                    if (!!js_translate[strDateFormat]) {
                        let c = js_translate.th ? js_translate.th : 'th';
                        if (vDate.getDate() == 1 || vDate.getDate() == 21) {
                            c = js_translate.st ? js_translate.st : 'st';
                        } else if (vDate.getDate() == 2 || vDate.getDate() == 22) {
                            c = js_translate.nd ? js_translate.nd : 'nd';
                        } else if (vDate.getDate() == 3 || vDate.getDate() == 23) {
                            c = js_translate.rd ? js_translate.rd : 'rd';
                        }
                        let weekDay = '';
                        if (!!window.weekdays) {
                            weekDay = window.weekdays[vDate.getDay()];
                        }
                        let strDate = js_translate[strDateFormat]
                            .replace('{MONTH}', window.months[vDate.getMonth()])
                            .replace('{MON}', window.months[vDate.getMonth()].substring(0, 3))
                            .replace('{C}', c)
                            .replace('{DAY}', vDate.getDate())
                            .replace('{YEAR}', vDate.getFullYear())
                            .replace('{WEEKDAY}', weekDay)
                            .replace('{WEE}', weekDay.substring(0, 3));
                        //let htmlDate = _q(clsName);
                        //htmlDate.innerHTML = strDate;
                        //for (let cls of _qAll(clsName)) {
                        //	cls.innerHTML = strDate;
                        //}
                        el.innerHTML = strDate;
                    }
                }
            }
        }
    }
}
window.addEventListener('DOMContentLoaded', () => {
    dateFn.dateFormat();
});
