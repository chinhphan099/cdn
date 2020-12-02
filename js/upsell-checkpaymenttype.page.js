(function() {
    function checkPaymenttype() {
        try {
            const orderInfos = JSON.parse(localStorage.getItem('orderInfo'));
            if (!orderInfos) {
                return;
            }

            if(orderInfos) {
                console.log(`used field useCreditCard ${orderInfos.useCreditCard} from file upsell-checkpaymenttype.page.js`);
            }

            if(orderInfos.useCreditCard) {
                document.querySelector('body').classList.add('payment-by-cc');
            }
            else {
                document.querySelector('body').classList.add('payment-by-pp');
            }
        }
        catch(e) {
            console.log(e);
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        checkPaymenttype();
    });
})();
