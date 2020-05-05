((utils) => {
    if(!utils) {
        console.log('modules is not found');
        return;
    }

    function checkLocation() {
        let countryCode = utils.localStorage().get('countryCode');
        if(!!countryCode && (countryCode.toLowerCase() === 'us' || countryCode.toLowerCase() === 'gb')) {
            _qAll('.js-list-group li')[1].click();
        }
        else {
            _qAll('.js-list-group li')[0].click();
        }
    }

    utils.events.on('bindOrderPage', checkLocation);
})(window.utils);
