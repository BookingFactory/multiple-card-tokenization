import * as Sentry from "@sentry/browser";
let gatewaySettings = {};

// for local testing 
const DOMAIN = "http://localhost:3000";
// const DOMAIN = process.env.ENV_DOMAIN ? process.env.ENV_DOMAIN : "https://app.thebookingfactory.com";

function _initializeScripts() {
  if (window.addEventListener) {
    window.addEventListener('message', windowEventHandler);
  } else if (window.attachEvent) {
    window.attachEvent('message', windowEventHandler);
  }
}

function windowEventHandler(event) {
  var isThreeDSecure = event && event.data && event.data.hasOwnProperty('three_d_secure_data');

  if (event.data) {
    var status = event.data.success;
    var message = event.data.message;

    if (isThreeDSecure) {
      // handle Stripe SCA 3DS event
      const threeDSecureData = event.data;

      if (status === true) {
        console.log("IT WORKS!");
        if (gatewaySettings.onThreeDSecureSuccess && typeof(gatewaySettings.onThreeDSecureSuccess) === 'function') {
          gatewaySettings.onThreeDSecureSuccess(threeDSecureData);
        }
      } else {
        console.log("IT DOESN'T WORK");
        if (gatewaySettings.onThreeDSecureFail && typeof(gatewaySettings.onThreeDSecureFail) === 'function') {
          gatewaySettings.onThreeDSecureFail(threeDSecureData);
        }
      }
    } else {
      if (status !== undefined && status !== true) {
        console.log("SOMETHING REALY BAD");
        // if (gatewaySettings.onError && typeof(gatewaySettings.onError) === 'function' && message) {
        //   gatewaySettings.onError(message);
        // }
        if (message) {
          alert(message);
        }
      }
    }
  }
}

function showThreeDForm (data) {
  const url = data.redirect_url
  const iframe = data.iframe
  const formHolder = document.getElementById('3dsForm');
  const threeDSModal = document.getElementsByClassName('ThreeDSModal');
  formHolder.style.height = '600px';
  formHolder.style.paddingBottom = '10px';

  if  (iframe != undefined && iframe === false) {
    formHolder.style.display = "none";
    threeDSModal[0].style.display = "none";
  }

  formHolder.innerHTML = `
  <iframe width="100%"
    height="100%"
    frameborder="0"
    border="0"
    id="three_d_secure_form"
    src="${url}">
    </iframe>`;
};

function fetchStripeData() {
    fetch(`${DOMAIN}/api/public/v1/stripe_three_d_secure_form?hotel_id=${gatewaySettings.hotel_id}&state_token=${gatewaySettings.state_token}&only_tokenize_card=${gatewaySettings.onlyTokenizeCard}&request_form=${gatewaySettings.requestForm}&token=${gatewaySettings.booking_token}`, {
      method:  'GET',
      headers: {
        'Token': gatewaySettings.apiKey,
        'Content-Type': 'application/json'
      },
    }).then(response => {
      return response.json().then(data => ({
        status: response.status,
        data
      }));
    }).then(response => {
      const { data, status } = response;
      if (status == 400 && data.error) {
        return gatewaySettings.onThreeDSecureFail(data);
      }

      if (status == 200 && data.success == true && data.hasOwnProperty('redirect_url') && data.redirect_url.length > 0) {
        return showThreeDForm(data)
      }

      if (status == 200 && data.success === true && data.hasOwnProperty('three_d_secure_data') && data.three_d_secure_data === true) {
        return gatewaySettings.onThreeDSecureSuccess(data);
      }

      // TODO: Maybe another handler if noone above matches? Safe fail?
      if (status == 200 && data.success == false) {
        return gatewaySettings.onThreeDSecureFail(data);
      }
    });
};

export default class {
  constructor(settings) {
    gatewaySettings = {
      ...settings,
      postfix: (new Date()).getTime()
    };

    _initializeScripts();
  }

  showThreeDForm = showThreeDForm
  fetchStripeData = fetchStripeData
}