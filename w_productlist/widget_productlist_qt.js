const quantity = ((utils) => {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    let isChangeTab = false;
    const getVisibleItems = () => {
        let visibleElms = [];
        const productItems = _qAll('.productRadioListItem');

        for(let item of productItems) {
            if(window.getComputedStyle(item).display !== 'none') {
                visibleElms.push(item);
            }
        }
        return visibleElms;
    };

    const setActiveItem = () => {
        const visibleItems = getVisibleItems();
        let qt = utils.getQueryParameter('qt'),
            qtNumber = Number(qt);

        if(!!qt && qtNumber > 0 && qtNumber <= visibleItems.length) {
            qtNumber -= 1;
            if(utils.getQueryParameter('et') === '1') {
                qtNumber = 0;
            }

            const listProduct = _qAll('.productRadioListItem');
            for(let itemProduct of listProduct) {
                itemProduct.classList.remove('default');
            }
            visibleItems[qtNumber].classList.add('default');
            if(!isChangeTab) {
                visibleItems[qtNumber].querySelector('input').click();
                if(typeof exitPopup !== 'undefined') {
                    exitPopup.handleEvents();
                }
            }
        }
    };

    const waitingOrderData = () => {
        utils.events.on('bindOrderPage', setActiveItem);
    };

    const onClickTabPackage = () => {
        const tabItems = _qAll('.js-list-group li');
        if(!!tabItems.length) {
            for(let tabItem of tabItems) {
                tabItem.addEventListener('click', function() {
                    isChangeTab = true;
                    setActiveItem();
                }, false);
            }
        }
    };

    const onClickListAdapter = () => {
        const tabItems = _qAll('.list-adapters input');
        if(!!tabItems.length) {
            for(let tabItem of tabItems) {
                tabItem.addEventListener('change', function() {
                    isChangeTab = true;
                    setActiveItem();
                }, false);
            }
        }
    }

    const listener = () => {
        onClickTabPackage(); // NewProductListWidget
        onClickListAdapter(); // For Tu's widget
    };

    const initial = () => {
        listener();
    };

    return {
        initial: initial,
        waitingOrderData: waitingOrderData
    }
})(window.utils);

quantity.waitingOrderData();
window.addEventListener('DOMContentLoaded', () => {
    quantity.initial();
});
