//using es6-promise and isomorphic-fetch just for build tool
try {
    require('es6-promise').polyfill();
    require('isomorphic-fetch');
} catch(err) {
    //console.log(err);
}

import Utils from '../common/utils.js';

class Orders {
    constructor() {
        this.authToken = localStorage.getItem('authToken');
        this.orders = null;
        this.totalPrice = 0;
        this.address = '';
    }

    bindCheckoutSummary() {
        const summaryDate = document.getElementById('summary-date');
        if(summaryDate) {
            summaryDate.innerText = new Date(this.orders[0].createDate).toDateString();
        }

        const summaryPrice = document.getElementById('summary-price');
        if(summaryPrice) {
            summaryPrice.innerText = '$' + this.totalPrice.toFixed(2);
        }

        const summaryAddress = document.getElementById('summary-address');
        if(summaryAddress) {
            summaryAddress.innerText = this.address;
        }
    }

    async bindOrders() {
        //console.log(this.orders);
        const htmlItem = document.querySelector('.orders-products-container');
        if(!htmlItem) return;

        const tmp = `<div class="orders-products-container">
                        ${htmlItem.innerHTML}
                    </div>`;

        let product, productItem = '', listItems = '', productOrderInit = '', imglocal;
        productOrderInit = productOrder ? productOrder : '';
        for(let item of this.orders) {
            //fetch product by orderId to get price
            imglocal = false;
            const options = {
                headers: {
                    'Authorization': 'Bearer ' + this.authToken,
                    'X_CID': siteSetting.CID
                }
            }
            const res = await fetch(`https://emanage-prod-csm-api.azurewebsites.net/order/${item.orderId}`, options);
            if(res.ok) {
                const product = await res.json();

                if(productOrderInit && productOrderInit.length > 1){
                    for(let product of productOrderInit) {
                        if(item.productId == Number(product.id)) {
                            productItem = tmp.replace(`src="${siteSetting.placeholderimage}"`, `src="${product.img}"`);
                            imglocal = true;
                            break;
                        }
                    }
                }
                if(!imglocal)
                    productItem = tmp.replace(`src="${siteSetting.placeholderimage}"`, `src="https://tplwebapi.azurewebsites.net/product/${item.sku}/image"`); //get image from tpl
                productItem = productItem.replace('srcset=""', `srcset="/pub-assets/fileuploads/images/product/productId_${item.productId}.png"`);
                productItem = productItem.replace(/{productName}/g, item.productName);
                productItem = productItem.replace('{productStatus}', item.orderStatus);
                productItem = productItem.replace('{productDate}', new Date(item.createDate).toDateString());
                productItem = productItem.replace('{productPrice}', '$' + product.orderPriceUSD);
                productItem = productItem.replace('{orderId}', item.orderId);
                productItem = productItem.replace('{orderNumber}', item.orderNumber);

                this.totalPrice += Number(product.orderPriceUSD);
                if(this.address === '') {
                    this.address = product.address.address1 + ', ' + product.address.city + ', ' + product.address.countryName;
                }
                listItems += productItem;
            } else {
                console.log('Can not fetch order detail with order id: ' + item.orderId);
            }
        }

        this.bindCheckoutSummary();
        document.getElementById('products').innerHTML = listItems;
        //update
        if(!!document.querySelector('.loading-wrap'))
            document.querySelector('.loading-wrap').classList.remove('active');
        else Utils.hideAjaxPageLoading();
        //end update
        this.requestRefund();
        this.submitRefund();
    }

    requestRefund() {
        const requestButtons = document.querySelectorAll('.btn-request-refund');
        for(let item of requestButtons) {
            item.addEventListener('click', e => {
                e.preventDefault();
                item.parentNode.classList.add('hidden');
                const parent = item.closest('.single-product-btn');
                parent.querySelector('.js-request-area-wrapper').classList.remove('hidden');
                parent.querySelector('.js-submit-btn-wrapper').classList.remove('hidden');
            });
        }
    }

    submitRefund() {
        const submitRefundButtons = document.querySelectorAll('.btn-submit-request');
        for(let item of submitRefundButtons) {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const parent = item.closest('.orders-products-container');
                const text = parent.querySelector('.message-textarea').value;

                //validate empty
                if(text.trim() === '') {
                    alert('Please enter content before submit.');
                    return;
                }

                //update
                if(!!document.querySelector('.loading-wrap'))
                    document.querySelector('.loading-wrap').classList.add('active');
                else Utils.showAjaxPageLoading(true);
                //end update

                const orderIdElem = parent.querySelector('.orderId');
                let orderId, orderNumber;
                if(orderIdElem) {
                    orderNumber = orderIdElem.innerText;
                    orderId = orderIdElem.dataset.orderid;
                }

                const options = {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + this.authToken,
                        'Content-Type': 'application/json',
                        'X_CID': siteSetting.CID
                    },
                    body: JSON.stringify({
                        subject: 'Leavenoprint Customer Service Request Refund ' + orderNumber,
                        body: `<p>Requested a refund through ${location.hostname}</p><p>Order ID: ${orderNumber}</p><p>${text}</p>`
                    })
                }

                const res = await fetch(`https://emanage-prod-csm-api.azurewebsites.net/ticket/${orderId}/new`, options);
                if(res.ok) {
                    //update
                    if(!!document.querySelector('.loading-wrap'))
                        document.querySelector('.loading-wrap').classList.remove('active');
                    else Utils.hideAjaxPageLoading();
                    //end update
                    parent.querySelector('.js-request-area-wrapper').classList.add('hidden');
                    parent.querySelector('.js-submit-btn-wrapper').classList.add('hidden');
                    alert('Your message has been sent!');
                } else {
                    //update
                    if(!!document.querySelector('.loading-wrap'))
                        document.querySelector('.loading-wrap').classList.remove('active');
                    else Utils.hideAjaxPageLoading();
                    //end update
                    alert('Error, unable to complete your request at this time.');
                }
            });
        }
    }

    init() {
        Utils.showMenuByAuth();
        if(!!document.querySelector('.loading-wrap'))
            document.querySelector('.loading-wrap').classList.add('active');
        else Utils.showAjaxPageLoading(true); //update
        Utils.checkExpire().then(result => {
            this.orders = result;
            if(result && result.length > 0) {
                this.bindOrders();
            } else {
                document.querySelector('.your-order-info').classList.add('hidden');
                document.getElementById('products').classList.add('hidden');
                document.querySelector('.no-item').classList.remove('hidden');
                if(!!document.querySelector('.loading-wrap'))
                    document.querySelector('.loading-wrap').classList.remove('active');
                else Utils.hideAjaxPageLoading(); //update
            }
        }).catch(err => console.log(err));
        Utils.signOut();
    }
}

const orders = new Orders();
orders.init();