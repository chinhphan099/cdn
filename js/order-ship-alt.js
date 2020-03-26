(function (utils) {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    //closest
    if (!Element.prototype.closest) {
        Element.prototype.closest = function (s) {
            let el = this;
            if (!document.documentElement.contains(el)) return null;
            do {
                if (el.matches(s)) return el;
                el = el.parentElement || el.parentNode;
            } while (el !== null && el.nodeType === 1);
            return null;
        };
    }

    function focusedInputField() {
        let inputElm = _qAll('.widget-customer-form input, .widget-shipping-form input'),
            selectElm = _qAll('.widget-customer-form select, .widget-shipping-form select');

        for(let select of selectElm){
            select.parentElement.parentElement.classList.add("focused");
        }
        for(let item of inputElm){
            item.setAttribute("placeholder", "");
            if(item.value.length > 0){
                item.classList.add("focused");
            }
            item.addEventListener("change",function(elem){
                if(elem.currentTarget.getAttribute("type") != "radio" && elem.currentTarget.closest(".form-group")!=null){
                    elem.currentTarget.closest(".form-group").classList.add("focused");
                }
            });
            item.addEventListener("focus",function(elem){
                if(elem.currentTarget.getAttribute("type") != "radio" && elem.currentTarget.closest(".form-group")!=null){
                    elem.currentTarget.closest(".form-group").classList.add("focused");
                    //elem.currentTarget.closest(".form-group").classList.add("ontarget");
                }
            });
            item.addEventListener("blur",function(elem){
                if(elem.currentTarget.getAttribute("type") != "radio" && elem.currentTarget.closest(".form-group") != null){
                    if(item.value.length > 0){
                        elem.currentTarget.closest(".form-group").classList.add("focused");
                    }
                    else{
                        elem.currentTarget.closest(".form-group").classList.remove("focused");
                    }
                    //elem.currentTarget.closest(".form-group").classList.remove("ontarget");
                }
            });
        }
    }

    function activatedProductItem(){
        let productItem = _qAll('.productRadioListItem input[name="product"]');

        for(let item of productItem){
            item.addEventListener('change', function(){
                //remove Checked Item
                let curentCheckedItem = _q('.productRadioListItem.checked-item');

                curentCheckedItem.classList.remove('checked-item');
                if(this.checked){
                    this.closest('.productRadioListItem').classList.add('checked-item');
                }
            })
        }
    }

    function changeOrderElem(){
        if(document.querySelector('.step-2')){
            let _elem = document.querySelector('.js-list-group');
            let _target = document.querySelector('.step-2');
            _target.parentNode.insertBefore(_elem, _target);
        }
    }

	function replaceUserString() {
        //Product List Widget
        if(_qAll('.js-list-group li').length > 0 && !!_q('.js-list-group li.active p > span')) {
            const plug = _q('.js-list-group li.active p > span').innerText;
            if(_qById('js-widget-products')) {
                const unitDiscountRateLables = _qAll('.js-unitDiscountRate');
                if(unitDiscountRateLables) {
                    for(let elem of unitDiscountRateLables) {
                        elem.innerHTML = elem.innerHTML.replace(/{plug}/gi, '<span class="plug">' + plug + '</span>');
                    }
                }
            }
            if(_q('.statistical .td-name')) {
                const elem = _q('.statistical .td-name');
                elem.innerHTML = elem.innerHTML.replace(/{plug}/gi, '<span class="plug">' + plug + '</span>');
            }
        }
    }

	function changeTabs() {
        replaceUserString();
        if(_qAll('.js-list-group li').length > 0) {
            Array.prototype.slice.call(_qAll('.js-list-group li')).forEach(item => {
                if(!!item.querySelector('p > span')) {
                    const plug = item.querySelector('p > span').innerText;
                    item.querySelector('p').addEventListener('click', function(e) {
                        Array.prototype.slice.call(_qAll('.productRadioListItem .plug')).forEach(item1 => {
                            item1.innerText = plug;
                        });

                        if(_q('.statistical .td-name .plug')) {
                            _q('.statistical .td-name .plug').innerText = plug;
                        }
                    });
                }
            });
        }
	}

    window.addEventListener('DOMContentLoaded', () => {
        activatedProductItem();
        focusedInputField();
        changeOrderElem();
		changeTabs();
    });

})(window.utils);
