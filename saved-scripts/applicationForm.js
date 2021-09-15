<script>
// https://publish.ctrwow.com/6124823b3732312150123f84/application-form.html
;(() => {
    async function postAjax(url, data) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                body: data
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
    function prefixZeroNumber(num) {
        return num < 10 ? '0' + num : num;
    }
    function setTimeStamp() {
        const today = new Date();
        const day = prefixZeroNumber(today.getDate());
        const month = prefixZeroNumber(today.getMonth() + 1);
        const year = today.getFullYear();
        const hour = prefixZeroNumber(today.getHours());
        const minute = prefixZeroNumber(today.getMinutes());
        const second = prefixZeroNumber(today.getSeconds());
        const dateTime = `${month}/${day}/${year} ${hour}:${minute}:${second}`;
        document.querySelector('#timeStamp') && (document.querySelector('#timeStamp').value = dateTime);
    }
    function submitForm() {
        window.PubSub &&
        window.PubSub.subscribe('submitApplicationForm', (elm, data) => {
            setTimeStamp();
            window.ctrwowUtils.showGlobalLoading();
            const url = 'https://script.google.com/macros/s/AKfycby-i9w73ME6aYY3oVgv50-N1p1bZn_Fe1cFfZl9FoKKMK7bYjKjUiGq-OjnuyUAU_SXyg/exec';
            const applicationForm = document.forms['applicationForm'];
            const formData = new FormData(applicationForm);
            window.localStorage.setItem('firstName', formData.get('firstName'));
            postAjax(url, formData).then((res) => {
                if (res.result === 'success') {
                    window.location.href = 'thank-you.html';
                }
                else {
                    alert('Something wrong! Please try again later.')
                }
                window.ctrwowUtils.hideGlobalLoading();
            })
            .catch((e) => {
                alert('Something wrong! Please try again later.')
                window.ctrwowUtils.hideGlobalLoading();
            })
        })
    }
    function handleFileUpload() {
        const inputFiles = document.querySelectorAll('#resumeTxt, #coverLettertxt');
        let noFileText = '';

        Array.prototype.slice.call(inputFiles).forEach((inp) => {
            inp.addEventListener('change', (e) => {
                const wrapper = e.currentTarget.closest('.file-wrapper');
                const fileNameElm = wrapper.querySelector('.fileName');
                const file = e.currentTarget.files[0];

                if (!noFileText) {
                    noFileText = fileNameElm.textContent;
                }
                if (file) {
                    fileNameElm.textContent = file.name;
                }
                else {
                    fileNameElm.textContent = noFileText
                }
            });
        });
    }

    window.addEventListener('load', () => {
        // handleFileUpload();
        submitForm();
    });
})();
</script>
