import Utils from '../common/utils.js';
import CartActions from '../common/cartActions.js';

class ProductList {
    constructor() {
        this.cartActions = new CartActions();
        this.ecommjs = new EcommJS({
            webkey: siteSetting.WEBKEY,
            cid: siteSetting.CID
        });
    }

    getProducts() {
        this.ecommjs.Campaign.getProducts((err, result) => {
            if(err != null) {
                console.log(err);
                return;
            }

            if (result && result.prices) {
                this.products = result.prices;
                localStorage.setItem('countryCode', result.location.countryCode);
                localStorage.setItem('ctr__ecom_campaigns', JSON.stringify(result)); /* Chinh added */
                this.bindProducts(result.prices);
            }
        });
    }

    bindProducts(products) {
        const hdfProductIds = document.querySelectorAll('.js-productlist .productId');
        for (let item of hdfProductIds) {
            const product = Utils.getObjectFromArray('productId', item.value, products);
            if (!product) return;
            //full price
            const fullPriceElem = item.parentNode.querySelector('.js-full-price');
            if (fullPriceElem) {
                fullPriceElem.innerHTML = product.productPrices.FullRetailPrice.FormattedValue;
            }
            //discounted price
            const discountedPriceElem = item.parentNode.querySelector('.js-discounted-price');
            if (discountedPriceElem) {
                discountedPriceElem.innerHTML = product.productPrices.DiscountedPrice.FormattedValue;
            }

            //discounted price for hidden field
            const hdfDiscountedPrice = item.parentNode.querySelector('.discountedPrice');
            if (hdfDiscountedPrice) {
                hdfDiscountedPrice.value = product.productPrices.DiscountedPrice.Value;
            }

            //formatted discounted price
            const hdfFormattedDiscountedPrice = item.parentNode.querySelector('.formattedDiscountedPrice');
            if (hdfFormattedDiscountedPrice) {
                hdfFormattedDiscountedPrice.value = product.productPrices.DiscountedPrice.FormattedValue;
            }

            const shippingValue = item.parentNode.querySelector('.shippingValue');
            if(!!shippingValue) shippingValue.value = product.shippings[0].price;

            //shippingMethodId
            const shippingMethodId = item.parentNode.querySelector('.shippingMethodId');
            if (shippingMethodId) {
                shippingMethodId.value = product.shippings[0].shippingMethodId;
            }

            //sku
            const sku = item.parentNode.querySelector('.mainProductSku');
            if (sku) {
                sku.value = product.sku;
            }
        }
    }

    bindEventAddProductToCart() {
        const addToCartButtons = document.querySelectorAll('.btn-add-to-cart');
        for (let button of addToCartButtons) {
            button.addEventListener('click', e => {
                e.preventDefault();
                const parent = button.closest('.product-item');
                const product = this.getProductFromFE(parent);
                this.cartActions.addToCart(product);
                if(!!document.querySelector('.loading-wrap')) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }
    }

    getProductFromFE(parentNode) {
        return {
            productId: parentNode.querySelector('.productId').value,
            productName: parentNode.querySelector('.productName').value,
            productSubTitle: parentNode.querySelector('.productSubTitle').value,
            productUrl: parentNode.querySelector('.productUrl').value,
            productImageUrl: parentNode.querySelector('.productImageUrl').value,
            discountedPrice: parentNode.querySelector('.discountedPrice').value,
            formattedPrice: parentNode.querySelector('.formattedDiscountedPrice').value,
            quantity: parentNode.querySelector('.productQuantity') ? Number(parentNode.querySelector('.productQuantity').value) : 1,
            shippingMethodId: parentNode.querySelector('.shippingMethodId').value,
            shippingValue: parentNode.querySelector('.shippingValue') ? parentNode.querySelector('.shippingValue').value : '',
            titleProductName: parentNode.querySelector('.titleProductName') ? parentNode.querySelector('.titleProductName').innerText : '',//update
            sku: parentNode.querySelector('.mainProductSku') ? parentNode.querySelector('.mainProductSku').value : ''
        }
    }

    initSlider() {
        if (window.jQuery && $.fn.slick) {
            const sliders = document.querySelectorAll('.slick-productlist');
            for (let slider of sliders) {
                if (window.innerWidth > 991) {
                    if (slider.querySelectorAll('.slide-item').length <= slider.dataset.desktopitem) {
                        const sliderControls = slider.parentNode.querySelector('.slick-controls');
                        if (sliderControls) {
                            sliderControls.classList.add('hidden');
                        }
                        continue;
                    }
                }
                $(slider).slick({
                    slidesToShow: Number(slider.dataset.desktopitem),
                    dots: slider.dataset.slickdots === 'true' ? true : false,
                    //infinite: slider.classList.contains('no-loop-slider') ? false : true, //update,
                    autoplay: slider.dataset.autoplay === 'true' ? true : false,
                    autoplaySpeed: slider.dataset.autoplayspeed,
                    nextArrow: slider.parentNode.querySelector('.slick-next'),
                    prevArrow: slider.parentNode.querySelector('.slick-prev'),
                    //update option
                    rows: Number(slider.dataset.rowsdesktopitem),
                    slidesToScroll: Number(slider.dataset.slidestoscrolldesktop),
                    lazyLoad: 'ondemand',
                    responsive: [
                        {
                            breakpoint: 991,
                            settings: {
                                slidesToShow: Number(slider.dataset.tabletitem),
                                rows: Number(slider.dataset.rowstabletitem),
                                slidesToScroll: Number(slider.dataset.slidestoscrolltablet),
                                //infinite: slider.classList.contains('no-loop-slider') ? false : true, //update
                                dots: true
                            }
                        },
                        {
                            breakpoint: 767,
                            settings: {
                                slidesToShow: Number(slider.dataset.mobileitem),
                                rows: Number(slider.dataset.rowsmobileitem),
                                slidesToScroll: Number(slider.dataset.slidestoscrollmobile),
                                //infinite: slider.classList.contains('no-loop-slider') ? false : true, //update
                                dots: slider.dataset.showdotsonmobile === 'true' ? true : false
                            }
                        }
                    ]
                });

                var bLazy_carousel = new Blazy({
                    container: '.slick-productlist', // Default is window
                    selector: '.c-lazy',
                    loadInvisible: true
                });

                // Revalidate on change
                $(slider).on('afterChange', function (event, slick, direction) {
                    bLazy_carousel.revalidate();
                });
            }
        }
    }

    init() {
        this.getProducts();
        document.addEventListener('DOMContentLoaded', () => {
            this.bindEventAddProductToCart();
            this.initSlider(); // update after load then call
            Utils.loadLazyImages(); //call again lazyload
        });
    }
}

const productList = new ProductList();
productList.init();
