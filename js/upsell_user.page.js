document.addEventListener('DOMContentLoaded', function() {
    const firstName = localStorage.getItem('user_firstname') == null ? '' : localStorage.getItem('user_firstname'),
        lastName = localStorage.getItem('user_lastname') == null ? '' : localStorage.getItem('user_lastname'),
        headingElms = document.querySelectorAll('.heading-content');

    for(const headingElm of headingElms) {
        headingElm.innerHTML = headingElm.innerHTML.replace('{firstname}', firstName).replace('{lastname}', lastName)
    }
}, false);
