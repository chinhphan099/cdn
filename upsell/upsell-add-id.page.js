(function() {
    function handleAddId() {
        Array.prototype.slice.call(document.querySelectorAll('.js-btn-place-upsell-order')).forEach((btn, index) => {
            switch(index) {
                case 0:
                    btn.setAttribute('id', 'NewUSTopAntbtn');
                    break;
                case 1:
                    btn.setAttribute('id', 'NewUSMiddleAntbtn');
                    break;
                case 2:
                    btn.setAttribute('id', 'NewUSEndAntbtn');
                    break;
                case 3:
                    btn.setAttribute('id', 'NewUSFloatAntbtn');
                    break;
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        handleAddId();
    });
})();
