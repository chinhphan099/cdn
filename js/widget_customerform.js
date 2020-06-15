(function (utils) {
  if (!utils) {
    console.log('utils module is not found');
    return;
  }

  const customerFormId = 'frmCustomer';

  const eCRM = new EmanageCRMJS({
    webkey: siteSetting.webKey,
    cid: siteSetting.CID,
    lang: '',
    isTest: utils.getQueryParameter('isCardTest') ? true : false
  });

  function initFromValidation() {
    const form = document.forms[customerFormId];
    if (form) {
      const inputs = form.getElementsByTagName('input');
      for (const j of Object.keys(inputs)) {
        const input = inputs[j];

        //bind event for cpf field
        if (input.id === 'customer_cpf') {
          maskCPF(input);
          validateCPF(input);
          continue;
        }

        if (input.attributes['phonebr'] != undefined) {
          maskPhoneBr(input);
        }

        input.addEventListener('blur', function (e) {
          utils.validateInput(this);
          if (input.id === 'customer_firstname') {
            utils.saveUserInfoWithFingerprint();
          }

          if (input.id === 'customer_lastname') {
            utils.saveUserInfoWithFingerprint();
          }

          if (input.id === 'customer_email') {
            utils.saveUserInfoWithFingerprint();
            saveEmailToServer(input);
          }
        });

        input.addEventListener('change', function (e) {
          utils.validateInput(this);
        });

        input.addEventListener('keyup', function (e) {
          utils.validateInput(this);
        });
      }
    }
  }

  function validateCPF(input) {
    input.addEventListener('blur', function (e) {
      if (_isValidateCPF(this)) {
        utils.removeInputError(this);
      } else {
        utils.addInputError(this);
      }
    });

    input.addEventListener('change', function (e) {
      if (_isValidateCPF(this)) {
        utils.removeInputError(this);
      } else {
        utils.addInputError(this);
      }
    });

    input.addEventListener('keyup', function (e) {
      if (_isValidateCPF(this)) {
        utils.removeInputError(this);
      } else {
        utils.addInputError(this);
      }
    });
  }

  function maskCPF(input) {
    input.addEventListener('keypress', function (e) {
      const code = e.which || e.keyCode;
      let value = '';
      if (code !== 8) {
        if ((code > 47 && code < 58) //number
          || code == 8 || code == 46 //del
          || (code > 36 && code < 41) //forword
          || (code > 15 && code < 19) //shift ctrl atl
          || code == 9 || code == 13 //tab enter
        ) {
          value = this.value.toString().replace(/\-/g, '').replace(/\./g, '').substring(0, 11);
        } else {
          e.preventDefault();
          return;
        }

        if (value.length >= 11) e.preventDefault();
        this.value = formatCPF(value);
        return true;
      }
    });

    input.addEventListener('keyup', function (e) {
      const value = this.value.toString().replace(/\-/g, '').replace(/\./g, '').substring(0, 11);
      this.value = formatCPF(value);
    });
  }

  function maskPhoneBr(input) {
    input.addEventListener('keypress', function (e) {
      const code = e.which || e.keyCode;
      let value = '';
      if ((code > 47 && code < 58) //number
        || code == 8 || code == 46 //del
        || (code > 36 && code < 41) //forword
        || (code > 15 && code < 19) //shift ctrl atl
        || code == 9 || code == 13 //tab enter
      ) {
        value = this.value.toString().replace(/\(|\)|\ |\-|\+/gi, '').substring(0, 13);
      } else {
        e.preventDefault();
        return;
      }

      if (value.length >= 13) e.preventDefault();
      this.value = formatPhoneBr(value);
      return true;
    });

    input.addEventListener('keyup', function (e) {
      const value = this.value.toString().replace(/\(|\)|\ |\-|\+/gi, '').substring(0, 13);
      this.value = formatPhoneBr(value);
    });
  }

  function formatPhoneBr(value) {
    value = value.replace(/\(|\)|\ |\-|\+/gi, '');
    var string = '';
    string = value;
    if (value.length > 4 && value.length <= 9) {
      string = value.slice(0, -4) + '-' + value.slice(-4, 13);
    }
    if (value.length === 10) {
      string = '(' + value.substring(0, 2) + ') ' + value.substring(2, 6) + '-' + value.substring(6, value.length);
    }
    if (value.length === 11) {
      string = '(' + value.substring(0, 2) + ') ' + value.substring(2, 7) + '-' + value.substring(7, value.length);
    }
    if (value.length === 12) {
      string = '+' + value.substring(0, 2) +
        ' (' + value.substring(2, 4) + ') ' +
        value.substring(4, 8) + '-' +
        value.substring(8, value.length);
    }
    if (value.length === 13) {
      string = '+' + value.substring(0, 2) +
        ' (' + value.substring(2, 4) + ') ' +
        value.substring(4, 9) + '-' +
        value.substring(9, value.length);
    }

    return string;
  };

  function formatCPF(value) {
    value = value.replace(/\./gi, '').replace(/\-/gi, '');
    var string = '',
      strArr = [];
    for (var i = 0, n = value.length; i < n; i += 3) {
      if (strArr.length < 4) {
        strArr.push(value.substring(i, i + 3));
      }
    }
    for (var j = 0, m = strArr.length; j < m; j++) {
      if (j < 3) {
        string += '.' + strArr[j]
      } else {
        string += '-' + strArr[j]
      }
    }
    return string.substr(1);
  }

  function _isValidateCPF(elm) {
    var cpf = elm.value;
    if (cpf.trim() === "") {
      return false;
    }

    cpf = cpf.replace(/\./gi, "").replace(/-/gi, "");
    var isValid = true;
    var sum;
    var rest;
    var i;
    sum = 0;

    if (cpf.length !== 11 || cpf === "00000000000" || cpf === "11111111111" || cpf === "22222222222" || cpf === "33333333333" || cpf === "44444444444" || cpf === "55555555555" || cpf === "66666666666" || cpf === "77777777777" || cpf === "88888888888" || cpf === "99999999999") {
      isValid = false;
    }

    for (i = 1; i <= 9; i++) {
      sum = sum + parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
    }

    rest = (sum * 10) % 11;

    if ((rest === 10) || (rest === 11)) {
      rest = 0;
    }

    if (rest !== parseInt(cpf.substring(9, 10), 10)) {
      isValid = false;
    }

    sum = 0;

    for (i = 1; i <= 10; i++) {
      sum = sum + parseInt(cpf.substring(i - 1, i), 10) * (12 - i);
    }

    rest = (sum * 10) % 11;

    if ((rest === 10) || (rest === 11)) {
      rest = 0;
    }
    if (rest !== parseInt(cpf.substring(10, 11), 10)) {
      isValid = false;
    }
    return isValid;
  };

  /**
   * check if email is valid then trigger api to save to server
   * @param: emailElem : is a email field (a DOM element)
   */

  function saveEmailToServer(emailElem) {
    if (!emailElem.classList.contains('input-error')) {
      if (window.siteSetting && window.siteSetting.campaignName !== '') {
        eCRM.Order.submitEmailToServerFp(emailElem.value, window.siteSetting.campaignName, 4, receiveData);
      } else {
        console.log('siteSetting is null');
      }
    }
  }

  //--Receive result/error after send Email to server
  function receiveData(err, result) {
    if (result !== null) {
      utils.events.emit('onSavedCustomerEmail', result);
      console.log(result);
    } else {
      console.log(err)
    }
  }

  function isValid() {
    const form = document.forms[customerFormId];
    if (form) {
      var inputs = form.getElementsByTagName('input');
      if (inputs && inputs.length > 0) {
        for (let input of inputs) {
          utils.validateInput(input);
        }
      }
    }

    const cpf = _qById('customer_cpf');
    if (cpf) {
      if (_isValidateCPF(cpf)) {
        utils.removeInputError(cpf);
      } else {
        utils.addInputError(cpf);
      }
    }

    let isValid = _q(`#${customerFormId} input.input-error`) ? false : true;
    return isValid;
  }

  function getCustomerInfo() {
    const firstName = _qById('customer_firstname') ? _qById('customer_firstname').value : _qById('shipping_firstname').value;
    const lastName = _qById('customer_lastname') ? _qById('customer_lastname').value : _qById('shipping_lastname').value;

    let cpf = '';
    if (_qById('customer_cpf')) {
      cpf = _qById('customer_cpf').value;
    }

    const customerInfo = {
      "email": _qById('customer_email').value,
      "phoneNumber": _qById('customer_phone').value,
      "firstName": firstName,
      "lastName": lastName
    };

    if (cpf !== '') {
      customerInfo.customerIdentificationValue = cpf;
      customerInfo.customerIdentificationTypeId = 1; //always 1
      customerInfo.phoneNumber = _qById('customer_phone').value.replace(/\(|\)|\ |\-|\+/gi, '');
    }

    return customerInfo;
  }

  window.widget = window.widget ? window.widget : {};
  window.widget.customer = {
    getCustomerInfo: getCustomerInfo
  };

  utils.customerForm = {
    isValid: isValid
  };

  document.addEventListener('DOMContentLoaded', () => {
    initFromValidation();
  });
})(window.utils);
