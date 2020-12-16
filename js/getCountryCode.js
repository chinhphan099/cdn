(function() {
    try {
        var webkey = 'c0db2843-9e6d-4f9a-bc37-4a1d5fa2d7a2';
        var cid = '19AD287A-00C6-434C-97F3-03E47EAB4EEF';
        var request = new XMLHttpRequest();
        request.open('GET', '//sales-prod.tryemanagecrm.com/api/campaigns/' + webkey + '/customers/location');
        request.setRequestHeader('Accept', 'application/json');
        request.setRequestHeader('X_CID', cid);

        request.onreadystatechange = function () {
          if (this.readyState === 4) {
            if (this.responseText) {
                var res = JSON.parse(this.responseText);
                var countryCode = res.countryCode.toLowerCase();
                if (countryCode === 'us') {
                }
            }
          }
        };

        request.send();
    } catch (e) {
        console.log(e);
    }
})();
