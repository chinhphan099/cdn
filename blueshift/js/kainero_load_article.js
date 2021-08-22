async function getAjax(url) {
  try {
    const res = await fetch(url, {
      method: 'GET'
    });
    if (res.ok) {
      try {
        const jsonData = await res.json();
        return jsonData;
      } catch (err) {
        return Promise.resolve('Get ajax successfully');
      }
    } else {
      return Promise.reject(`Error code : ${res.status} - ${res.statusText}`);
    }
  } catch (err) {
    return err;
  }
}
async function postAjax(url, data) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      try {
        const jsonData = await res.json();
        return jsonData;
      } catch (err) {
        return Promise.resolve('Post ajax successfully');
      }
    } else {
      return Promise.reject(`Error code : ${res.status} - ${res.statusText}`);
    }
  } catch (err) {
    return Promise.reject(err);
  }
}
async function fetchUrlsParallel(objs) {
  const results = await Promise.all(
    objs.map((obj) => {
      if (obj.postData) {
        return postAjax(obj.url, obj.postData);
      }
      return getAjax(obj.url);
    })
  );
  const validResults = results.filter((result) => !(result instanceof Error));
  return validResults;
}

var lang = document.querySelector('html').getAttribute('lang').toLowerCase();
const data = [
  { sectionId: earnSection },
  { sectionId: shopSection },
  { sectionId: startSection }
];
function renderData(response) {
  const sections = response.find((res) => res && res.sections).sections;
  const articles = response.find((res) => res && res.articles).articles;
  data.map((item) => {
    const sectionItem = sections.find((sec) => sec.id === item.sectionId);
    item.sectionName = sectionItem.name;
    item.childSections = sections
                          .filter((section) => section.parent_section_id === item.sectionId )
                          .map((childSection) => {
                            const articleList = articles
                                            .filter((article) => article.section_id === childSection.id)
                                            .map((article) => {
                                              return {
                                                id: article.id,
                                                html_url: article.html_url,
                                                name: article.name,
                                                title: article.title,
                                                body: article.body
                                              };
                                            });
                            return {
                              childSectionId: childSection.id,
                              childSectionName: childSection.name,
                              articles: articleList
                            };
                          });
  });
}
function removeLoader(parentElm) {
  const loaders = parentElm.querySelectorAll('.loader');
  Array.prototype.slice.call(loaders).forEach((loader) => {
    loader.remove();
  });
}
function renderAside() {
  data.forEach(section => {
    const childSectionArr = [];
    let sectionItem = asideArticlesPanel;
    section.childSections.forEach((childSection) => {
      const articleArr = [];
      childSection.articles.forEach((article) => {
        const activeArticleCls = article.id === currentArticleId ? 'current-article' : '';
        const articleItem = asideArticleItem
                            .replace('{url}', article.html_url)
                            .replace('{activeArticle}', activeArticleCls)
                            .replace('{title}', article.name);
        articleArr.push(articleItem);
      });

      let childSectionHTML = '';
      const activeSectionCls = childSection.childSectionId === currentSectionId ? 'active' : '';
      childSectionHTML = asideSectionItem
                        .replace('{childSectionId}', childSection.childSectionId)
                        .replace('{sectionTitle2}', childSection.childSectionName)
                        .replace('{activeSection}', activeSectionCls)
                        .replace('{articleList}', articleArr.join(''));
      childSectionArr.push(childSectionHTML);
    });

    sectionItem = sectionItem
                  .replace('{sectionId}', section.sectionId)
                  .replace('{sectionTitle1}', section.sectionName)
                  .replace('{sectionList}', childSectionArr.join(''));

    document.querySelector('.articles-nav').insertAdjacentHTML('afterbegin', sectionItem);
    removeLoader(document.querySelector('.articles-nav'));
  });
}
function renderArticleInSection() {
  console.log(data);
  data.forEach((section) => {
    const currentSection = section.childSections.find((childSection) => childSection.childSectionId === currentSectionId);
    const articleList = [];
    currentSection && currentSection.articles.forEach((article) => {
      const articleItem = inSectionItem
                  .replace('{url}', article.html_url)
                  .replace('{title}', article.name)
                  .replace('{body}', article.body);

      articleList.push(articleItem);
    });
    if (articleList.length > 0) {
      document.querySelector('.in-section').insertAdjacentHTML('afterbegin', articleList.join(''));
    }
    removeLoader(document.querySelector('.in-section'));
  });
}
function handleAccordion(parentElm) {
  const accordionItems = parentElm.querySelectorAll('.accordion-item');
  const closeOtherAccordions = function(cur) {
    Array.prototype.slice.call(accordionItems).forEach((elm) => {
      if (!cur.isEqualNode(elm)) {
        elm.classList.remove('active');
      }
    });
  };
  Array.prototype.slice.call(accordionItems).forEach((elm) => {
    const title = elm.querySelector('.accordion-title');
    title.addEventListener('click', (e) => {
      e.preventDefault();
      closeOtherAccordions(elm);
      if (!elm.classList.contains('active')) {
        elm.classList.add('active');
      } else {
        elm.classList.remove('active');
      }
    });
  });
}
function listener() {
  handleAccordion(document.querySelector('.articles-nav'));
  handleAccordion(document.querySelector('.in-section'));
}
fetchUrlsParallel([
  { url: '/api/v2/help_center/' + lang + '/articles?page[size]=100'} ,
  { url: '/api/v2/help_center/' + lang + '/sections' }
])
.then((response) => {
  renderData(response);
  renderAside();
  renderArticleInSection();
  listener();
})
.catch((err) => {
  console.log(err);
});
