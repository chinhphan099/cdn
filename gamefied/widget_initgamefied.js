(function (utils) {
  if (!utils) {
    console.log('utils module is not found');
    return;
  }

  var saveEmailToServer = function(emailElem) {
    if (!emailElem.classList.contains('input-error')) {
      if (window.siteSetting && window.siteSetting.campaignName !== '') {
        const url = `https://sales-prod.tryemanagecrm.com/api/customers/${siteSetting.webKey}`;
        //const url = `https://websales-api.tryemanagecrm.com/api/customers/${siteSetting.webKey}`;
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
  };

  if(!!_q('#gamefiedEmailTxt')) {
    _q('#gamefiedEmailTxt').addEventListener('blur', function (e) {
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

  setTimeout(function() {
    $('.gamefied').superWheel({
      slices: slices,
      text : {
        size: 20,
        color: '#fff',
        offset: 8,
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
      width: 660,
      line: {
        width: 1,
        color: "#fff"
      },
      inner: {
        width: 3,
        color: "#fff"
      },
      center: {
        width: 15,
        background: '#FFF',
        rotate: true
      }
    });

    $('.gamefied').superWheel('onComplete', function(results) {
      if(results.value === 1) {
        $('.gamefiedWrap .content-2 .text-wrap').html($('.gamefiedWrap .content-2 .text-wrap').html().toString().replace(/\{resultText\}/gi, results.text));
        $('.gamefiedWrap .content-1').fadeOut('fast', function() {
          $('.gamefiedWrap .content-2').fadeIn('fast');
        });
        $('#gamefied-no').html($('#gamefied-no').attr('data-reject') + ' <i class="icon-close"></i>');
      }
    });
  }, 2000);
})(window.utils);
