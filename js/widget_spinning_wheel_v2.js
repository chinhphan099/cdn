// Handle Show and Hide SpinWheel
(function(utils) {
  if (!utils) {
    return;
  }

  let timer = null;
  let mobileTimer = null;
  let timeOutDesktop = Number(_q('.gamefiedWrap').dataset.time.split('-')[0].trim()) * 1000;
  let timeOutMobile = Number(_q('.gamefiedWrap').dataset.time.split('-')[1].trim()) * 1000;

  function handleEvents() {
    if (utils.isDevice()) {
      window.addEventListener('touchmove', handleTouchMove);
    }

    //mouse leave
    timer = setTimeout(() => {
      document.addEventListener('mouseout', handleMouseOut);
    }, timeOutDesktop);

    //yes button click
    _qById('gamefied-yes').addEventListener('click', function(e) {
      e.preventDefault();
      handleYesButton();
    });

    //no button click
    _qById('gamefied-no').addEventListener('click', function(e) {
      e.preventDefault();
      hideSpinningWheel();
    });

    _q('.floating-spin-button').addEventListener('click', function() {
      showSpinningWheel();
      _q('.floating-spin-button').classList.add('hidden');
    });
  }

  function handleMouseOut(e) {
    if ((e.pageY - window.pageYOffset) <= 0) {
      document.removeEventListener('mouseout', handleMouseOut);
      showSpinningWheel();
    }
  }

  function handleTouchMove(e) {
    window.removeEventListener('touchmove', handleTouchMove);
    mobileTimer = setTimeout(() => {
      showSpinningWheel();
    }, timeOutMobile);
  }

  function updateURL() {
    const params = utils.localStorage().get('getParams');
    const links = _qAll('a');
    for (let link of links) {
      if (link.href.indexOf('tel:') > -1 || link.href.indexOf('mailto:') > -1) {
        continue;
      }

      let href = link.getAttribute('href');
      if(href.indexOf('?') > -1) {
        href = href.split('?')[0] + '?' + params + '&' + href.split('?')[1]
      }
      else {
        href = href + '?' + params;
      }
      link.href = href;
    }
  }

  function handleYesButton() {
    hideSpinningWheel();

    // Update URL
    updateURL();
  }

  function showSpinningWheel() {
    _q('body').classList.add('show-gamefied');
  }

  function hideSpinningWheel() {
    _q('body').classList.remove('show-gamefied');

    if(!!timer) {
      clearTimeout(timer);
    }
    if(!!mobileTimer) {
      clearTimeout(mobileTimer);
    }
    document.removeEventListener('mouseout', handleMouseOut);
    window.removeEventListener('touchmove', handleTouchMove);
  }

  document.addEventListener('DOMContentLoaded', () => {
    handleEvents();
  });
})(window.utils);

// Handle functions for SpinWheel
(function(utils) {
  if (!utils) {
    console.log('utils module is not found');
    return;
  }
  //save email to CRM khi user enter
  function saveEmailToServer(emailElem) {
    if (!emailElem.classList.contains('input-error')) {
      if (window.siteSetting && window.siteSetting.campaignName !== '') {
        const eCRM = new EmanageCRMJS({
          webkey: siteSetting.webKey,
          cid: siteSetting.CID,
          lang: '',
          isTest: utils.getQueryParameter('isCardTest') ? true : false
        });

        const url = `${eCRM.Order.baseAPIEndpoint}/customers/${siteSetting.webKey}`;
        const options = {
          method: 'POST',
          data: {
            'email': emailElem.value,
            'customerIdentificationTypeId': 4,
            'customerIdentificationValue': siteSetting.campaignName
          },
          headers: {
            X_CID: siteSetting.CID
          }
        }
        utils.callAjax(url, options).then(result => {
          console.log(result)
        }).catch(error => console.log(error));
      } else {
        console.log('siteSetting is null');
      }
    }
  }

  function listener() {
    if(!!_q('#gamefiedEmailTxt')) {
      _q('#gamefiedEmailTxt').addEventListener('blur', function(e) {
        utils.validateInput(this);
        saveEmailToServer(this);
      });
    }
    $(document).on('click', '.spin-button', function(e) {
      if(!!$('#gamefiedEmailTxt').length) {
        if(!!$('#gamefiedEmailTxt').val() && !$('#gamefiedEmailTxt').hasClass('input-error')) {
          $('.gamefied').superWheel('start', 'value', 1);
          if(!!$('#customer_email')) {
            $('#customer_email').val($('#gamefiedEmailTxt').val());
          }
          $(this).prop('disabled', true);
        }
        else {
          $('#gamefiedEmailTxt').addClass('invalid').delay(1000).queue(function() {
            $(this).removeClass('invalid').dequeue();
          });
        }
      }
      else {
        $('.gamefied').superWheel('start', 'value', 1);
      }
    });
  }

  function implementPrice(elms, currency, discountPrice) {
    elms.each(function() {
      var price = Number($(this).text()),
        formatPrice = utils.formatPrice(price, currency, discountPrice);
      $(this).text(formatPrice);
    });
  }

  function init(currency, discountPrice) {
    if(!!currency && discountPrice) {
      for(var i = 0, n = slices.length; i < n; i++) {
        var text = document.createElement('p');
        $(text).html(slices[i].text);
        implementPrice($(text).find('.currency'), currency, discountPrice);

        var resultText = document.createElement('p');
        $(resultText).html(slices[i].resultText);
        implementPrice($(resultText).find('.currency'), currency, discountPrice);

        slices[i].text = $(text).html();
        slices[i].resultText = $(resultText).html();
      }
    }
    $('.gamefied').superWheel({
      slices: slices,
      text : {
        size: 16,
        color: '#fff',
        offset: 5,
        letterSpacing: 0,
        orientation: 'v',
        arc: true
      },
      selector: "value",
      frame: 1,
      type: "spin",
      outer: {
        color: "rgba(255,255,255,0)"
      },
      marker: {
        background: "red",
        animate: 1
      },
      width: 600,
      line: {
        width: 0,
        color: "#fff"
      },
      inner: {
        width: 3,
        color: "#997611"
      },
      center: {
        width: 10,
        background: '#D6A616',
        rotate: true
      }
    });

    $('.gamefied').superWheel('onComplete', function(results) {
      if(results.value === 1) {
        $('.gamefiedWrap .content-2 .text-wrap').each(function() {
          $(this).html($(this).html().toString().replace(/\{resultText\}/gi, results.resultText));
        });
        $('.gamefiedWrap .content-1').fadeOut('fast', function() {
          $('.gamefiedWrap .content-2').fadeIn('fast');
        });
        $('#gamefied-no').html($('#gamefied-no').attr('data-reject'));
        utils.localStorage().set('getParams', results.link);
      }
    });

    listener();
  }

  utils.events.on('bindOrderPage', function(data) {
    implementPrice($('.text-wrap .currency'),data.fCurrency, data.discountPrice);

    if(!!window.siteSetting.webKey) {
      init(data.fCurrency, data.discountPrice);
    }
    else {
      setTimeout(function() {
        init();
      }, 2000);
    }
  });
})(window.utils);
