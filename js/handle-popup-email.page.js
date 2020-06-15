(() => {
  const iconClose = _q('.email-form .icon-close');
  const hamgurgerIcon = document.querySelector('.hamburger-icon');
  const btnSubmit = _q('.email-form button');
  const inputEmail = _q('.email-form input');
  const labelError = _q('.email-form .error-message');
  const formBlock = _q(".email-form .form-block");
  const successStatus = _q('.email-form .success-status');
  const title = _q(".email-form h2");
  const subtitle = _q(".email-form h5");
  const body = _q("body");
  let flagClose = false;

  const eCRM = new EmanageCRMJS({
    webkey: siteSetting.webKey,
    cid: siteSetting.CID,
    lang: '',
    isTest: utils.getQueryParameter('isCardTest') ? true : false
  });

  function handleClosePopup(ele) {
    body.classList.toggle('open_modal');
  }

  function showLoading(isload) {
    const preloadingElem = _q('.email-form .loading-email-icon');
    if (preloadingElem) {
      if (!isload) {
        preloadingElem.classList.add('hidden');
        btnSubmit.disabled = false;
      } else {
        preloadingElem.classList.remove('hidden');
        btnSubmit.disabled = true;
      }
    }
  }

  function afterSendSuccess() {
    //Clear form and hide form
    inputEmail.value = "";
    title.classList.add('hidden');
    if (subtitle) {
      subtitle.classList.add('hidden');
    }
    formBlock.classList.add('hidden');

    //show success status
    successStatus.classList.remove('hidden');

    //set timeout close form
    setTimeout(() => {
      handleClosePopup();
      setTimeout(() => {
        title.classList.remove('hidden');
        if (subtitle) {
          subtitle.classList.remove('hidden');
        }
        formBlock.classList.remove('hidden');
        successStatus.classList.add('hidden');
      }, 100);
    }, 1000);
  }

  function popupEmail() {
    const winTop = window.pageYOffset;
    if (winTop > 500) {
      body.classList.add('open_modal');
    } else {
      body.classList.remove('open_modal');
    }
  }

  function callbackFn(err, result) {
    if (result !== null) {
      utils.events.emit('onSavedCustomerEmail', result);
      afterSendSuccess();
      flagClose = true;
    } else {
      labelError.innerHTML = window.messages ? window.messages.serverBusy || "Server is busy! Please try again." : "Server is busy! Please try again.";
      labelError.classList.remove('hidden');
    }
    showLoading(false);
  }

  function saveEmailToServer(email, callbackFn) {
    if (window.siteSetting && window.siteSetting.campaignName !== '') {
      eCRM.Order.submitEmailToServerFp(email, window.siteSetting.campaignName, 4, callbackFn);
    } else {
      console.log('siteSetting is null');
      labelError.innerHTML = window.messages ? window.messages.serverBusy || "Server is busy! Please try again." : "Server is busy! Please try again.";
      labelError.classList.remove('hidden');
    }
  }

  function handleSubmit() {
    const email = inputEmail.value;
    const validEmail = window.messages ? window.messages.invalidEmail || "Please enter valid email address." : "Please enter valid email address.";
    const requireEmail = window.messages ? window.messages.required || "This field is required." : "This field is required.";
    if (email) {
      const isEmail = utils.isEmail(email);
      if (!isEmail) {
        labelError.innerHTML = validEmail;
        labelError.classList.remove('hidden');
        return;
      }
      labelError.classList.add('hidden');
      showLoading(true);
      saveEmailToServer(email, callbackFn);
    } else {
      labelError.innerHTML = requireEmail;
      labelError.classList.remove('hidden');
    }
  }

  function listener() {
    window.addEventListener('scroll', () => {
      if (flagClose === true) return;
      popupEmail();
    });

    if (iconClose) {
      iconClose.addEventListener('click', function () {
        flagClose = true;
        handleClosePopup();
      });
    }

    if (hamgurgerIcon) {
      hamgurgerIcon.addEventListener('click', function () {
        handleClosePopup();
      })
    }
    if (btnSubmit) {
      btnSubmit.addEventListener('click', function () {
        handleSubmit();
      });
    }
  }

  function initial() {
    popupEmail();
    listener();
  }

  window.addEventListener('load', () => {
    initial();
  });
})();
