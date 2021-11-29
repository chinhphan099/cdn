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
var deviceResetId = 4410883342354;
var aboutKoreId = 4410868470930;
var healthAppId = 4410868474130;
var functionsId = 4410868475922;
var resourcesId = 4410868480530;

function removeLoader(parentElm) {
  const loaders = parentElm.querySelectorAll('.js-loader');
  Array.prototype.slice.call(loaders).forEach((loader) => {
    loader.remove();
  });
}
function handleScrollContent(id) {
  document.querySelector('.tabs-block li.active').classList.remove('active');
  document.querySelector('[href="#' + id + '"]').closest('li').classList.add('active');
  document.getElementById(id).scrollIntoView({
    behavior: 'smooth'
  });
}
const prefixAPI = `https://support.korehealthofficial.com/api/v2/help_center/${lang}/sections/`;
function renderArticleList(articles, elmId) {
  var wrap = document.querySelector(elmId);
  if (!wrap) return
  for(var i = 0, n = articles.length; i < n; i++) {
    wrap.insertAdjacentHTML('beforeend', `<p><a href="${articles[i].html_url}">${articles[i].title}</a></p>`);
  }
  removeLoader(wrap)
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
fetchUrlsParallel([
  { url: prefixAPI + deviceResetId + '/articles?page[size]=100'},
  { url: prefixAPI + aboutKoreId + '/articles?page[size]=100'},
  { url: prefixAPI + healthAppId + '/articles?page[size]=100'},
  { url: prefixAPI + functionsId + '/articles?page[size]=100'},
  { url: prefixAPI + resourcesId + '/articles?page[size]=100'}
])
.then(async (response) => {
  const deviceResetArticles = response.find((item) => item.links.first.indexOf(deviceResetId) > -1);
  const aboutKoreArticles = response.find((item) => item.links.first.indexOf(aboutKoreId) > -1);
  const healthAppArticles = response.find((item) => item.links.first.indexOf(healthAppId) > -1);
  const functionsArticles = response.find((item) => item.links.first.indexOf(functionsId) > -1);
  const resourcesArticles = response.find((item) => item.links.first.indexOf(resourcesId) > -1);

  renderArticleList(deviceResetArticles.articles, '#deviceReset');
  await delay(500);
  renderArticleList(aboutKoreArticles.articles, '#aboutKore');
  await delay(500);
  renderArticleList(healthAppArticles.articles, '#healthApp');
  await delay(500);
  renderArticleList(functionsArticles.articles, '#functions');
  await delay(500);
  renderArticleList(resourcesArticles.articles, '#resources');

  const id = window.location.href.split('#')[1];
  if (id) {
    handleScrollContent(id);
  }
})
.catch((err) => {
  console.log(err);
});

var listItem = document.querySelectorAll('.tabs-block .nav a');
Array.prototype.slice.call(listItem).forEach(function(item) {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    var id = e.currentTarget.getAttribute('href').substring(1);
    handleScrollContent(id);
  });
});
