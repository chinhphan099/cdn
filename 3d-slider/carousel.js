class Carousel {
  constructor(parentElm, galleryOuterCls, itemCls) {
    this.currentIndex = 0;
    this.galleryOuter = parentElm.querySelector(galleryOuterCls);
    this.carouselArray = parentElm.querySelectorAll(itemCls);
    this.galleryLength = this.carouselArray.length;
  }

  _q(selector) {
    var qSelector = document.querySelectorAll(selector);

    return {
      addClass: function(className) {
        for(let elm of qSelector) {
          elm.classList.add(className);
        }
      },
      removeClass: function(className) {
        for(let elm of qSelector) {
          elm.classList.remove(className);
        }
      }
    }
  }

  getIndexOfElm(elms, target) {
    return [].indexOf.call(elms, target);
  }

  resetSlide() {
    this._q('.gallery-item').removeClass('gallery-item-selected');
    this._q('.gallery-item').removeClass('gallery-item-previous');
    this._q('.gallery-item').removeClass('gallery-item-next');
    this._q('.gallery-item').removeClass('gallery-item-first');
    this._q('.gallery-item').removeClass('gallery-item-last');

    this._q('.gallery-item-selected').removeClass('gallery-item-selected');
  }

  generateBullets() {
    this.galleryOuter.insertAdjacentHTML('afterend', '<ul class="gallery-nav"></ul>');
    const nav = document.querySelector('.gallery-nav');
    for (let i = 0; i < this.galleryLength; i++) {
      nav.insertAdjacentHTML('beforeend', '<li class="gallery-nav-item"></li>');
    }
  }

  activeSlideAtIndex(index) {
    this.resetSlide();

    this.currentIndex = index;
    document.querySelectorAll('.gallery-nav li')[index].classList.add('gallery-item-selected');

    const previous = Math.abs(index + this.galleryLength - 1) % this.galleryLength;
    const first = Math.abs(index + this.galleryLength - 2) % this.galleryLength;
    const next = (index + 1) % this.galleryLength;
    const last = (index + 2) % this.galleryLength;

    this.carouselArray[index].classList.add('gallery-item-selected');
    this.carouselArray[previous].classList.add('gallery-item-previous');
    this.carouselArray[first].classList.add('gallery-item-first');
    this.carouselArray[next].classList.add('gallery-item-next');
    this.carouselArray[last].classList.add('gallery-item-last');
  }

  onClickControlers() {
    const triggers = Array.prototype.slice.call(document.querySelectorAll('.gallery-control'));

    triggers.forEach(control => {
      control.addEventListener('click', (e) => {
        let newIndex = this.currentIndex;
        if (e.currentTarget.classList.contains('gallery-controls-next')) {
          newIndex = newIndex + 1;
        } else {
          newIndex = this.galleryLength + newIndex - 1;
        }
        this.activeSlideAtIndex(newIndex % this.galleryLength)
      });
    });
  }

  onClickBullets() {
    const bulletElms = document.querySelectorAll('.gallery-nav li');
    Array.prototype.slice.call(document.querySelectorAll('.gallery-nav li')).forEach((bullet) => {
      bullet.addEventListener('click', (e) => {
        this.activeSlideAtIndex(this.getIndexOfElm(bulletElms, e.currentTarget));
      });
    });
  }

  onClickImages() {
    Array.prototype.slice.call(this.carouselArray).forEach((img) => {
      img.addEventListener('click', () => {
        if (img.classList.contains('gallery-item-first') || img.classList.contains('gallery-item-previous')) {
          this.activeSlideAtIndex((this.galleryLength + this.currentIndex - 1) % this.galleryLength);
        }
        if (img.classList.contains('gallery-item-next') || img.classList.contains('gallery-item-last')) {
          this.activeSlideAtIndex((this.currentIndex + 1) % this.galleryLength);
        }
      });
    });
  }

  initialize(index) {
    this.generateBullets();
    this.activeSlideAtIndex(index);
    this.onClickControlers();
    this.onClickImages();
    this.onClickBullets();
  }
}

const galleryElm = document.querySelector('.gallery');
const slide = new Carousel(galleryElm, '.gallery-outer', '.gallery-item');
slide.initialize(0);
