(function (utils) {
    if (!utils) {
        console.log('modules is not found');
        return;
    }

    window.upsell_productindex = 0;

    let upsell = {
        orderInfo: JSON.parse(utils.localStorage().get('orderInfo')),
        products: [],
        mainWebKey: siteSetting.webKey,
        upsellWebKey: window.upsellWebKey,
        CID: siteSetting.CID
    };

    const eCRM = new EmanageCRMJS({
        webkey: upsell.mainWebKey,
        cid: upsell.CID,
        lang: '',
        isTest: utils.getQueryParameter('isCardTest') ? true : false
    });

    function replaceBracketsStrings() {              
        const allElements = _qAll('body *');
        for(let elem of allElements) {
            if(elem.children.length === 0 || elem.tagName.toLowerCase() === 'span') {                
                elem.innerHTML = elem.innerHTML.replace(/{price}/g, '<span class="spanUpsellPrice"></span>');
                elem.innerHTML = elem.innerHTML.replace(/{fullprice}/g, '<span class="spanFullPrice"></span>');
            }
        }                        
    }
    replaceBracketsStrings();

    function getProduct() {
        const eCRM2 = new EmanageCRMJS({
            webkey: upsell.upsellWebKey,
            cid: upsell.CID,
            lang: '',
            isTest: utils.getQueryParameter('isCardTest') ? true : false
        });
        
        eCRM2.Campaign.getProducts(function (products) {
            upsell.products = products.prices;
            console.log(products.prices);

            const spanUpsellPriceElems = _qAll('.spanUpsellPrice');
            for(let spanUpsellPrice of spanUpsellPriceElems) {
                spanUpsellPrice.innerHTML = products.prices[0].productPrices.DiscountedPrice.FormattedValue;
            }

            const spanFullPriceElems = _qAll('.spanFullPrice');
            for(let spanFullPrice of spanFullPriceElems) {
                spanFullPrice.innerHTML = products.prices[0].productPrices.FullRetailPrice.FormattedValue;
            }
        });
    }
    getProduct();

    function handleBasicUpsellCTAButton() {
        var tmp = JSON.parse(utils.localStorage().get('orderInfo'));
        if(tmp && tmp.paymentProcessorId == 5){
            const paymenttype = 'paypal';
            //set paypal sandbox(test) or production(live)
            var checkIsTest = utils.getQueryParameter('isCardTest') ? 'sandbox' : 'production';
            //get localeCode
			var countryCode = localStorage.getItem("countryCode");
			var localeCode = window._countriesPaypal.filter(x=>x.countryCode == countryCode).length > 0 ? window._countriesPaypal.filter(x=>x.countryCode == countryCode)[0].localeCode : "en_US";
			//check smart button or altinative button
			var paypalFundingAPMs = [paypal.FUNDING.ELV, paypal.FUNDING.CREDIT, paypal.FUNDING.CARD];
			if(localStorage.getItem("paypalOption") == "alternative-button"){
				paypalFundingAPMs = [
					paypal.FUNDING.BANCONTACT,
					paypal.FUNDING.EPS,
					paypal.FUNDING.GIROPAY,
					paypal.FUNDING.IDEAL,
					paypal.FUNDING.MYBANK,
					paypal.FUNDING.SOFORT
				];			
			}
            document.querySelectorAll('.js-btn-place-upsell-order').forEach(function(selector) {
                (selector.getElementsByTagName("button"))[0].classList.add("hidden");
                paypal.Button.render({
            		env: checkIsTest, // Or 'sandbox','production'
            		commit: true, // Show a 'Pay Now' button
            		locale: localeCode,
            		style: {
						size: 'responsive',
						color: 'gold',
						shape: 'rect',
						label: 'paypal',
						tagline: false,
						layout: 'vertical'
					},
					funding: {
						allowed: paypalFundingAPMs,
						disallowed: []
					},
            		payment: function() {
            		    const upsellData = getUpsellData();
            		    /*upsellData = eCRM.Order._beforeSubmitUpsellOrder(upsellData);
            		    var isCardTest = eCRM.isTest == true ? '?behaviorId=2' : ''; */
            		    
            		    if (!upsellData || upsellData === '') {
                            console.log('Please provide valid order data!');
                            return;
                        }
                        let url = eCRM.Order.baseAPIEndpoint+'/orders/'+upsell.upsellWebKey;
                        if (eCRM.isTest) {
                            if (url.indexOf('?') > 0) {
                                url += '&behaviorId=2';
                            } else {
                                url += '?behaviorId=2';
                            }
                        }
                        const postUpsellData = eCRM.Order._beforeSubmitUpsellOrder(upsellData);
            		    
            		    
            		    return paypal.request({
            		        method: 'post',
        					url: url,
        					json: postUpsellData,
        					headers: {
                                "X_CID": upsell.CID,
                            }
            		    }).then(function(result){
            		        if (result != null && result.success) {
                                utils.localStorage().set('paypal_isMainOrder', 'upsell');
                
                                saveInforForUpsellPage(result);
                                utils.localStorage().set('webkey_to_check_paypal', upsell.upsellWebKey);
                
                            } else {
                                handleLastUpsellOrError();
                            }
                            
                            return result.trackingNumber;
            		    });
            		},
            		
            		onAuthorize: function(data, actions) {
            			 window.location = data.returnUrl;
            		},
            		
            		onCancel: function(data, actions) {
            			 utils.redirectPage(siteSetting.declineUrl);
            		},
            		
            		onError: function(err) {
            			 utils.redirectPage(siteSetting.declineUrl);
            		}
            
            	}, selector);
            });
            
        }
        else{
            const ctaButtons = _qAll('.js-btn-place-upsell-order');
            if(ctaButtons) {
                Array.prototype.slice.call(ctaButtons).forEach(ele => {
                    ele.addEventListener('click', function (e) {
                        e.preventDefault();
                        placeUpsellOrder();
                    });
                });
            } 
        }
        _q('.js-btn-no-thanks').addEventListener('click', function (e) {
            e.preventDefault();
            cancelUpsellOrder();
        });
    }

    function placeUpsellOrder() {
        const upsellData = getUpsellData();

        utils.showAjaxLoading();

        eCRM.Order.placeUpsellOrder(upsellData, upsell.upsellWebKey, function (result) {
            // if (result != null && result.success) {
            //     utils.localStorage().set('paypal_isMainOrder', 'upsell');

            //     saveInforForUpsellPage(result);
            //     utils.localStorage().set('webkey_to_check_paypal', upsell.upsellWebKey);

            //     if (result.callBackUrl) {
            //         document.location = result.callBackUrl;
            //     } else if (result.paymentContinueResult && result.paymentContinueResult.actionUrl !== "") {
            //         document.location = result.paymentContinueResult.actionUrl;
            //     } else if (upsell.orderInfo.upsellIndex < upsell.orderInfo.upsells.length) {                    
            //         let upsellUrl = upsell.orderInfo.upsells[upsell.orderInfo.upsellIndex].upsellUrl;
            //         const redirectUrl = upsellUrl.substring(upsellUrl.lastIndexOf('/') + 1, upsellUrl.indexOf('?') >= 0 ? upsellUrl.indexOf('?') : upsellUrl.length);
            //         utils.redirectPage(redirectUrl + '?' + getUpParam());                    
            //     } else {
            //         handleLastUpsellOrError();
            //     }
            // } else {
            //     handleLastUpsellOrError();
            // }
            utils.saveInfoToLocalForUpsells(result, upsell);
        });
    }

    function getUpParam() {
        let upParam = '';
        if (location.href.split('special-offer-', 2).length > 1) {
            upParam = 'up_' + location.href.split('special-offer-', 2)[1].split('.html', 1) + '=1';
        }
        return upParam;
    }

    function handleLastUpsellOrError() {
        let upParam = '';
        if (location.href.split('special-offer-', 2).length > 1) {
            upParam = '?up_' + location.href.split('special-offer-', 2)[1].split('.html', 1);

            if (upsell.orderInfo.isUpsellOrdered == 1) {
                upParam += '=1';
            } else {
                upParam += '=0';
            }
        }

        let redirectUrl = siteSetting.successUrl;        
        utils.redirectPage(redirectUrl + upParam);
    }

    function saveInforForUpsellPage(orderResponse) {
        upsell.orderInfo.upsellIndex += 1;
        const savedOfUpsell = upsell.products[window.upsell_productindex].productPrices.FullRetailPrice.Value - upsell.products[window.upsell_productindex].productPrices.DiscountedPrice.Value;
        upsell.orderInfo.savedTotal += savedOfUpsell;
        upsell.orderInfo.isUpsellOrdered = 1;
        utils.localStorage().set('orderInfo', JSON.stringify(upsell.orderInfo));
    }    

    function getUpsellData() {
        let pay = {
            cardId: upsell.orderInfo.cardId
        };

        if (upsell.orderInfo.paymentProcessorId == "5") {
            pay = {
                paymentProcessorId: 5
            };
        }else{
			//add installment
			if (!!upsell.orderInfo.installmentValue && upsell.orderInfo.installmentValue !== ""){
				pay.Instalments = upsell.orderInfo.installmentValue;
			}
		}

        //add callback param to server to keep track
        let replacedParam = location.search.replace(/\?|\&*paymentId=[^&]*/g, '').replace(/\?|\&*token=[^&]*/g, '').replace(/\?|\&*PayerID=[^&]*/g, '');
        pay.callBackParam = replacedParam !== '' ? '?' + replacedParam + '&' + getUpParam() : '?' + getUpParam();

        let antiFraud;
        try {
            antiFraud = JSON.parse(utils.localStorage().get("antiFraud"));
        } catch (ex) {
            console.log(ex);
            antiFraud = null;
        }

        var upsellData = {
            campaignUpsell: {
                webKey: upsell.mainWebKey,
                relatedOrderNumber: upsell.orderInfo.orderNumber
            },
            shippingMethodId: upsell.products[window.upsell_productindex].shippings[0].shippingMethodId,
            comment: '',
            useShippingAddressForBilling: true,
            productId: upsell.products[window.upsell_productindex].productId,
            customer: { email: upsell.orderInfo.cusEmail },
            payment: pay,
            shippingAddress: upsell.orderInfo.addressId != null ? { id: upsell.orderInfo.addressId } : null,
            funnelBoxId: 0,
            antiFraud: {
                sessionId: antiFraud ? antiFraud.sessionId : ''
            }
        }

        return upsellData;
    }

    function cancelUpsellOrder() {
        //update localStorage
        upsell.orderInfo.isUpsellOrdered = 0;

        let upParam = '';
        if (location.href.split('special-offer-', 2).length > 1) {
            upParam = 'up_' + location.href.split('special-offer-', 2)[1].split('.html', 1) + '=0';
        }       

        upsell.orderInfo.upsellIndex += 1;
        utils.localStorage().set('orderInfo', JSON.stringify(upsell.orderInfo));

        if (upsell.orderInfo.upsellIndex < upsell.orderInfo.upsells.length) {
            let upsellUrl = upsell.orderInfo.upsells[upsell.orderInfo.upsellIndex].upsellUrl;
            const redirectUrl = upsellUrl.substring(upsellUrl.lastIndexOf('/') + 1, upsellUrl.indexOf('?') >= 0 ? upsellUrl.indexOf('?') : upsellUrl.length);
            utils.redirectPage(redirectUrl + '?' + upParam);
        } else {
            handleLastUpsellOrError();
        }
    }

    //Fire Cake Pixel
    utils.fireCakePixel();
    utils.fireEverFlow();
    utils.firePicksell();

	/*--------start : run common upsell------------*/
    const CommonUpsell = utils.CommonUpsell;
    class Upsell extends CommonUpsell {         
    }    
    const insUpsell = new Upsell();
    insUpsell.init();
    /*--------/end : run common upsell------------*/
	
    document.addEventListener('DOMContentLoaded', function () {
        handleBasicUpsellCTAButton();
    });
})(window.utils);