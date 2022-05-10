((utils) => {
    if(!utils) {
        return false;
    }

    function floatingAside() {
        let offsetWindowTop = window.pageYOffset,
            wrapElm = _q('.section-3'),
            asideWrap = wrapElm.querySelector('.col-md-3').offsetTop,
            asideBlock = _q('.aside-img'),
            footerElm = _q('.section-4');

        if(offsetWindowTop > asideWrap) {
            asideBlock.classList.add('fixed');
        }
        else if(offsetWindowTop < asideWrap) {
            asideBlock.classList.remove('fixed');
        }

        let offsetBotAside = offsetWindowTop + asideBlock.clientHeight + parseInt(window.getComputedStyle(asideBlock).marginTop),
            offsetTopFooter = footerElm.offsetTop - parseInt(window.getComputedStyle(wrapElm).paddingBottom);

        if(offsetBotAside > offsetTopFooter) {
            asideBlock.classList.add('nofixed');
        }
        else if(offsetBotAside < offsetTopFooter) {
            asideBlock.classList.remove('nofixed');
        }
    }

    function progressBar() {
        const offsetWindowBot = window.pageYOffset + document.documentElement.clientHeight,
            body = document.body,
            html = document.documentElement,
            heightSite = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
        let percent = Math.floor(offsetWindowBot / heightSite * 100);
        if(!!_q('.header .w_main_title .text')) {
            _q('.header .w_main_title .text').style.width = percent + '%';
        }
    }

    function listener() {
        window.addEventListener('scroll', () => {
            floatingAside();
            progressBar();
        });
    }

    function initial() {
        progressBar();
        floatingAside();
        listener();
    }

    function replacePrice(data) {
        const priceVal = data.discountPrice;
        const allElements = _qAll('body *');
        for(const elem of allElements) {
            if(elem.children.length === 0 && elem.tagName.toLowerCase() !== 'script' && elem.tagName.toLowerCase() !== 'style') {
                elem.innerHTML = elem.innerHTML.replace(/{price}/g, priceVal);
            }
        }
    }

    function waitingData() {
        utils.events.on('bindOrderPage', replacePrice);
    }
    //waitingData();

    window.addEventListener('load', () => {
        initial();
    });
})(window.utils);
