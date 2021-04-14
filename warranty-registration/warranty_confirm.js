(() => {
    const WHEREPURCHASED = {
        '2': 'amazon',
        '1': 'website'
    };

    function renderEmail() {
        const email = window.localStorage.getItem('email');

        document.querySelector('.cus-email').textContent = email;
    }

    function checkWherePusechased() {
        const where_purchased = window.localStorage.getItem('where_purchased');
        if(where_purchased === "2"){
            document.querySelector('.amazon-warranty').classList.remove("hidden");
        }else {
            document.querySelector('.website-warranty').classList.remove("hidden");
        }
    }

    function init() {
        renderEmail();
        checkWherePusechased();
    }

    document.querySelector('.website-warranty').classList.add("hidden");
    document.querySelector('.amazon-warranty').classList.add("hidden");
    window.addEventListener('DOMContentLoaded', () => {
        init();
    });
})();
