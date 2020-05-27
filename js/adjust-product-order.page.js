((utils) => {
    if (!utils) {
        return;
    }

    function init() {
        if (utils.getQueryParameter('temp') === 'hcvr') {
            _q('body').classList.add('hcvr');
            _q('.productRadioListItem.item-1:not(.hidden) .js-unitDiscountRate').click();
        }

        if (utils.getQueryParameter('temp') === 'haov') {
            _q('body').classList.add('haov');
            _q('.productRadioListItem.item-3:not(.hidden) .js-unitDiscountRate').click();
        }
    }

    utils.events.on('bindOrderPage', () => {
        init();
    });
})(window.utils);
