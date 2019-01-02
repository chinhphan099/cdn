;(function($, window, undefined) {
  'use strict';

  var pluginName = 'cslider',
    timeResize,
    win = $(window),
    resize = ('onorientationchange' in window) ? 'orientationchange.resize' + pluginName : 'resize.resize' + pluginName,
    TypeSliders = {
      NORMAL: 'normal',
      SYNCING: 'syncing'
    };

  function Plugin(element, options) {
    this.element = $(element);
    this.options = $.extend({}, $.fn[pluginName].defaults, this.element.data(), options, this.element.data(pluginName));
    this.init();
  }

  Plugin.prototype = {
    init: function() {
      this.handle = this.element.find(this.options.handle);
      //if(this.handle.is(':visible')) {
        if(!!this.options.initUnder) {
          if(win.width() <= this.options.initUnder) {
            this.handle.removeClass('no-slide');
            this.initialize();
          }
          else {
            this.handle.addClass('no-slide');
          }
        }
        else {
          this.initialize();
        }

        win.off(resize).on(resize, function() {
          if(timeResize) {
            clearTimeout(timeResize);
          }
          timeResize = setTimeout(function() {
            $('[data-' + pluginName + ']').each(function() {
              if($('.slick', this).is(':visible')) {
                if($(this).data()[pluginName].options[pluginName].initUnder) {
                  if(win.width() < $(this).data()[pluginName].options[pluginName].initUnder) {
                    $('.slick', this).removeClass('no-slide');
                    if(!$('.slick', this).hasClass('slick-initialized')) {
                      $(this)[pluginName]('initialize');
                    }
                    else {
                      $(this)[pluginName]('setPositionArrows');
                    }
                  }
                  else if($('.slick', this).hasClass('slick-initialized')) {
                    $('.slick', this).addClass('no-slide');
                    $(this)[pluginName]('destroy');
                  }
                }
                else {
                  $(this)[pluginName]('setPositionArrows');
                  $(this)[pluginName]('slickNoSlide');

                  // Just only have on Resize event.
                  if($('.slick', this).hasClass('no-slide')) {
                    $(this)[pluginName]('destroy');
                    $(this)[pluginName]('init');
                  }
                }
              }
            });
          }, 600);
        });
      //}
    },
    initialize: function() {
      if(this.element.find('img').length) {
        this.checkImgLoad();
      }
      else {
        this.initSlider();
      }
    },
    checkImgLoad: function() {
      var that = this,
        fakeSrc = this.element.find('img').first().attr('src');

      $('<img />')
        .attr('src', fakeSrc).css('display', 'none')
        .on('load.' + pluginName, function() {
          that.initSlider();
        })
        .on('error.' + pluginName, function() {
          that.initSlider();
        });
    },
    updateSetting: function() {
      var newOption = {}, responsiveOps;
      if(typeof this.options.desktopItems !== 'undefined') {
        newOption = $.extend(newOption, {slidesToShow: this.options.desktopItems});
      }
      if(typeof this.options.tabletItems !== 'undefined' || typeof this.options.mobileItems !== 'undefined') {
        responsiveOps = [];
        if(typeof this.options.tabletItems !== 'undefined') {
          var tablet = {
            breakpoint: 992,
            settings: {
              slidesToShow: this.options.tabletItems
            }
          };
          responsiveOps.push(tablet);
        }
        if(typeof this.options.mobileItems !== 'undefined') {
          var mobile = {
            breakpoint: 576,
            settings: {
              slidesToShow: this.options.mobileItems
            }
          };
          responsiveOps.push(mobile);
        }
        newOption = $.extend(newOption, {responsive: responsiveOps});
      }
      return newOption;
    },
    initSlider: function() {
      var that = this,
        option,
        wistiaVideo,
        navFor = {};

      switch(this.options.type) {
        case TypeSliders.NORMAL:
          option = $.extend({}, this.options.normal, this.updateSetting());
          break;
        case TypeSliders.SYNCING:
          navFor.asNavFor = this.options.navFor;
          if(this.options.view) {
            option = $.extend({}, this.options.normal, navFor);
          }
          else {
            option = $.extend({}, this.options.normal, navFor, this.updateSetting());
          }
          break;
        default:
          option = this.options.normal;
      }

      // Vertical Mode
      if(typeof this.options.verticalmode !== 'undefined') {
        var verticalMode = {
          vertical: true,
          verticalSwiping: true,
        };
        option = $.extend(option, verticalMode);
      }

      // Center Mode
      if(typeof this.options.centermode !== 'undefined') {
        var centerMode = {
          centerMode: true,
          centerPadding: !!this.options.centerPadding ? this.options.centerPadding : 0
        };
        option = $.extend(option, centerMode);
      }

      // Arrows
      if(typeof this.options.arrows !== 'undefined') {
        option = $.extend(option, {arrows: this.options.arrows});
      }

      // Dots
      if(typeof this.options.dots !== 'undefined') {
        option = $.extend(option, {dots: this.options.dots});
      }

      // fade : true / false
      if(typeof this.options.fade !== 'undefined') {
        option = $.extend(option, {fade: this.options.fade});
      }

      // infinite : true / false
      if(typeof this.options.infinite !== 'undefined') {
        option = $.extend(option, {infinite: this.options.infinite});
      }

      // Autoplay
      if(typeof this.options.autoplay !== 'undefined') {
        option = $.extend(option, {
          infinite: true,
          autoplay: true,
          autoplaySpeed: 3000,
          adaptiveHeight: false
        });
      }
      else if(this.options.type !== TypeSliders.SYNCING) {
        option = $.extend(option, {
          adaptiveHeight: true
        });
      }

      // Run
      this.handle.slick(option);

      this.handle.on('beforeChange.' + pluginName, function(slick, currentSlide, nextSlide) {
        var videoId = $('.slick-current', that.element).find('.img-view').data('videoid');
        if(!!videoId) {
          wistiaVideo = Wistia.api(videoId);
          if(wistiaVideo.state() === 'playing') {
            wistiaVideo.pause();
          }
        }
      });
      this.handle.on('afterChange.' + pluginName, function(slick, currentSlide) {
        that.setPositionArrows();

        var videoId = $('.slick-current', that.element).find('.img-view').data('videoid');
        if(!!videoId) {
          wistiaVideo = Wistia.api(videoId);
          if(wistiaVideo.state() === 'paused' || wistiaVideo.state() === 'ended') {
            wistiaVideo.play();
          }
        }
      });
      this.hoverBulletEvent();
      this.setPositionArrows();
      this.slickNoSlide();
    },
    hoverBulletEvent: function() {
      if(this.options[pluginName].slideOnHover) {
        this.handle.find('.slick-dots').on('mouseenter.bullet', 'li', function() {
          $(this).trigger('click');
        });
      }
    },
    setPositionArrows: function() {
      var arrowControl = this.handle.find('.slick-arrow'),
        imgVisible = this.handle.find('[aria-hidden="false"] .img-view'),
        maxHeight = 0,
        posTop = 0;

      if(this.options.setPositionArrows) {
        $(imgVisible).each(function() {
          maxHeight = Math.max($(this).outerHeight(), maxHeight);
        });
        posTop = (maxHeight / 2);
        arrowControl.animate({'top': posTop}, 300);
      }
    },
    slickNoSlide: function() {
      var getSlick = this.handle.slick('getSlick');

      if(getSlick.slideCount <= getSlick.options.slidesToShow) {
        this.element.addClass('no-slide');
      }
      else {
        this.element.removeClass('no-slide');
      }
    },
    destroy: function() {
      this.handle
        .slick('unslick')
        .off('afterChange.' + pluginName);
    }
  };

  $.fn[pluginName] = function(options, params) {
    return this.each(function() {
      var instance = $.data(this, pluginName);
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
      pauseOnHover: true,
      slidesToScroll: 1,
      zIndex: 5,
      focusOnSelect: true,
      prevArrow: '<button type="button" class="slick-prev slick-arrow" aria-label="Previous"><i class="icon-left"></i></button>',
      nextArrow: '<button type="button" class="slick-next slick-arrow" aria-label="Next"><i class="icon-right"></i></button>',
      rtl: $('html').attr('dir') === 'rtl' ? true : false,
      accessibility: false // Disable Slide go to top on after change
    }
  };

  $(function() {
    $('[data-' + pluginName + ']')[pluginName]();
  });

}(jQuery, window));
