((utils) => {
    if (!utils) {
        return;
    }

    if (!_q('.banner-covid19 .shop-link')) {
        return;
    }

    _q('.banner-covid19 .shop-link').addEventListener('click', (e) => {
        e.preventDefault();
        _q('.banner-covid19').classList.add('hidden');
        utils.addParamIntoUrl('banner', 'x');
    });
})(window.utils);
