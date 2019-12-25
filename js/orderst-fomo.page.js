(() => {
    const templateFomo = document.querySelector('.w_fomo_wrapper').innerHTML;

    async function fetchUrl(url) {
        const response = await fetch(url)
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                })
                .catch(err => {
                    console.log('Error: ', err)
                });

        return response;
    }

    function getQueryParameter(param) {
        let href = '';
        if (location.href.indexOf('?')) {
            href = location.href.substr(location.href.indexOf('?'));
        }

        const value = href.match(new RegExp('[\?\&]' + param + '=([^\&]*)(\&?)', 'i'));
        return value ? value[1] : '';
    }

    function isMobile() {
        return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    function bindFomo(data) {
        let count = 1;
        let fomoPopup = setInterval(function() {
            createNotifyItem(data);
            if(count === 2 && isMobile()) {
                clearInterval(fomoPopup);
            }
            count++;
        }, 15000, count);
    }

    function createNotifyItem(data) {
        const firstName = data.firstNames[Math.floor(Math.random() * data.firstNames.length)],
            lastName = data.lastNames[Math.floor(Math.random() * data.lastNames.length)],
            location = data.locations[Math.floor(Math.random() * data.locations.length)],
            randTime = Math.floor((Math.random() * 40) + 5);
        let fomoHTML = templateFomo.replace('{firstName}', firstName)
                                    .replace('{lastName}', lastName)
                                    .replace('{location}', location)
                                    .replace('{randTime}', randTime);

        //Add unit to fomo
        const randUnit = Math.floor(Math.random() * 3) + 1;

        if(!!js_translate.strUnit && !!js_translate.strUnits) {
            let strRandUnit = '';
            if(randUnit === 1) {
                strRandUnit = randUnit.toString() + js_translate.strUnit;
            }
            else {
                strRandUnit = randUnit.toString() + js_translate.strUnits;
            }

            fomoHTML = fomoHTML.replace('{randUnit}', strRandUnit);
        }
        //End Add unit to fomo

        const dailogFomo = document.querySelector('.w_fomo_wrapper');
        dailogFomo.innerHTML = fomoHTML;
        dailogFomo.classList.add('notify');

        setTimeout(function () {
            dailogFomo.classList.remove('notify');
        }, 5400);
    }

    function initial() {
        fetchUrl(window.js_translate.dataUrl).then((data) => {
            if(!document.querySelector('.edit_mode') && !!data) {
                bindFomo(data);
            }
        });
    }

    window.addEventListener('DOMContentLoaded', () => {
        if(getQueryParameter('fomo') !== '0') {
            initial();
        }
    });
})();
