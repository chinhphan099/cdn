(() => {
  const element = document.querySelector('.review-block');
  const reviewItemElms = element.querySelectorAll('.review-item');

  const showDk = Number(element.getAttribute('data-show-dk'));
  const showMb = Number(element.getAttribute('data-show-mb'));
  const loadMoreDk = Number(element.getAttribute('data-loadmore-dk'));
  const loadMoreMb = Number(element.getAttribute('data-loadmore-mb'));
  const loadMoreBtn = element.querySelector('.loadmore-btn');

  for (let i = 0, n = reviewItemElms.length; i < n; i++) {
    let countShowItems = showDk;
    if (window.innerWidth < 768) {
      countShowItems = showMb;
    }
    if (i < countShowItems) {
      reviewItemElms[i].classList.remove('hidden');
    } else {
      reviewItemElms[i].classList.add('hidden');
    }
  }

  const newMansony = new Mansony({
    parent: element.querySelector('.mansony-default'),
    links: element.querySelectorAll('[data-mansony-link]'),
    active: 'is-active',
    margin: 30,
    responsive: {
      1023: {
        columns: 4,
        margin: 30
      },
      767: {
        columns: 3,
        margin: 30
      },
      575: {
        columns: 2,
        margin: 20
      },
      0: {
        columns: 1,
        margin: 20
      }
    },
    fadeDuration: {
      in: 300,
      out: 0
    }
  });

  loadMoreBtn.addEventListener('click', (e) => {
    let countLoadMoreItems = loadMoreDk;
    if (window.innerWidth < 768) {
      countLoadMoreItems = loadMoreMb;
    }
    const nextElms = element.querySelectorAll('.review-item.hidden');
    if (nextElms.length <= countLoadMoreItems) {
      e.currentTarget.classList.add('hidden');
    }
    for(let j = 0, m = nextElms.length; j < m; j++) {
      if (j < countLoadMoreItems) {
        nextElms[j].classList.remove('hidden');
      }
    }

    // Rerender Mansony
    newMansony.winWidth = window.innerWidth;
    newMansony.filterElements(() => {
      newMansony.setBlockWidth(() => {
        newMansony.orderElements();
      });
    });
  });

  reviewItemElms.forEach((item) => {
    item.addEventListener('click', () => {
      // TODO - Render and Show Popup
    });
  });
})();
