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

  _q('#gamefiedEmailTxt').addEventListener('blur', function (e) {
    utils.validateInput(this);
    saveEmailToServer(this);
  });

  let isFirstSpin = true;
  $(document).on('click', '.spin-button', function(e) {
    if(!!$('#gamefiedEmailTxt').val() && !$('#gamefiedEmailTxt').hasClass('input-error')) {
      if(isFirstSpin) {
        $('.gamefied').superWheel('start', 'value', Math.floor(Math.random() * 2) + 1);
        isFirstSpin = false;
      }
      else {
        $('.gamefied').superWheel('start', 'value', 1);
      }
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
  });

  setTimeout(function() {
    $('.gamefied').superWheel({
      slices: slices,
      text : {
        size: 20,
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
      if(results.value === 2) {
        // Confetti
        colors = ['#dda60b', '#fbda77', '#dda60b', '#efb50d', '#fce9aa'];
        confetti.startConfetti();
        setTimeout(function() {
          confetti.stopConfetti();
        }, 1000);

        // Update Text - resultText
        $('.gamefiedWrap .content-bonus .text-wrap').html($('.gamefiedWrap .content-bonus .text-wrap').html().toString().replace('{resultText}', results.text));

        $('.gamefiedWrap .content-1').fadeOut(10, function() {
          $('.gamefiedWrap').addClass('got-bonus');
          $('.gamefiedWrap .content-bonus').fadeIn(10);
        });
      }
      else if(results.value === 1) {
        // Confetti
        colors = ['#00FFFF', '#FFFF00', '#7CFC00', '#00FF00', '#9400D3', '#FF4500', '#0000FF', '#FF8C00', '#FF00FF'];
        confetti.startConfetti();
        setTimeout(function() {
          confetti.stopConfetti();
        }, 1000);

        // Update Text - resultText
        $('.gamefiedWrap .content-2 .text-wrap').html($('.gamefiedWrap .content-2 .text-wrap').html().toString().replace('{resultText}', results.text));

        let visibleElm = $('.gamefiedWrap .content-1');
        if($('.gamefiedWrap').hasClass('got-bonus')) {
          visibleElm = $('.gamefiedWrap .content-bonus');
        }
        visibleElm.fadeOut(10, function() {
          $('.gamefiedWrap').removeClass('got-bonus').addClass('got-deal');
          $('.gamefiedWrap .content-2').fadeIn(10);
        });
      }
      $('#gamefied-no').html($('#gamefied-no').attr('data-reject') + ' <i class="icon-close"></i>');
    });
  }, 2000);
})(window.utils);
