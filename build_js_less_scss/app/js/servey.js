function defineRules() {
    $('[name="user"]').rules("add", {
        required: true
    });

    $('[name="brandName"]').rules("add", {
        required: true,
        minlength: 3,
        maxlength: 4,
        messages: {
            required: "This field is required.",
            minlength: jQuery.validator.format("Please choose at least {0} items"),
            maxlength: jQuery.validator.format("Please choose no more {0} items")
        }
    });
}
function getCheckboxValues(elms) {
    const arr = [];
    elms.each(function(idx, elm) {
        arr.push($(elm).closest('.container').find('img').attr('alt').trim());
    });
    return arr;
}
function initValidate(formElm) {
    const validator = formElm.validate();
    validator.destroy();
    formElm.each(function(idx, elm) {
        $(elm).validate({
            errorPlacement: function (error, element) {
                if ($(element).closest('.checkbox-list-1').length) {
                    element.closest('.checkbox-list-1')[0].insertAdjacentElement('beforebegin', error[0]);
                } else if ($(element).closest('.checkbox-list').length) {
                    error.insertAfter(element.closest('.checkbox-list'));
                } else {
                    error.insertAfter(element);
                }
            }
        });
    });
    defineRules();
}
function registerButtonFunc() {
    $('.btn-register').off('click').on('click', function() {
        $('.landing').addClass('hidden');
        $('.step-1').removeClass('hidden');
        window.scrollTo(0, 0);
        initValidate($('.step-1 form'));
    });
}
function handleUserCheckbox() {
    $('[name="user"]').attr('type', 'radio');
}
function handleErr() {
    alert('Something wrong! Please try again.');
    $('.step-2, .step-3, .thank-you').addClass('hidden');
    $('.step-1').removeClass('hidden');
    window.ctrwowUtils.hideGlobalLoading();
}
function submitDataFnc(data) {
    try {
        console.log(data);
        const url = 'https://dfoglobal-prod-pwrsystem-microservice.azurewebsites.net/api/contestregistrations'
        window.ctrwowUtils.showGlobalLoading();
        const postData = {
            method: 'POST',
            'Content-Type': 'application/json',
            body: JSON.stringify(data)
        }
        window.ctrwowUtils
        .callAjax(url, postData)
        .then((result) => {
            console.log(result);
            $('.step-3').addClass('hidden');
            $('.thank-you').removeClass('hidden');
            window.scrollTo(0, 0);
            window.ctrwowUtils.hideGlobalLoading();
        }).catch((e) => {
            handleErr();
        })
    } catch(e) {
        handleErr();
    }
}
function handleFirstStep() {
    window.PubSub.subscribe('firstStep', (msg, data) => {
        $('.step-1').addClass('hidden');
        $('.step-2').removeClass('hidden');
        window.scrollTo(0, 0);
        initValidate($('.step-2 form'));
    });
}
function handleSecondStep() {
    const generateThirdStepForms = function(names) {
        for(let i = 0, n = names.length; i < n; i++) {
            const name = names[i];
            if (i === 0) {
                $('.step-3 form').find('.product-name').text(name);
                $('.step-3 form textarea').off('keyup');
            } else {
                const tmp = $('.step-3 form:first').clone();
                tmp.find('.product-name').text(name);
                tmp.attr('name', tmp.attr('name') + '_' + i).attr('id', tmp.attr('id') + '_' + i);
                $('.step-3 form:last').after(tmp);
            }
        }
    };
    window.PubSub.subscribe('secondStep', (msg, data) => {
        $('.step-2').addClass('hidden');
        $('.step-3').removeClass('hidden');
        window.scrollTo(0, 0);

        const names = getCheckboxValues($('[name="brandName"]:checked'));
        generateThirdStepForms(names);
        initValidate($('.step-3 form'));
    });
}
function handleThirdStep() {
    window.PubSub.subscribe('submitEntry', (msg, data) => {
        // Custom firstStepForm Obj
        data.firstStepForm['user'] = $('[name="user"]:checked').closest('label').text().trim();

        // Custom secondStepForm Obj
        const names = getCheckboxValues($('[name="brandName"]:checked'));
        data.secondStepForm['brandName'] = names;

        let submitData = Object.assign(data.firstStepForm, data.secondStepForm);

        delete data.firstStepForm;
        delete data.secondStepForm;

        // Custom thirsStepForm Objs
        const surveys = [];
        const entries = Object.entries(data);
        for (let [index, [key, value]] of entries.entries()) {
            value.brandName = submitData.brandName[index];
            surveys.push(value);
        }

        delete submitData.brandName;

        submitData = Object.assign(submitData, {
            'brandInfo': surveys
        });
        submitDataFnc(submitData);
    });
}
function init() {
    handleFirstStep();
    handleSecondStep();
    handleThirdStep();
}
function listener() {
    registerButtonFunc();
    handleUserCheckbox();
}

window.addEventListener('DOMContentLoaded', () => {
    window.ctrwowUtils.getDependencies(['https://cdnjs.cloudflare.com/ajax/libs/pubsub-js/1.7.0/pubsub.min.js']).then(() => {
        init();
        listener();
    });
});
