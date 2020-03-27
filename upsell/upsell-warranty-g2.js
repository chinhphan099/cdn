(function (utils) {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    function handleWarranty() {
        Array.prototype.slice.call(_qAll('.js-btn-place-upsell-order')).forEach(ele => {
            ele.addEventListener('click', function (e) {
                e.preventDefault();
                if(!_qById('txtProductWarrantyUpgrade').checked) {
                    e.stopImmediatePropagation();
                    _q('.process-sevice').classList.add('show');
                    return false;
                }
            });
        });
    }

    function closeButton() {
        const closeBtn = _q('.close-btn');
        if(!!closeBtn) {
            closeBtn.addEventListener('click', function (e) {
                e.preventDefault();
                _q('.process-sevice').classList.remove('show');
                _q('.warranty-body .w_checkbox').scrollIntoView({behavior: 'smooth'});
            });
        }
    }

    handleWarranty();
    closeButton();
})(window.utils);
