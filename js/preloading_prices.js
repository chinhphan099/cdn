(function () {
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