(function (utils) {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    if (!siteSetting) {
        console.log('window.siteSetting object is not found');
        return;
    }

    function generateTime() {
        const datetimeElms = document.getElementsByClassName('datetime');
        const d = new Date(), month = js_translate.months[(d.getMonth() + 2) % 12];
        let year = d.getFullYear();

        if(d.getMonth() + 2 > 12) {
            year += 1;
        }

        for(const datetimeElm of datetimeElms) {
            datetimeElm.innerHTML = datetimeElm.innerHTML.replace('MMMM', month).replace('YYYY', year);
        }
    }

    function setup() {
        _q('.wrapper').insertBefore(_q('.pre-order-wrap'), _q('.wrapper').firstChild);
        _q('.pre-order-wrap').style.display = 'block';
    }

    function initial() {
        setup();
        generateTime();
    }

    utils.events.on('bindOrderPage', initial);
})(window.utils);
