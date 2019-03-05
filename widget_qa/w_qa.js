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
        const clickedItem = getClosest(titleElm, '.w_item');

        if(clickedItem.classList.contains('active')) {
            clickedItem.classList.remove('active');
        }
        else {
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
