(() => {
    const fileList = [];
    const fileInput = document.getElementById('file');
    const noFile = document.querySelector('.no-file');
    const fileListDisplay = document.querySelector('.file-list-display');
    let hasInValidFile = false;

    function renderFileList() {
        fileListDisplay.innerHTML = '';
        let fileNames = '';
        fileList.forEach(function (file, index) {
            if (index > 0) {
                fileNames += `, ${file.name}`;
            }
            else {
                fileNames += file.name;
            }
        });
        fileListDisplay.textContent = fileNames;
    }
    function isValidFile(file) {
        const fileType = file.type;
        const fileSizeMB = file.size / 1024 / 1000;
        if (!fileType.includes('image') && !fileType.includes('video')) {
            hasInValidFile = true;
            return false;
        }
        if (fileType.includes('image') && fileSizeMB > 5) {
            hasInValidFile = true;
            return false;
        }
        if (fileType.includes('video') && fileSizeMB > 400) {
            hasInValidFile = true;
            return false;
        }
        return true;
    }
    function onChangeFiles() {
        fileInput.addEventListener('change', (e) => {
            fileList.length = 0;
            document.querySelector('.error-file').classList.add('hidden');
            for (var i = 0; i < fileInput.files.length; i++) {
                const file = fileInput.files[i];
                if (isValidFile(file)) {
                    fileList.push(file);
                }
                else {
                    document.querySelector('.error-file').classList.remove('hidden');
                }
            }
            document.querySelector('.fileCount').textContent = fileList.length;
            if (fileList.length > 1) {
                document.querySelector('.plural').classList.remove('hidden');
            }
            else {
                document.querySelector('.plural').classList.add('hidden');
            }

            if (fileList.length > 0) {
                fileListDisplay.classList.remove('hidden');
                noFile.classList.add('hidden');
            }
            else {
                fileListDisplay.classList.add('hidden');
                noFile.classList.remove('hidden');
            }
            renderFileList();
        });
    }

    // Form
    function isValidEmail(str) {
        if (str.trim().length === 0) return false;

        const filter = /^([\w-\.\+]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,8}|[0-9]{1,3})(\]?)$/;
        if (filter.test(str)) {
            return true;
        } else {
            return false;
        }
    }
    function addInputError(input) {
        input.classList.add('input-error');
        if (input.closest('.form-group').querySelector('.error-message')) {
            input.closest('.form-group').querySelector('.error-message').classList.remove("hidden");
        }
    }
    function removeInputError(input) {
        input.classList.remove('input-error');
        if (input.closest('.form-group').querySelector('.error-message')) {
            input.closest('.form-group').querySelector('.error-message').classList.add("hidden");
        }
    }
    function validateInput(input) {
        let minLength = input.getAttribute('minlength');
        if (minLength) {
            minLength = Number(minLength);
        }
        const inputLength = input.value.length;

        if (input.attributes['required'] === undefined) {
            return;
        }

        if (input.attributes['required'] !== undefined && input.value.trim() === '') {
            addInputError(input);
        }
        else if (input.attributes['email'] !== undefined) {
            if (isValidEmail(input.value)) {
                removeInputError(input);
            } else {
                addInputError(input);
            }
        }
        else {
            if (minLength) {
                if (inputLength > minLength) {
                    removeInputError(input);
                } else {
                    addInputError(input);
                }
            }
            else {
                removeInputError(input);
            }
        }
    }
    function validateFormElms(formId) {
        const inputs = document.getElementById(formId).querySelectorAll('input, textarea');
        for (let input of inputs) {
            input.addEventListener('blur', function (e) {
                validateInput(this);
            });

            input.addEventListener('change', function (e) {
                validateInput(this);
            });

            input.addEventListener('keyup', function (e) {
                validateInput(this);
            });
        }

        const selects = document.getElementById(formId).querySelectorAll('select');
        for (let select of selects) {
            select.addEventListener('change', function (e) {
                validateInput(this);
            });
        }
    }
    function validateFormOnClickButton(formId) {
        const frmShipping = document.getElementById(formId);
        if (frmShipping) {
            var inputs = frmShipping.querySelectorAll('input, textarea');
            if (inputs && inputs.length > 0) {
                for (let input of inputs) {
                    validateInput(input);
                }
            }
        }

        const selects = frmShipping.querySelectorAll('select');
        for(let select of selects) {
            validateInput(select);
        }

        const inputValid = frmShipping.querySelector('input.input-error') ? false : true;
        const selectValid = frmShipping.querySelector('select.input-error') ? false : true;
        const validCaptcha = frmShipping.querySelector('#input_RecaptchaField').value ? true : false;
        if (!validCaptcha) {
            document.querySelector('.captcha-error-message').classList.remove('hidden');
        } else {
            document.querySelector('.captcha-error-message').classList.add('hidden');
        }

        return (inputValid && selectValid && validCaptcha);
    }
    // End Form
    function getQueryParameter(param) {
        let href = '';
        if (location.href.indexOf('?')) {
            href = location.href.substr(location.href.indexOf('?'));
        }

        const value = href.match(new RegExp('[\?\&]' + param + '=([^\&]*)(\&?)', 'i'));
        return value ? value[1] : null;
    }

    function resetReCaptcha(formId) {
        try {
            document.querySelector(".preloading-wrapper").style.display = "none";
            document.querySelector(".preloading-wrapper").style.opacity = 0;

            const frmShipping = document.getElementById(formId);
            frmShipping.querySelector('#input_RecaptchaField').value = '';
            if(grecaptcha) {
                grecaptcha.reset();
            }
        }
        catch(e) {}
    }

    function handleUploadFiles() {
        const form = document.forms.namedItem("frmProductRepair");
        const url = 'https://dfoglobal-prod-pwrsystem-microservice.azurewebsites.net/api/productreviewproofs?code=e0f06eaf-2a52-44d7-b461-d22395a46042';
        const formData = new FormData(form);
        formData.set("X_BODY", `{"id": "${getQueryParameter('id')}"}`);

        /*
        const request = new XMLHttpRequest();
        request.open('POST', url, true);
        request.onload = function(oEvent) {
            if (request.status == 200) {
                console.log('Uploaded!');
            }
            else {
                console.log('Error ' + request.status + ' occurred when trying to upload your file.');
            }
        };
        request.send(formData);
        */

        document.querySelector(".preloading-wrapper").style.display = "block";
        document.querySelector(".preloading-wrapper").style.opacity = 0.8;

        //*
        fetch(url, {
            body: formData,
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data.message);
            if (data.message) {
                document.querySelector('.confirm h2').textContent = data.message;
            }
            document.querySelector('.productRepair').classList.add('hidden');
            document.querySelector('.confirm').classList.remove('hidden');
            resetReCaptcha('frmProductRepair');

            document.querySelector('body').classList.add('confirm-view');
        })
        .catch((error) => {
            console.log('Error:', error);
            alert('Submit failed, please try again.');
            resetReCaptcha('frmProductRepair');
        })
        //*/
    }
    function submitEvent() {
        document.getElementById('btn_submit').addEventListener('click', (e) => {
            const isValidForm = validateFormOnClickButton('frmProductRepair');
            e.preventDefault();

            if (isValidForm) {
                handleUploadFiles();
            }
        });
    }
    function listener() {
        onChangeFiles();
        submitEvent();
    }
    function init() {
        validateFormElms('frmProductRepair');
    }
    window.addEventListener('DOMContentLoaded', () => {
        init();
        listener();
    });
})();
