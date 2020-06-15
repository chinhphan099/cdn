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

  function closePopup() {
    Array.prototype.slice.call(_qAll('.popup_widget--opened')).forEach(popup => {
      popup.classList.remove('popup_widget--opened');
    });
    bodyElm.classList.remove('show-popup_widget');
    bodyElm.style.removeProperty('padding-right');
  }

  function showPopup(id) {
    closePopup();
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
  window.closePopup = closePopup;
})(window.utils);
