((utils) => {
    function triggerProductItem(index) {
        const unitElms = _qAll('.unit');
        for(const unitElm of unitElms) {
            unitElm.innerText = index;
        }
        Array.prototype.slice.call(_qAll('[class^="unitx"]')).forEach((cls) => {
            const num = Number(cls.className.replace(/[^0-9]/g,''));
            cls.textContent = index * num;
        });
        --index;
        _qAll('.productRadioListItem input')[index].click();
    }

    function impletementNumberXOrderQuantity() {
        Array.prototype.slice.call(_qAll('[class^="orderunitx"]')).forEach((cls) => {
            let num = Number(cls.className.replace(/[^0-9]/g,'')),
                qty = !!utils.localStorage().get('orderInfo') ? JSON.parse(utils.localStorage().get('orderInfo')).quantity : 1;

            if(!!utils.localStorage().get('doubleQuantity')) {
                qty /= 2;
            }
            cls.textContent = qty * num;
        });
    }

    function q(selector) {
        var qSelector = document.querySelectorAll(selector);

        return {
            setValue: function(value) {
                for(let elm of qSelector) {
                    elm.value = value;
                }
            }
        }
    }

    function listener() {
        Array.prototype.slice.call(_qAll('.custom-number .minus')).forEach((minus) => {
            minus.addEventListener('click', () => {
                let numberVal = Number(_q('.numberTxt').value);

                if(numberVal <= 1) {
                    return;
                }
                else {
                    --numberVal;
                    q('.numberTxt').setValue(numberVal);
                    triggerProductItem(numberVal);
                }
            }, false);
        });

        Array.prototype.slice.call(_qAll('.custom-number .plus')).forEach((plus) => {
            plus.addEventListener('click', () => {
                let numberVal = Number(_q('.numberTxt').value),
                    max = _qAll('.productRadioListItem').length || 4;

                if(numberVal >= max) {
                    return;
                }
                else {
                    ++numberVal;
                    q('.numberTxt').setValue(numberVal);
                    triggerProductItem(numberVal);
                }
            }, false);
        });
    }

    function initial() {
        impletementNumberXOrderQuantity();
    }

    window.addEventListener('DOMContentLoaded', () => {
        initial();
        listener();
    });
})(window.utils);
