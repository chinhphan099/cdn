(function() {
    function checkPaymenttype() {
        try {
            const orderInfos = JSON.parse(localStorage.getItem('orderInfo'));
            if (!orderInfos) {
                return;
            }

            const paymentProcessorId = orderInfos.paymentProcessorId;
            if(paymentProcessorId === 28) {
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
