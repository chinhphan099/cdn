((utils) => {
    if (!utils) { return; }
    function showPopupIframe() {
        const urlFooter = _qAll('.footer a, footer a, .footer-address a');
        for(let urlItem of urlFooter) {
            urlItem.addEventListener('click', function(e) {
                if(!e.currentTarget.parentElement.classList.contains('DMCA_Logo')) {
                    e.preventDefault();
                    let url = e.currentTarget.getAttribute('href');
                    let iframe = `<iframe src=${url}></iframe>`;
                    _q('#popupIframe .popup_widget_main').innerHTML = iframe;
                    _q('#popupIframe .popup_widget_content').classList.add('loading');
                    window.showPopup('popupIframe', true);
                    setTimeout(function(){
                        _q('#popupIframe .popup_widget_content').classList.remove('loading');
                    },800)
                }
            });
        }
    }
    function initial() {
        showPopupIframe();
    }
    window.addEventListener('load', () => {
        initial();
    });
})(window.utils);
