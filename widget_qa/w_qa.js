(function(utils) {
    if (!utils) {
        console.log('modules is not found');
        return;
    }
    const getClosest = (elem, selector) => {
        if (!Element.prototype.matches) {
            Element.prototype.matches =
                Element.prototype.matchesSelector ||
                Element.prototype.mozMatchesSelector ||
                Element.prototype.msMatchesSelector ||
                Element.prototype.oMatchesSelector ||
                Element.prototype.webkitMatchesSelector ||
                function(s) {
                    let matches = (this.document || this.ownerDocument).querySelectorAll(s),
                        i = matches.length;
                    while (--i >= 0 && matches.item(i) !== this) {}
                    return i > -1;
                }
        }

        // Get the closest matching element
        for (; elem && elem !== document; elem = elem.parentNode) {
            if (elem.matches(selector)) {
                return elem;
            }
        }
        return null;
    };

    function changeTab(titleElm) {
        const qaListElm = getClosest(titleElm, '.w_qa_list'),
            qaItems = qaListElm.querySelectorAll('.w_item'),
            clickedItem = getClosest(titleElm, '.w_item');

        if(clickedItem.classList.contains('active')) {
            for(let qaItem of qaItems) {
                qaItem.classList.remove('active');
            }
        }
        else {
            for(let qaItem of qaItems) {
                qaItem.classList.remove('active');
            }
            clickedItem.classList.add('active');
        }
    }

    function listener() {
        const titleElms = _qAll('.w_qa_list .w_toptext');
        for(let titleElm of titleElms) {
            titleElm.addEventListener('click', function(event) {
                changeTab(event.target);
            }, false);
        }
    }

    function init() {
        listener();
    }

    document.addEventListener('DOMContentLoaded', function(event) {
        init();
    });
})(window.utils);
