/* Functions for Pre/Index pages */
(() => {
    function getQueryParameter(param) {
        let href = '';
        if (location.href.indexOf('?')) {
            href = location.href.substr(location.href.indexOf('?'));
        }

        const value = href.match(new RegExp('[\?\&]' + param + '=([^\&]*)(\&?)', 'i'));
        return value ? value[1] : null;
    }

    function hideAdvertorialText() {
        if (getQueryParameter('ads') !== '0') {
            return;
        }
        let adsTexts = [
            'advertorial', 'Redaktionelle Anzeige', 'Publicité', 'Publirreportaje', 'Publieditorial', 'Publirreportagem',
            '广告', 'Redazionale', '광고', 'Mainosartikkeli', 'Reklammeddelande', 'Annonce',
            'Annonsetekst', 'Advertorial', '記事体広告', 'Bài viết quảng cáo'
        ];
        let isStop = false;
        Array.prototype.slice.call(_qAll('.wrapper *')).some(elm => {
            for (let adsText of adsTexts) {
                if (elm.innerHTML.trim().toLowerCase() === adsText.toLowerCase()) {
                    elm.style.opacity = '0';
                    elm.style.height = '1px';
                    elm.style.width = '1px';
                    elm.style.pointerEvents = 'none';
                    isStop = true;
                    document.querySelector('body').classList.add('hidden-ads');
                    break;
                }
            }
            if (!!isStop) {
                return true;
            }
        });
    }
    hideAdvertorialText();

    function hideSocialButton() {
        if (getQueryParameter('sm') === '0') {
            for (let btn of document.querySelectorAll('.socialBtn')) {
                btn.classList.add('hidden');
            }
        }
        else {
            for (let btn of document.querySelectorAll('.socialBtn')){
                btn.classList.remove('hidden');
            }
        }
    }
    hideSocialButton();

    function hideCommentSection() {
        if (getQueryParameter('testi') !== '0' || window.location.pathname.indexOf('index') === -1) { return; }

        Array.prototype.slice.call(document.querySelectorAll('.average-rating, .rating-block, .list-rating, .comment-block')).forEach(elm => {
            const section = elm.closest('section');
            section.classList.add('hidden');
        });
    }
    hideCommentSection();
})();

(() => {
    function isInScreenView(winTop, winBot, elmPositions) {
        let ret = false;
        for (const elmPos of elmPositions) {
            if (winBot > elmPos && elmPos > winTop) {
                ret = true;
                break;
            }
        }
        return ret;
    }

    function getElmPosition(clsNames) {
        let elmPositions = [];

        for (const clsName of clsNames) {
            const elms = document.querySelectorAll(clsName);

            for (const elm of elms) {
                if (!!(elm.offsetWidth || elm.offsetHeight || elm.getClientRects().length)) {
                    let bodyRect = document.body.getBoundingClientRect(),
                        elemRect = elm.getBoundingClientRect(),
                        tickTopY = elemRect.top - bodyRect.top,
                        tickBotY = tickTopY + elemRect.height;

                    elmPositions.push(tickTopY, tickBotY);
                }
            }
        }
        return elmPositions;
    }

    function floatingBar() {
        let elmPositions;
        const floatingElm = document.querySelector ('.floating-bar'),
            winTop = window.pageYOffset,
            winBot = winTop + window.innerHeight,
            clsNames = floatingElm.dataset.class.split(',').map((cls) => {return cls.trim();});

        if (!!clsNames[0]) {
            elmPositions = getElmPosition(clsNames);
        }

        let elmTick, winPos;
        if (!!floatingElm.dataset.ticktopelm) {
            elmTick = floatingElm.dataset.ticktopelm;
            winPos = winTop;
        }
        else if (!!floatingElm.dataset.tickbottomelm) {
            elmTick = floatingElm.dataset.tickbottomelm;
            winPos = winBot;
        }

        let bodyRect = document.body.getBoundingClientRect(),
            elemRect = document.querySelector(elmTick).getBoundingClientRect(),
            tickPos = elemRect.top - bodyRect.top;

        if (winPos >= tickPos) {
            if (!clsNames[0]) {
                if (!floatingElm.classList.contains('floating-visible')) {
                    floatingElm.classList.add('floating-visible');
                }
            }
            else {
                let isInScreen = isInScreenView(winTop, winBot, elmPositions);
                if (isInScreen) {
                    if (floatingElm.classList.contains('floating-visible')) {
                        floatingElm.classList.remove('floating-visible');
                    }
                }
                else {
                    if (!floatingElm.classList.contains('floating-visible')) {
                        floatingElm.classList.add('floating-visible');
                    }
                }
            }
        }
        else {
            if (floatingElm.classList.contains('floating-visible')) {
                floatingElm.classList.remove('floating-visible');
            }
        }

        //detect window offet Y scroll over marked element (Tick Element) - Tu Nguyen
        if (elemRect.top + elemRect.height <= 0){
            floatingElm.classList.add('marked-elm');
        }
        else {
            floatingElm.classList.remove('marked-elm');
        }
    }

    function listener() {
        window.addEventListener('scroll', () => {
            floatingBar();
        });
    }

    function initial() {
        floatingBar();
        listener();
    }
    window.addEventListener('load', () => {
        initial();
    });
})();
