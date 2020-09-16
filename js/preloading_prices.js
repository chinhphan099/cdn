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

/* Load Price */
(() => {
    const key = 'campproducts';
    window.addEventListener('load', () => {
        if (!window.siteSetting) return;

        if (siteSetting.webKey && siteSetting.CID) {
            if (checkCamp(siteSetting.webKey)) return;

            const url = `https://websales-api.tryemanagecrm.com/api/campaigns/${siteSetting.webKey}/products/prices`;
            const options = {
                headers: {
                    X_CID: siteSetting.CID
                }
            }

            fetch(url, options)
                .then(res => {
                    try {
                        return res.json();
                    } catch (err) {
                        console.log('Parse json error: ', err);
                    }
                })
                .then(data => {
                    try {
                        console.log('loading prices');
                        //store in localStorage
                        let campProducts = localStorage.getItem(key);
                        if (campProducts) {
                            campProducts = JSON.parse(campProducts);
                        } else {
                            campProducts = {
                                camps: []
                            }
                        }

                        if (typeof data.prices !== 'undefined') {
                            data.timestamp = new Date().toISOString();

                            const camps = campProducts.camps.filter(item => {
                                return item[siteSetting.webKey];
                            });

                            let camp = {};
                            if (camps.length > 0) {
                                camp = camps[0];
                                camp[siteSetting.webKey] = data;
                            } else {
                                camp[siteSetting.webKey] = data;
                                campProducts.camps.push(camp);
                            }

                            localStorage.setItem(key, JSON.stringify(campProducts));
                        }
                    } catch (err) {
                        console.log(err);
                    }
                })
                .catch(err => {
                    console.log(err);
                });
        }
    });

    function checkCamp(webKey) {
        let isExisted = true;
        let campProducts = localStorage.getItem(key);
        if (campProducts) {
            try {
                campProducts = JSON.parse(campProducts);
                const camps = campProducts.camps.filter(item => {
                    return item[webKey];
                });

                if (camps.length > 0) {
                    const beforeDate = new Date(camps[0][webKey].timestamp);
                    const newDate = new Date();
                    const res = Math.abs(newDate - beforeDate) / 1000;
                    const minutes = Math.floor(res / 60);
                    //console.log('check time of keeping prices in local storage: ', minutes);
                    if (minutes > 1) isExisted = false;
                } else {
                    isExisted = false;
                }
            } catch (err) {
                console.log(err);
                isExisted = false;
            }
        } else {
            isExisted = false;
        }
        return isExisted;
    }
})();
