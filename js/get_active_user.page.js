(() => {
    function getActiveUser(isByPage) {
        let url = 'https://ctrwow-prod-fingerprint-microservice.azurewebsites.net/api/onlineUsers';

        if(!!isByPage) {
            url += '?byPage=true&for=' + window.location.href.replace('//test.', '//www.');
        }
        else {
            url += '?for=' + window.location.origin.replace('//test.', '//www.');
        }

        let setting = {
            method: 'GET',
            headers: {'content-type': 'application/json'}
        };
        fetch(url, setting).then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then(function(data) {
            if(!!document.querySelector('.item-view')) {
                document.querySelector('.item-view').innerHTML = document.querySelector('.item-view').innerHTML.replace('{itemView}', data);
                if(!isNaN(data)) {
                    document.querySelector('.item-view').style.display = 'block';
                }
            }
        })
        .catch(err => {
            console.log('Error: ', err)
        });
    };

    window.addEventListener('DOMContentLoaded', () => {
        if(window.location.origin.indexOf('dfocms.com') === -1) {
            getActiveUser(false);
        }
        else if(!!document.querySelector('.item-view')) {
            document.querySelector('.item-view').style.display = 'block';
        }
    });
})();
