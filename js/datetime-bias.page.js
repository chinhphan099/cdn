((utils) => {
  const el = _q('.date-time');
  const bindingElm = _qAll('.datebias-elm');
  const biasCustom = JSON.parse(el.dataset.marker);
  const isOrdinaryDay = el.dataset.ordinary ? JSON.parse(el.dataset.ordinary) : '';
  let objBiasCustom = null;
  if (biasCustom && biasCustom !== '') {
    const obj = biasCustom.data;
    for (const item of obj) {
      const countryCode = item["marker"].toLowerCase();
      const biasCustomVal = Number(item["replaceBy"]);

      if (Object.keys(item).length > 1) {
        if (objBiasCustom === null) objBiasCustom = {}
        objBiasCustom[countryCode] = biasCustomVal;
      }
    }
  }

  function updateDateTime(countryCode) {
    let date = new Date()
    try {
      let bias = Number(el.dataset.bias);
      const locale = el.dataset.locale;
      const dateformat = el.dataset.format.replace(/'/g,'\"');
      const options = JSON.parse(dateformat);
      let dateFormated = '';

      if (countryCode && objBiasCustom && objBiasCustom[countryCode.toLowerCase()]) {
        bias = parseInt(objBiasCustom[countryCode.toLowerCase()]);
      }

      const current = new Date();
      date = new Date(current.setDate(current.getDate() + bias));

      if(isOrdinaryDay){
        const convertFormatDay = new Intl.DateTimeFormat(locale, options || {});
        dateFormated = convertFormatDay.formatToParts(date).map(function({type, value}){
          switch (type) {
            case 'day' :
              // Append appropriate suffix
              switch (value) {
                case (value.slice(-1) === 1) :
                  return value.concat('st');
                  break;
                case (value.slice(-1) === 2) :
                  return value.concat('nd');
                  break;
                case (value.slice(-1) === 3) :
                  return value.concat('rd');
                  break;
                default: return value.concat('th');
              }
              break;
            default: return value;
          }
        }).reduce(function(string, part){ return string.concat(part)});
      } else {
        dateFormated = new Intl.DateTimeFormat(locale, options || {}).format(date);
      }

      for(let item of bindingElm){
        item.innerHTML = dateFormated
      }
    } catch (e) {
      for(let item of bindingElm){
        item.innerHTML = new Intl.DateTimeFormat('en-US').format(date);
      }
    }
  }

  function getCountryCode() {
    const url = `https://sales-prod.tryemanagecrm.com/api/campaigns/3230959E-5F07-4D75-B387-2469F6AC1D9B/customers/location`;
    window.utils
      .callAjax(url, { headers: { X_CID: '584ea331-0cd2-4c48-85d9-737f9dddfa0b' }, 'Content-Type': 'application/json' })
      .then(function (data) {
        if (data) {
          updateDateTime(data.countryCode)
        }
      })
  }


  function initial(){
    updateDateTime(null);
    if (!!objBiasCustom) {
      getCountryCode();
    }
  }

window.addEventListener('DOMContentLoaded', () => {
    initial();
})

})(window.utils);
