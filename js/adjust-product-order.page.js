((utils) => {
    if (!utils) {
        return;
    }

    function init() {
        try {
            if (utils.getQueryParameter('temp') === 'hcvr') {
                _q('.productRadioListItem.item-1:not(.hidden) .js-unitDiscountRate').click();
                _q('body').classList.add('hcvr', 'wasteClick');
            }

            if (utils.getQueryParameter('temp') === 'haov') {
                _q('.productRadioListItem.item-3:not(.hidden) .js-unitDiscountRate').click();
                _q('body').classList.add('haov', 'wasteClick');
            }

            if (utils.getQueryParameter('temp') === 'hcvr3') {
                _q('.productRadioListItem.item-2:not(.hidden) .js-unitDiscountRate').click();
                _q('body').classList.add('hcvr3', 'wasteClick');
            }

            if (utils.getQueryParameter('temp') === 'haov3') {
                _q('.productRadioListItem.item-2:not(.hidden) .js-unitDiscountRate').click();
                _q('body').classList.add('haov3', 'wasteClick');
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    utils.events.on('bindOrderPage', () => {
        init();
    });
})(window.utils);
