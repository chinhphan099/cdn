(function (utils) {
  if (!utils) return;

  function afterLoadedConfirmData(data) {
    try {
      const fvalue = data.receipts[0].formattedAmount.replace(/[,|.]/g, '');
      const pValue = data.receipts[0].amount.toFixed(2).toString().replace(/\./, '');
      const fCurrency = fvalue.replace(pValue, '######');
      const shippingPriceFormatted = data.shippingPriceFormatted;

      let orderTotal = data.orderPrice;
      for (let i = 0; i < data.relatedOrders.length; i++) {
        if (data.relatedOrders[i].orderStatus !== 'Cancel') {
          orderTotal += data.relatedOrders[i].orderPrice;
        }
      }

      const isFiredConfirmTotal = utils.localStorage().get('isFiredConfirmTotal');
      if (!!isFiredConfirmTotal) return;

      utils.localStorage().set('isFiredConfirmTotal', true);
      window.dataLayer = window.dataLayer || [];
      dataLayer.push({
        'event': 'confirmTotal',
        'orderTotal': orderTotal.toFixed(2)
      });
    }
    catch (e) {
      console.log(e);
    }
  }

  utils.events.on('bindGtmEvents', afterLoadedConfirmData)
})(window.utils);
