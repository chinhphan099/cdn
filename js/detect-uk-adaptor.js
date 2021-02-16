(function (utils) {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    function onTabPackageClick() {
        const tabs = Array.prototype.slice.call(_qAll('.js-list-group li'));
        tabs.forEach((tabItem) => {
            tabItem.addEventListener('click', (e) => {
                const type = e.currentTarget.textContent;
                if (type.toLowerCase().trim() === 'uk') {
                    window.localStorage.setItem('isPreOrder', true);
                    window.localStorage.setItem('pageType', 'pre-order');
                    _q('.devider-paypal') && _q('.devider-paypal').classList.add('hidden');
                    _q('#js-paypal-oneclick-button') && _q('#js-paypal-oneclick-button').classList.add('hidden');
                    _q('.pre-order-text-1') && _q('.pre-order-text-1').classList.remove('hidden');
                    _q('.pre-order-text-2') && _q('.pre-order-text-2').classList.remove('hidden');
                    _q('.pre-order-text-3') && _q('.pre-order-text-3').classList.remove('hidden');
                } else {
                    window.localStorage.removeItem('isPreOrder');
                    window.localStorage.removeItem('pageType');
                    _q('.devider-paypal') && _q('.devider-paypal').classList.remove('hidden');
                    _q('#js-paypal-oneclick-button') && _q('#js-paypal-oneclick-button').classList.remove('hidden');
                    _q('.pre-order-text-1') && _q('.pre-order-text-1').classList.add('hidden');
                    _q('.pre-order-text-2') && _q('.pre-order-text-2').classList.add('hidden');
                    _q('.pre-order-text-3') && _q('.pre-order-text-3').classList.add('hidden');
                }
            });
        });
    }

    window.addEventListener('load', function () {
        onTabPackageClick()
    });
})(window.utils);
