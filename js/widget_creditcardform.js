(function (utils) {
    function checkCreditCard(cardnumber, cardname) {
        var ccErrorNo = 0;
        var ccErrors = [];
        ccErrors[0] = "Unknown card type";
        ccErrors[1] = "No card number provided";
        ccErrors[2] = "Credit card number is in invalid format";
        ccErrors[3] = "Credit card number is invalid";
        ccErrors[4] = "Credit card number has an inappropriate number of digits";
        ccErrors[5] = "Warning! This credit card number is associated with a scam attempt";

        var cards = new Array();
        cards[0] = {
            name: "Visa",
            length: "13,16",
            prefixes: "4",
            checkdigit: true
        };
        cards[1] = {
            name: "Master",
            length: "16",
            prefixes: "51,52,53,54,55",
            checkdigit: true
        };
        cards[2] = {
            name: "DinersClub",
            length: "14,16",
            prefixes: "36,38,54,55",
            checkdigit: true
        };
        cards[3] = {
            name: "CarteBlanche",
            length: "14",
            prefixes: "300,301,302,303,304,305",
            checkdigit: true
        };
        cards[4] = {
            name: "AmEx",
            length: "15",
            prefixes: "34,37",
            checkdigit: true
        };
        cards[5] = {
            name: "Discover",
            length: "16,17,18,19",
            prefixes: "6011,622,644,645,646,647,648,649,65",
            checkdigit: true
        };
        cards[6] = {
            name: "JCB",
            length: "16",
            prefixes: "35",
            checkdigit: true
        };
        cards[7] = {
            name: "enRoute",
            length: "15",
            prefixes: "2014,2149",
            checkdigit: true
        };
        cards[8] = {
            name: "Solo",
            length: "16,18,19",
            prefixes: "6334,6767",
            checkdigit: true
        };
        cards[9] = {
            name: "Switch",
            length: "16,18,19",
            prefixes: "4903,4905,4911,4936,564182,633110,6333,6759",
            checkdigit: true
        };
        cards[10] = {
            name: "Maestro",
            length: "12,13,14,15,16,18,19",
            prefixes: "5018,5020,5038,6304,6759,6761,6762,6763",
            checkdigit: true
        };
        cards[11] = {
            name: "VisaElectron",
            length: "16",
            prefixes: "4026,417500,4508,4844,4913,4917",
            checkdigit: true
        };
        cards[12] = {
            name: "LaserCard",
            length: "16,17,18,19",
            prefixes: "6304,6706,6771,6709",
            checkdigit: true
        };

        var cardType = -1;
        for (var i = 0; i < cards.length; i++) {
            if (cardname.toLowerCase() == cards[i].name.toLowerCase()) {
                cardType = i;
                break;
            }
        }
        if (cardType == -1) {
            ccErrorNo = 0;
            return false;
        }
        if (cardnumber.length == 0) {
            ccErrorNo = 1;
            return false;
        }
        cardnumber = cardnumber.replace(/\s/g, "");
        var cardNo = cardnumber;
        var cardexp = /^[0-9]{13,19}$/;
        if (!cardexp.exec(cardNo)) {
            ccErrorNo = 2;
            return false;
        }
        if (cards[cardType].checkdigit) {
            var checksum = 0;
            var mychar = "";
            var j = 1;
            var calc;
            for (i = cardNo.length - 1; i >= 0; i--) {
                calc = Number(cardNo.charAt(i)) * j;
                if (calc > 9) {
                    checksum = checksum + 1;
                    calc = calc - 10;
                }
                checksum = checksum + calc;
                if (j == 1) { j = 2 } else { j = 1 };
            }
            if (checksum % 10 != 0) {
                ccErrorNo = 3;
                return false;
            }
        }
        if (cardNo == '5490997771092064') {
            ccErrorNo = 5;
            return false;
        }
        var LengthValid = false;
        var PrefixValid = false;
        var undefined;
        var prefix = new Array();
        var lengths = new Array();
        prefix = cards[cardType].prefixes.split(",");
        for (i = 0; i < prefix.length; i++) {
            var exp = new RegExp("^" + prefix[i]);
            if (exp.test(cardNo)) PrefixValid = true;
        }
        if (!PrefixValid) {
            ccErrorNo = 3;
            return false;
        }
        lengths = cards[cardType].length.split(",");
        for (j = 0; j < lengths.length; j++) {
            if (cardNo.length == lengths[j]) LengthValid = true;
        }
        if (!LengthValid) {
            ccErrorNo = 4;
            return false;
        }
        return true;
    }

    function verifyCreditCard(cardnumber) {
        if (checkCreditCard(cardnumber, "Visa")) return "Visa";
        if (checkCreditCard(cardnumber, "Master")) return "Master";
        if (checkCreditCard(cardnumber, "AmEx")) return "AmEx";
        if (checkCreditCard(cardnumber, "Discover")) return "Discover";
        /*if (checkCreditCard(cardnumber, "DinersClub")) return "DinersClub";
        if (checkCreditCard(cardnumber, "CarteBlanche")) return "CarteBlanche";
        if (checkCreditCard(cardnumber, "JCB")) return "JCB";
        if (checkCreditCard(cardnumber, "enRoute")) return "enRoute";
        if (checkCreditCard(cardnumber, "Switch")) return "Switch";
        if (checkCreditCard(cardnumber, "Solo")) return "Solo";
        if (checkCreditCard(cardnumber, "Maestro")) return "Maestro";
        if (checkCreditCard(cardnumber, "VisaElectron")) return "VisaElectron";
        if (checkCreditCard(cardnumber, "LaserCard")) return "LaserCard";*/
    }

    function validateCreditCardNumber(input) {
        if (input.dataset.cardnumber != undefined && input.dataset.cardnumber !== '' && input.dataset.cardnumber.formatString('0000-****-****-0000') === input.value) {
            return;
        }

        var value = input.value.toString().replace(/\-/g, '');
        var cardType = verifyCreditCard(value);
        if (typeof cardType === 'undefined') {
            input.value = value.formatString('0000-0000-0000-0000-000');
            utils.addInputError(input);
            input.setAttribute('data-cardnumber', '');
            input.setAttribute('data-cardtype', '');
        } else {
            utils.removeInputError(input);
            input.setAttribute('data-cardnumber', value);
            input.setAttribute('data-cardtype', cardType);
            //input.value = value.formatString('0000-****-****-0000');
            input.value = value.formatString('0000-0000-0000-0000-000');
        }
    }

    //expiry date
    function validateExpireDate(input) {
        const formatString = '00/00';
        const value = input.value.toString().replace(/\-/g, '').replace(/\//g, '').substring(0, formatString.length);
        input.value = value.formatString(formatString);
        const values = input.value.toString().split("/");
        const d = new Date();
        const curYear = d.getFullYear().toString().substr(2);
        const curMonth = d.getMonth() + 1;
        if (values.length != 2) {
            utils.addInputError(input);
        } else if (parseInt(values[0]) < 0 || parseInt(values[0]) > 12) {
            utils.addInputError(input);
        } else if (parseInt(values[1]) < parseInt(curYear)) {
            utils.addInputError(input);
        } else if (parseInt(values[1]) === parseInt(curYear) && parseInt(curMonth) > parseInt(values[0])) {
            utils.addInputError(input);
        } else {
            utils.removeInputError(input);
        }
    }

    //cvv
    function validateCVV(input) {
        var value = input.value.toString().replace(/\-/g, '');
        if (value.length < 3 || value.length > 4) {
            utils.addInputError(input);
        }
        else {
            utils.removeInputError(input);
        }
    }

    function bindEvents() {
        //credit card number
        //utils.maskNumber(_qById('creditcard_creditcardnumber'), '0000-0000-0000-0000');

        _qById('creditcard_creditcardnumber').addEventListener('keyup', function () {
            validateCreditCardNumber(this);
            updateInstallmentPaymentSelectBox(this);
        });
        _qById('creditcard_creditcardnumber').addEventListener('blur', function () {
            validateCreditCardNumber(this);
            updateInstallmentPaymentSelectBox(this);
        });
        _qById('creditcard_creditcardnumber').addEventListener('change', function () {
            validateCreditCardNumber(this);
            updateInstallmentPaymentSelectBox(this);
        });

        //expire date
        utils.maskNumber(_qById('creditcard_expirydate'), '00/00');
        _qById('creditcard_expirydate').addEventListener('keyup', function () {
            validateExpireDate(this);
        });
        _qById('creditcard_expirydate').addEventListener('blur', function () {
            validateExpireDate(this);
        });
        _qById('creditcard_expirydate').addEventListener('change', function () {
            validateExpireDate(this);
        });

        //cvv
        _qById('creditcard_cvv').addEventListener('keyup', function () {
            validateCVV(this);
        });
        _qById('creditcard_cvv').addEventListener('blur', function () {
            validateCVV(this);
        });
        _qById('creditcard_cvv').addEventListener('change', function () {
            validateCVV(this);
        });

        //Name on card
        if(!!_qById('creditcard_nameoncard')) {
            _qById('creditcard_nameoncard').addEventListener('keyup', function () {
                utils.validateInput(this);
            });
            _qById('creditcard_nameoncard').addEventListener('blur', function () {
                utils.validateInput(this);
            });
            _qById('creditcard_nameoncard').addEventListener('change', function () {
                utils.validateInput(this);
            });
        }
    }

    //Installment payment : only for Brazil
    function updateInstallmentPaymentSelectBox(input) {
        var value = input.value.toString().replace(/\-/g, '');
        var cardType = verifyCreditCard(value);
        if(cardType === 'AmEx') {
            utils.events.emit('bindInstallmentWithAmexCard', 'amex');
        } else {
            utils.events.emit('bindInstallmentWithAmexCard', 'no_amex');
        }
    }

    function isValid() {
        let isValid = false;

        validateCreditCardNumber(_qById('creditcard_creditcardnumber'));
        validateExpireDate(_qById('creditcard_expirydate'));
        validateCVV(_qById('creditcard_cvv'));
        if(!!_qById('creditcard_nameoncard')) {
            utils.validateInput(_qById('creditcard_nameoncard'));
        }

        isValid = _q('#frmCreditCard input.input-error') ? false : true;

        return isValid;
    }

    function openCvvPopup() {
        const cvvQuestionIcon = _q('.widget-creditcard-form .icon-question-circle');
        if(!cvvQuestionIcon) return;

        cvvQuestionIcon.addEventListener('click', function(e) {
            e.preventDefault();
            const cvvpopup = _q('.cvv_popup_overlay');
            if(cvvpopup) {
                cvvpopup.classList.add('open');
            }
        });
    }

    function hideCvvPopup() {
        const popupOverlay = _q('.cvv_popup_overlay');
        popupOverlay.addEventListener('click', function(e) {
            if(e.target.closest('.cvv_popup_content')) return;
            popupOverlay.classList.remove('open');
        });

        popupOverlay.querySelector('.icon-close').addEventListener('click', function(e) {
            popupOverlay.classList.remove('open');
        });
    }

    utils.creditcardForm = {
        isValid: isValid
    }

    document.addEventListener('DOMContentLoaded', () => {
        bindEvents();
        openCvvPopup();
        hideCvvPopup();
    });
})(window.utils);
