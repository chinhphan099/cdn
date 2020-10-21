((utils) => {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    function triggerButtons() {
        document.addEventListener('click', function(e) {
            if(e.target.classList.contains('btn-agree')) {
                _q('.js-btn-place-upsell-order').click();
            }
            else if(e.target.classList.contains('btn-cancel')) {
                _q('.js-btn-no-thanks').click();
            }
        })
    };

    document.addEventListener('DOMContentLoaded', function() {
        triggerButtons();
    });
})(window.utils);
