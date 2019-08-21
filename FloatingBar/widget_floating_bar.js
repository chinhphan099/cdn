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

    function floatingBar() {
        const floatingElm = document.querySelector('.floating-bar'),
            winTop = window.pageYOffset,
            winBot = winTop + window.innerHeight,
            clsNames = floatingElm.dataset.class.split(',').map((cls) => {return cls.trim();}),
            elmPositions = [];

        if(!!clsNames[0]) {
            for(const clsName of clsNames) {
                const elms = document.querySelectorAll(clsName);
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
                elemRect = document.querySelector(floatingElm.dataset.ticktopelm).getBoundingClientRect(),
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
                elemRect = document.querySelector(floatingElm.dataset.tickbottomelm).getBoundingClientRect(),
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
