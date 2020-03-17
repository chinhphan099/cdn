import { constants } from '../common/constant.js';
import Utils from '../common/utils.js';

class Success {
    constructor() {
        this.ecommjs = new EcommJS({
            webkey: siteSetting.WEBKEY,
            cid: siteSetting.CID
        });
    }

    checkPaypalApprove() {
        this.ecommjs.Checkout.checkPaypalApprove((err, result) => {
            if(err != null) {
                Utils.redirectPage(constants.DECLINE_URL);
                return;
            }

            if(result && result.success) {
                let confirmUrl = constants.CONFIRM_URL;
                const paramsForConfirmPage = localStorage.getItem('paramsForConfirmPage');
                if(paramsForConfirmPage) {
                    confirmUrl += confirmUrl.indexOf('?') > 0 ? '&' + paramsForConfirmPage : '?' + paramsForConfirmPage;
                }
                Utils.redirectPage(confirmUrl);
            }
        });
    }
}

const success = new Success();
success.checkPaypalApprove();
