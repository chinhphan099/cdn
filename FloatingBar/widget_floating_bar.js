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

    function floatingBar() {
        const floatingElm = _q('.floating-bar'),
            winTop = window.pageYOffset,
            winBot = winTop + window.innerHeight,
            clsNames = floatingElm.dataset.class.split(',').map((cls) => {return cls.trim()}),
            elmPositions = [];

        if(!!clsNames[0]) {
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
        }

        if(!!floatingElm.dataset.ticktopelm) {
            let bodyRect = document.body.getBoundingClientRect(),
                elemRect = _q(floatingElm.dataset.ticktopelm).getBoundingClientRect(),
                tickTopY = elemRect.top - bodyRect.top;

            if(winTop >= tickTopY) {
                floatingElm.classList.add('floating-visible');
                if(!!clsNames[0]) {
                    let isInScreen = isInScreenView(winTop, winBot, elmPositions);
                    if(isInScreen) {
                        floatingElm.classList.remove('floating-visible');
                    }
                    else {
                        floatingElm.classList.add('floating-visible');
                    }
                }
            }
            else {
                floatingElm.classList.remove('floating-visible');
            }
        }
        else if(!!floatingElm.dataset.tickbottomelm) {
            let bodyRect = document.body.getBoundingClientRect(),
                elemRect = _q(floatingElm.dataset.tickbottomelm).getBoundingClientRect(),
                tickBottomY = elemRect.top - bodyRect.top;

            if(winBot >= tickBottomY) {
                floatingElm.classList.add('floating-visible');
                if(!!clsNames[0]) {
                    let isInScreen = isInScreenView(winTop, winBot, elmPositions);
                    if(isInScreen) {
                        floatingElm.classList.remove('floating-visible');
                    }
                    else {
                        floatingElm.classList.add('floating-visible');
                    }
                }
            }
            else {
                floatingElm.classList.remove('floating-visible');
            }
        }
    }

    function initial() {
        floatingBar();
        listener();
    }

    function listener() {
        window.addEventListener('scroll', () => {
            floatingBar();
        });
    }

    window.addEventListener('load', () => {
        initial();
    });
})(window.utils);
