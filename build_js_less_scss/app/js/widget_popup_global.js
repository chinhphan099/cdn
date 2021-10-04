(() => {
  const bodyElm = document.querySelector('body');
  function getScrollbarWidth() {
    const scrollDiv = document.createElement('div');
    scrollDiv.className = 'scrollbar-measure';
    document.body.appendChild(scrollDiv);
    const scrollbarWidth = scrollDiv.getBoundingClientRect().width - scrollDiv.clientWidth;
    document.body.removeChild(scrollDiv);
    return scrollbarWidth;
  }

  function closePopup(id) {
    if (!document.getElementById(id)) {
      return;
    }
    document.getElementById(id).classList.remove('popup_widget--opened');
    if (document.querySelectorAll('.popup_widget--opened').length === 0) {
      bodyElm.classList.remove('show-popup_widget');
      bodyElm.style.removeProperty('padding-right');
    }
  }

  function closeAllPopup() {
    Array.prototype.slice.call(document.querySelectorAll('.popup_widget--opened')).forEach(popup => {
      popup.classList.remove('popup_widget--opened');
    });
    bodyElm.classList.remove('show-popup_widget');
    bodyElm.style.removeProperty('padding-right');
  }

  function showPopup(id, isCloseAllAnother) {
    if (isCloseAllAnother) {
      closeAllPopup();
    }
    if (!id) {
      return;
    }
    document.getElementById(id).classList.add('popup_widget--opened');

    const scrollBar = getScrollbarWidth();
    if (!bodyElm.classList.contains('show-popup_widget')) {
      bodyElm.classList.add('show-popup_widget');
      bodyElm.style.paddingRight = `${scrollBar}px`;
    }
  }

  window.showPopup = showPopup;
  window.closeAllPopup = closeAllPopup;
  window.closePopup = closePopup;
})();
