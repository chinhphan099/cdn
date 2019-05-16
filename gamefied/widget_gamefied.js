const gameFied = (function (utils) {
    if (!utils) {
        return;
    }

    /*
    function replaceBracketsStrings() {
        const promoText = _q('.w_exit_popup .w_promo_text');
        promoText.innerHTML = promoText.innerHTML.replace(/{exitpopup_price}/g, '<span class='txtExitpopupPrice'></span>');
    }
    replaceBracketsStrings();
    */

    let timer = null;
    let mobileTimer = null;

    function handleEvents() {
        if (utils.getQueryParameter('et') === '0') return; //no exit popup
        if (utils.getQueryParameter('et') === '1') {
            handleYesButton();
            return;
        }

        if (utils.isDevice()) {
            window.addEventListener('touchmove', handleTouchMove);
        }

        //mouse leave
        timer = setTimeout(() => {
            document.addEventListener('mouseout', handleMouseOut);
        }, 30000);

        //when customer fill form then disable exit intent
        const inputs = _qAll('input');
        for (let input of inputs) {
            input.addEventListener('change', function () {
                clearTimeout(timer);
                clearTimeout(mobileTimer);
                document.removeEventListener('mouseout', handleMouseOut);
                window.removeEventListener('touchmove', handleTouchMove);
            });
        }

        //yes button click
        _qById('gamefied-yes').addEventListener('click', function (e) {
            e.preventDefault();
            handleYesButton();
        });

        //no button click
        _qById('gamefied-no').addEventListener('click', function (e) {
            e.preventDefault();
            hideGamefied();
        });
    }

    function handleMouseOut(e) {
        if ((e.pageY - window.pageYOffset) <= 0) {
            document.removeEventListener('mouseout', handleMouseOut);
            showGamefied();
        }
    }

    function handleTouchMove(e) {
        const productListEle = _qById('js-widget-products');
        const rect = productListEle.getBoundingClientRect();
        if (rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)) {
            window.removeEventListener('touchmove', handleTouchMove);
            mobileTimer = setTimeout(() => {
                showGamefied();
            }, 20000);
        }
    }

    function handleYesButton() {
        hideGamefied();

        //add param et=1 to url
        if (!utils.getQueryParameter('et')) {
            history.replaceState(null, null, location.href.indexOf('?') >= 0 ? location.href + '&et=1' : location.href + '?et=1');
        }

        const selectedProd = _q('.productRadioListItem.checked-item');
        const specialProduct = _q('.productRadioListItem.special_offer');

        if(selectedProd && specialProduct) {
            selectedProd.classList.remove('default');
            const selected_default_text = selectedProd.querySelector('.best-seller-text');
            if(selected_default_text) {
                selected_default_text.parentNode.removeChild(selected_default_text);
            }

            // Hidden all product items
            /*const items = _qAll('.productRadioListItem');
            for (let item of items) {
                item.classList.add('hidden');
            }*/

            // Show Special product item
            specialProduct.classList.remove('hidden');
            specialProduct.classList.add('default');
            const radioProduct = specialProduct.querySelector('input[type="radio"]');
            radioProduct.click();
        }

        //trigger update product info
        if (window.widgetExitPopup && window.widgetExitPopup.updateNewPrice) {
            const productInfo = _getProductInfo(radioProduct);
            if (productInfo) {
                utils.events.emit('bindProductDiscountInfo', productInfo);
                utils.events.emit('triggerProductBannerSidebar', productInfo);
                utils.events.emit('bindOrderPage', productInfo);
            }
        }
    }

    function _getProductInfo(productElem) {
        let result = null;
        try {
            const product = JSON.parse(productElem.dataset.product);
            var shipping = product.shippings[0];
            let priceShipping = '';
            if (shipping.price == 0) {
                priceShipping = 'free';
            } else {
                priceShipping = shipping.formattedPrice;
            }

            result = {
                priceShipping: priceShipping,
                discountPrice: product.productPrices.DiscountedPrice.FormattedValue
            }

        } catch (err) {
            console.log('_getProductInfo : ', err);
        }
        return result;
    }

    function showGamefied() {
        const specialProduct = _q('.productRadioListItem.special_offer input');
        if(specialProduct) {
            /*const product = JSON.parse(specialProduct.dataset.product);
            const formattedValue = product.productPrices.DiscountedPrice.FormattedValue;
            if(_q('.txtExitpopupPrice')) {
                _q('.txtExitpopupPrice').innerHTML = formattedValue;
            }*/
        }
        _q('body').classList.add('show-gamefied');
        /*_q('.w_modal').style.display = 'block';*/
    }

    function hideGamefied() {
        _q('body').classList.remove('show-gamefied');
        //document.getElementsByClassName('gamefiedWrap')[0].remove();
        //_q('.gamefiedWrap').style.display = 'none';

        if(!!timer) {
            clearTimeout(timer);
        }
        if(!!mobileTimer) {
            clearTimeout(mobileTimer);
        }
        document.removeEventListener('mouseout', handleMouseOut);
        window.removeEventListener('touchmove', handleTouchMove);
    }
    return {
        handleEvents: handleEvents,
        handleTouchMove: handleTouchMove,
        handleMouseOut: handleMouseOut,
        hideGamefied: hideGamefied
    };
})(window.utils);

document.addEventListener('DOMContentLoaded', () => {
    gameFied.handleEvents();
});
