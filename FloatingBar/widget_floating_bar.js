(() => {
    function isInScreenView(winTop, winBot, elmPositions) {
        let ret = false;
        for(const elmPos of elmPositions) {
            if(winBot > elmPos && elmPos > winTop) {
                ret = true;
                break;
            }
        }
        return ret;
    }

    function getElmPosition(clsNames) {
        let elmPositions = [];

        for(const clsName of clsNames) {
            const elms = document.querySelectorAll(clsName);

            for(const elm of elms) {
                if(!!(elm.offsetWidth || elm.offsetHeight || elm.getClientRects().length)) {
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
        const floatingElm = document.querySelector('.floating-bar'),
            winTop = window.pageYOffset,
            winBot = winTop + window.innerHeight,
            clsNames = floatingElm.dataset.class.split(',').map((cls) => {return cls.trim();});

        if(!!clsNames[0]) {
            elmPositions = getElmPosition(clsNames);
        }

        let elmTick, winPos;
        if(!!floatingElm.dataset.ticktopelm) {
            elmTick = floatingElm.dataset.ticktopelm;
            winPos = winTop;
        }
        else if(!!floatingElm.dataset.tickbottomelm) {
            elmTick = floatingElm.dataset.tickbottomelm;
            winPos = winBot;
        }

        let bodyRect = document.body.getBoundingClientRect(),
            elemRect = document.querySelector(elmTick).getBoundingClientRect(),
            tickPos = elemRect.top - bodyRect.top;

        if(winPos >= tickPos) {
            if(!clsNames[0]) {
                if(!floatingElm.classList.contains('floating-visible')) {
                    floatingElm.classList.add('floating-visible');
                }
            }
            else {
                let isInScreen = isInScreenView(winTop, winBot, elmPositions);
                if(isInScreen) {
                    if(floatingElm.classList.contains('floating-visible')) {
                        floatingElm.classList.remove('floating-visible');
                    }
                }
                else {
                    if(!floatingElm.classList.contains('floating-visible')) {
                        floatingElm.classList.add('floating-visible');
                    }
                }
            }
        }
        else {
            if(floatingElm.classList.contains('floating-visible')) {
                floatingElm.classList.remove('floating-visible');
            }
        }

        //detect window offet Y scroll over marked element (Tick Element) - Tu Nguyen
        if(elemRect.top + elemRect.height <= 0){
            floatingElm.classList.add('marked-elm');
        }
        else {
            floatingElm.classList.remove('marked-elm');
        }
    }

    function hideSocialButton() {
        if (!!utils.getQueryParameter('sm') && utils.getQueryParameter('sm') === '0') {
            for(let btn of _qAll('.socialBtn')) {
                btn.classList.add('hidden');
            }
        }
        else {
            for(let btn of _qAll('.socialBtn')) {
                btn.classList.remove('hidden');
            }
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
    window.addEventListener('DOMContentLoaded', () => {
        hideSocialButton();
    });
    window.addEventListener('load', () => {
        initial();
    });
})();
