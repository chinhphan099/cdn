const initSwiperSlider = (function(){
    let initial = function(){
        sliderInitial();
    }

    let sliderInitial = function(){
        for(let slider of window.swipeSlider){
            //Init Thumb slider
            if(slider.syncSlide){
                let thumbSlider = new Swiper('.' + slider.thumbElm,{
                    slidesPerView: slider.slidesPerView,
                    freeMode: true,
                    watchSlidesVisibility: true,
                    watchSlidesProgress: true,
                    threshold: 10000
                });

                //Assign property thumbs to Slider options
                Object.assign(slider.options,{
                    thumbs: { 
                        swiper: thumbSlider
                    }
                });
            }

            //handle to autoplay wistia Video 
            if(!!slider.wistiaID){
                Object.assign(slider.options,{
                    on: {
                        slideChangeTransitionEnd: function(swiper){
                            let itemElm = this.slides[this.activeIndex],
                                autoPlayVideo = Boolean(itemElm.querySelector('.sl_video').dataset.autoplay);

                            if(this.slides[this.activeIndex].querySelectorAll('.wistia_embed').length > 0 && !!autoPlayVideo){
                                //Play next video after slide changed
                                Wistia.api(this.slides[this.activeIndex].querySelector('.sl_video').dataset.videoid).play();
                                
                                //Pause current video before slide changed
                                Wistia.api(this.slides[this.previousIndex].querySelector('.sl_video').dataset.videoid).pause();
                            } else {
                                Wistia.api(this.slides[this.activeIndex].querySelector('.sl_video').dataset.videoid).pause();
                            }
                        }
                    }
                });
            }

            let mainSlider = new Swiper('.' + slider.mainElm,slider.options);

            //Remove Icon Loading
            _q('.' + slider.mainElm).querySelector('.swiper-lazy-preloader.widget-loader-icon').classList.add('hidden');
            if(slider.thumbElm){
                _q('.' + slider.thumbElm).querySelector('.swiper-lazy-preloader.widget-loader-icon').classList.add('hidden');
            }
        }
        console.log('swiper slider initial');
    }
    return {
        initial: initial
    }

})();

window.addEventListener('load',function(){
    initSwiperSlider.initial();
});