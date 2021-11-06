const win = $(window);
const pluginName = 'cslider';
let timeResize;
const resize = 'onorientationchange' in window ? 'orientationchange.resize' + pluginName : 'resize.resize' + pluginName;
const TypeSliders = {
  NORMAL: 'normal',
  SYNCING: 'syncing'
};

function Plugin(element) {
  this.element = $(element);
  // this.options = $.extend({}, $.fn[pluginName].defaults, this.element.data(pluginName))
  // this.handle = this.element.find(this.options.handle)
  this.initWidget();
}

Plugin.prototype = {
  initWidget: function (op = {}) {
    const self = this;
    this.options = $.extend({}, $.fn[pluginName].defaults, JSON.parse(this.element.attr(`data-${pluginName}`)), op);
    this.handle = this.element.find(this.options.handle);
    if (this.handle.is(':visible')) {
      if (this.options.initUnder) {
        if (win.width() < this.options.initUnder) {
          this.element.removeClass('wrap-no-slide');
          this.handle.removeClass('no-slide');
          this.initialize();
        } else {
          this.element.addClass('wrap-no-slide');
          this.handle.addClass('no-slide');
        }
      } else {
        this.initialize();
      }

      win.off(resize).on(resize, function () {
        if (timeResize) {
          clearTimeout(timeResize);
        }
        timeResize = setTimeout(self.reRenderSlide, 600);
      });

      this.listener();
    }
  },
  listener: function () {
    this.zoomInEvent();
  },
  zoomInEvent: function () {
    const zoomInElms = this.element.find('.zoomin');
    if (zoomInElms.length === 0 || !this.element.closest('.widget-slider').attr('popup-class')) {
      return;
    }
    const popupCls = '.' + this.element.closest('.widget-slider').attr('popup-class');
    zoomInElms.off('click.zoomIn').on('click.zoomIn', function () {
      const idx = $(zoomInElms).index($(this));
      // $(popupCls).find('.js-trigger-modal-button').trigger('click');
      $(popupCls).find('.ctrwow-modal').addClass('show');
      $(popupCls).find('.widget-slider').show();
      $(popupCls).find('.ctrwow-modal').css('pointer-events', 'none');
      $(popupCls).find('.ctrwow-modal-content').css('pointer-events', 'auto');
      $(popupCls).find('[data-cslider]')[pluginName]('initWidget', { initialSlide: idx });
      $(popupCls).addClass('show-popup-slide');
    });

    const zoomOutElms = $(popupCls).find('.zoomout');
    zoomOutElms.off('click.zoomOut').on('click.zoomOut', function () {
      $(popupCls).find('[data-cslider]')[pluginName]('destroy');
      $(popupCls).find('.widget-slider').hide();
      $(popupCls).find('.ctrwow-modal').removeClass('show');
      $(popupCls).removeClass('show-popup-slide');
      // $(popupCls).find('.js-btn-close').trigger('click');
    });
    $(popupCls)
      .off('click.zoomOutPopup')
      .on('click.zoomOutPopup', function (e) {
        if (!$(e.target).hasClass('popup-slide')) {
          return;
        }
        $(popupCls).find('[data-cslider]')[pluginName]('destroy');
        $(popupCls).find('.widget-slider').hide();
        $(popupCls).find('.ctrwow-modal').removeClass('show');
        $(popupCls).removeClass('show-popup-slide');
      });
  },
  reRenderSlide: function () {
    $('[data-' + pluginName + ']').each(function () {
      if ($('.slick', this).is(':visible')) {
        $(this).find('.slick-track > .slick-list').remove();
        if ($(this).data()[pluginName].options.initUnder) {
          if (win.width() < $(this).data()[pluginName].options.initUnder) {
            $('.slick', this).removeClass('no-slide');
            $(this).removeClass('wrap-no-slide');

            if (!$('.slick', this).hasClass('slick-initialized')) {
              $(this)[pluginName]('initWidget');
            } else {
              $(this)[pluginName]('setPositionArrows');
            }
          } else if ($('.slick', this).hasClass('slick-initialized')) {
            $('.slick', this).addClass('no-slide');
            $(this).addClass('wrap-no-slide');
            $(this)[pluginName]('destroy');
          }
        } else {
          if (window.ctrwowUtils.isBuilderMode()) {
            $(this)[pluginName]('destroy');
            $(this)[pluginName]('initWidget');
          } else {
            $(this)[pluginName]('setPositionArrows');
            $(this)[pluginName]('slickNoSlide');

            // Just have on Resize event.
            if ($('.slick', this).hasClass('no-slide')) {
              $(this)[pluginName]('destroy');
              $(this)[pluginName]('initWidget');
            }
          }
        }
      }
    });
  },
  initialize: function () {
    if (this.element.find('.slick').find('img').length) {
      this.checkImgLoad();
    } else {
      this.initSlider();
    }
  },
  checkImgLoad: function () {
    let fakeSrc = this.element.find('.slick').find('img').first().attr('data-ctr-lazy-src');
    if (!fakeSrc) {
      fakeSrc = this.element.find('.slick').find('img').first().attr('src');
    }

    if (fakeSrc) {
      $('<img />')
        .attr('src', fakeSrc)
        .css('display', 'none')
        .on('load.' + pluginName, () => {
          this.initSlider();
        })
        .on('error.' + pluginName, () => {
          this.initSlider();
        });
    }
    else {
      this.initSlider();
    }
  },
  updateSetting: function () {
    let newOption = {};
    const responsiveOps = [];
    if (typeof this.options.desktopItems !== 'undefined') {
      newOption = $.extend(newOption, {
        slidesToShow: this.options.desktopItems,
        rows: this.options.dkRows || 1,
        slidesToScroll: this.options.dkScrollItems || 1
      });
    }
    if (typeof this.options.tabletItems !== 'undefined' || typeof this.options.mobileItems !== 'undefined') {
      if (typeof this.options.tabletItems !== 'undefined') {
        const tablet = {
          breakpoint: 1024,
          settings: {
            slidesToShow: this.options.tabletItems,
            rows: this.options.tbRows || 1,
            slidesToScroll: this.options.tbScrollItems || 1
          }
        };
        responsiveOps.push(tablet);
      }
      if (typeof this.options.mobileItems !== 'undefined') {
        const mobile = {
          breakpoint: 768,
          settings: {
            slidesToShow: this.options.mobileItems,
            rows: this.options.mbRows || 1,
            slidesToScroll: this.options.mbScrollItems || 1,
            variableWidth: false
          }
        };
        responsiveOps.push(mobile);
      }
      newOption = $.extend(newOption, { responsive: responsiveOps });
    }
    return newOption;
  },
  initSlider: function () {
    let option;
    let wistiaVideo;
    // let vimeoPlayer
    const navFor = {};

    switch (this.options.type) {
      case TypeSliders.NORMAL:
        option = $.extend({}, this.options.normal, this.updateSetting());
        break;
      case TypeSliders.SYNCING:
        navFor.asNavFor = this.options.navFor;
        if (this.options.view) {
          option = $.extend({}, this.options.normal, navFor);
        } else {
          option = $.extend({}, this.options.normal, { focusOnSelect: true }, navFor, this.updateSetting());
        }
        break;
      default:
        option = this.options.normal;
    }

    option = $.extend(option, {
      dots: this.options.dots,
      arrows: this.options.arrows,
      fade: this.options.fade,
      infinite: this.options.infinite,
      adaptiveHeight: this.options.adaptiveHeight,
      variableWidth: this.options.variableWidth || false,
      prevArrow: this.options.prevArrow,
      nextArrow: this.options.nextArrow,
      arrowWrapper: this.options.arrowWrapper,
      appendDots: this.options.dotWrapper,
      initialSlide: this.options.initialSlide,
      speed: this.options.slideSpeed
    });

    // Autoplay
    if (this.options.autoplay) {
      option = $.extend(option, {
        autoplay: true,
        pauseOnHover: true,
        autoplaySpeed: this.options.autoplaySpeed || 3000
      });
    }

    // Vertical Mode
    if (this.options.sliderMode === 'verticalmode') {
      const verticalMode = {
        vertical: true,
        verticalSwiping: true
      };
      option = $.extend(option, verticalMode);
    }

    // Center Mode
    if (this.options.sliderMode === 'centermode') {
      const centerMode = {
        centerMode: true,
        centerPadding: this.options.centerPadding ? this.options.centerPadding : 0
      };
      option = $.extend(option, centerMode);
    }

    window._wq = window._wq || [];
    this.handle.on('init', () => {
      window.ctrwowUtils.events.emit('onInitSlider_' + this.element.attr('id'));
      window.CTR_IMG_LAZY_LOADER && window.CTR_IMG_LAZY_LOADER.revalidate();
      this.handle.find('.slick-track > .slick-list').remove();

      const wistiaVideoElm = $('.slick-current', this.element).find('.js-wistia') || $('.slick-current', this.element).find('.w_wistia');
      if (wistiaVideoElm.length) {
        window._wq.push({
          id: wistiaVideoElm.data('videoid'),
          onReady: () => {
            $(window).resize();
            this.setPositionArrows();
          }
        });
      } else {
        this.setPositionArrows();
      }
    });

    this.handle.slick(option);

    this.handle.on('beforeChange.' + pluginName, () => {
      try {
        const currentSlideElm = $('.slick-current', this.element);
        const wistiaVideoId = currentSlideElm.find('.wistia_embed').attr('id');
        if (wistiaVideoId) {
          wistiaVideo = window.Wistia.api(wistiaVideoId);
          wistiaVideo.pause();
        }

        // TODO: Will update when I meet and vimeo video should use API Vimeo
        // const vimeoVideoId = currentSlideElm.find('.vimeo-wrapper').attr('id')
        // if (vimeoVideoId) {
        //   vimeoPlayer = new window.Vimeo.Player(vimeoVideoId)
        //   vimeoPlayer.pause()
        // }
      } catch (e) {
        console.log(e);
      }
    });
    this.handle.on('afterChange.' + pluginName, () => {
      window.CTR_IMG_LAZY_LOADER && window.CTR_IMG_LAZY_LOADER.revalidate();
      try {
        if (wistiaVideo) {
          wistiaVideo.pause();
        }
      } catch (e) {
        console.log(e);
      }
      this.setPositionArrows();
    });

    this.slickNoSlide();
  },
  setPositionArrows: function () {
    const arrowControl = this.element.find('.slick-arrow');
    const imgVisible = this.handle.find('[aria-hidden="false"] .img-view').length ?
                        this.handle.find('[aria-hidden="false"] .img-view') :
                        this.handle.find('[aria-hidden="true"] .img-view');
    let maxHeight = 0;
    let posTop = 0;

    if (!arrowControl.length || !imgVisible.length) {
      return;
    }
    if (this.options.setPositionArrows) {
      $(imgVisible).each(function () {
        maxHeight = Math.max($(this).outerHeight(), maxHeight);
      });
      posTop = maxHeight / 2;
      arrowControl.animate({ top: posTop }, 300);
    }
  },
  slickNoSlide: function () {
    const getSlick = this.handle.slick('getSlick');

    if (getSlick.slideCount && getSlick.slideCount <= getSlick.options.slidesToShow) {
      // if (this.options.type !== TypeSliders.SYNCING) {
      //   this.destroy()
      // }
      this.element.addClass('wrap-no-slide');
      this.handle.addClass('no-slide');
    } else {
      this.element.removeClass('wrap-no-slide');
      this.handle.removeClass('no-slide');
    }
  },
  destroy: function () {
    if (!this.handle.hasClass('slick-initialized')) {
      return;
    }
    // this.element.find('.slick-arrow').length && this.element.find('.slick-arrow').removeAttr('style');
    this.handle.slick('unslick').off('afterChange.' + pluginName);
    this.element.find('.slick-track > .slick-list, .slick-dots').remove();
    // if (window.ctrwowUtils.isBuilderMode()) {
    //   $.removeData(this.element[0], pluginName);
    // }
  }
};

$.fn[pluginName] = function (options, params) {
  return this.each(function () {
    const instance = $.data(this, pluginName);
    if (!instance) {
      $.data(this, pluginName, new Plugin(this, options));
    } else if (instance[options]) {
      instance[options](params);
    }
  });
};

$.fn[pluginName].defaults = {
  handle: '.slick',
  normal: {
    infinite: false,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    zIndex: 5,
    rtl: $('html').attr('dir') === 'rtl',
    accessibility: false
  }
};
