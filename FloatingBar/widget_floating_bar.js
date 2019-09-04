((utils) => {
    if (!utils) {
        console.log('utils module is not found');
        return;
    }

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
            const elms = _qAll(clsName);

            for(const elm of elms) {
                let bodyRect = document.body.getBoundingClientRect(),
                    elemRect = elm.getBoundingClientRect(),
                    tickTopY = elemRect.top - bodyRect.top,
                    tickBotY = tickTopY + elemRect.height;

                elmPositions.push(tickTopY, tickBotY);
            }
        }
        return elmPositions;
    }

    function floatingBar() {
        let elmPositions;
        const floatingElm = _q('.floating-bar'),
            winTop = window.pageYOffset,
            winBot = winTop + window.innerHeight,
            clsNames = floatingElm.dataset.class.split(',').map((cls) => {return cls.trim()});

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
            elemRect = _q(elmTick).getBoundingClientRect(),
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
})(window.utils);
