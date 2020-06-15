((utils) => {
  if (!utils) {
    return;
  }

  const bodyElm = _q('body');
  function getScrollbarWidth() {
    const scrollDiv = document.createElement('div');
    scrollDiv.className = 'scrollbar-measure';
    document.body.appendChild(scrollDiv);
    const scrollbarWidth = scrollDiv.getBoundingClientRect().width - scrollDiv.clientWidth;
    document.body.removeChild(scrollDiv);
    return scrollbarWidth;
  }

  function closePopup(id) {
    if (!_qById(id)) {
      return;
    }
    _qById(id).classList.remove('popup_widget--opened');
    if (_qAll('.popup_widget--opened').length === 0) {
      bodyElm.classList.remove('show-popup_widget');
      bodyElm.style.removeProperty('padding-right');
    }
  }

  function closeAllPopup() {
    Array.prototype.slice.call(_qAll('.popup_widget--opened')).forEach(popup => {
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
    _qById(id).classList.add('popup_widget--opened');

    const scrollBar = getScrollbarWidth();
    if (!bodyElm.classList.contains('show-popup_widget')) {
      bodyElm.classList.add('show-popup_widget');
      bodyElm.style.paddingRight = `${scrollBar}px`;
    }
  }

  window.showPopup = showPopup;
  window.closeAllPopup = closeAllPopup;
  window.closePopup = closePopup;
})(window.utils);
