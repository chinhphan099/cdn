((utils) => {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    function triggerButtons() {
        document.addEventListener('click', function(e) {
            e.preventDefault();
            if(e.target.closest('.btn-agree')) {
                _q('.js-btn-place-upsell-order').click();
            }
            else if(e.target.closest('.btn-cancel')) {
                _q('.js-btn-no-thanks').click();
            }
        })
    };

    document.addEventListener('DOMContentLoaded', function() {
        triggerButtons();
    });
})(window.utils);
