let gatewaySettings = {};

// for local testing 
// const DOMAIN = "http://localhost:3000";
const DOMAIN = process.env.ENV_DOMAIN ? process.env.ENV_DOMAIN : "https://app.thebookingfactory.com";

function validatePaymentIntent(paymentIntent) {
  let timeoutId;

  const validate = () => {
    // Clear any existing timeout before making a new request
    clearTimeout(timeoutId);

    return fetch(`${DOMAIN}/api/public/v1/validate_payment_intent?payment_intent_id=${paymentIntent}`, {
      method: 'GET',
      headers: {
        'Token': gatewaySettings.apiKey,
        'Content-Type': 'application/json'
      },
    }).then(response => {
      const { status } = response;
      if (status === 304) {
        // Payment intent is still processing, poll again after 6 seconds
        timeoutId = setTimeout(validate, 6000);
      } else {
        response.json().then(data => {
          const { success } = data;
          if (status === 200 && success === true) {
            // Payment intent is valid
            if (gatewaySettings.onThreeDSecureSuccess && typeof(gatewaySettings.onThreeDSecureSuccess) === 'function') {
              gatewaySettings.onThreeDSecureSuccess(data);
            }
          } else {
            // Payment intent validation failed
            console.error('Payment intent validation failed.');
            if (gatewaySettings.onThreeDSecureFail && typeof(gatewaySettings.onThreeDSecureFail) === 'function') {
              gatewaySettings.onThreeDSecureFail(data);
            }
          }
        });
      }
    }).catch(error => {
      console.error('Error validating payment intent:', error);
      if (gatewaySettings.onThreeDSecureFail && typeof(gatewaySettings.onThreeDSecureFail) === 'function') {
        gatewaySettings.onThreeDSecureFail({ message: error.message || 'Error validating payment intent.' });
      }
      throw error; // Propagate the error
    });
  };

  // Start initial validation
  timeoutId = setTimeout(validate, 0);
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
  return fetch(`${DOMAIN}/api/public/v1/stripe_three_d_secure_form?hotel_id=${gatewaySettings.hotel_id}&state_token=${gatewaySettings.state_token}&only_tokenize_card=${gatewaySettings.onlyTokenizeCard}&request_form=${gatewaySettings.requestForm}&token=${gatewaySettings.booking_token}`, {
    method:  'GET',
    headers: {
      'Token': gatewaySettings.apiKey,
      'Content-Type': 'application/json'
    },
  })
  .then(response => {
    const { status } = response;
    return response.json().then(data => {
      if (status === 400 && data.error) {
        return gatewaySettings.onThreeDSecureFail(data);
      }
      if (status === 200 && data.success === true) {
        if (data.hasOwnProperty('redirect_url') && data.redirect_url.length > 0) {
          validatePaymentIntent(gatewaySettings.payment.paymentIntentId)
          return showThreeDForm(data);
        }

        if (data.hasOwnProperty('three_d_secure_data') && data.three_d_secure_data === true) {
          return gatewaySettings.onThreeDSecureSuccess(data);
        }

        return gatewaySettings.onThreeDSecureFail(data);
      }

      if (status === 200 && data.success === false) {
        return gatewaySettings.onThreeDSecureFail(data);
      }
    });
  }).catch(error => {
    console.error('Error fetching Stripe data:', error);
    throw error; // propagate the error
  });
}

export default class {
  constructor(settings) {
    gatewaySettings = {
      ...settings,
      postfix: (new Date()).getTime()
    };
  }

  showThreeDForm = showThreeDForm
  fetchStripeData = fetchStripeData
}