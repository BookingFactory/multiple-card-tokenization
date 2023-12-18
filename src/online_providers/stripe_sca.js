import * as Sentry from "@sentry/browser";
let gatewaySettings = {};

// for local testing 
const DOMAIN = "http://localhost:3000";
// const DOMAIN = process.env.ENV_DOMAIN ? process.env.ENV_DOMAIN : "https://app.thebookingfactory.com";
// export default {
//   handleOnlinePayment: ({ settings, payment, onlyTokenizeCard, apiKey, hotel_id, state_token}) => {
//     const token = settings.token;
//     const { clientSecret, paymentIntentId, paymentMethodId } = payment;
//     const stripe = window.Stripe(token);
//     let paymentPromise = Promise.resolve();
//     if (onlyTokenizeCard) {
//       paymentPromise = stripe.handleCardSetup(clientSecret).then((result) => {
//         if (result.error) {
//           return Promise.reject({
//             error: result.error,
//             message: result.error.message,
//           });
//         }

//         return ({
//           setup_intent_id: result.setupIntent.id,
//           payment_method_id: result.setupIntent.payment_method
//         })
//       }).catch(error => {
//         return {
//           error,
//           message: error.message,
//         };
//       });
//     } else {
//       // let timeout;

//       // function ensureStripeHookFetched() {
//       //   return new Promise(function (resolve, reject) {
//       //       (function waitForHookResponse(){
//       //         return fetch(`${DOMAIN}/api/public/v1/validate_payment_intent?payment_intent_id=${paymentIntentId}`, {
//       //           method:  'GET',
//       //           headers: {
//       //             'Token': apiKey,
//       //             'Content-Type': 'application/json'
//       //           },
//       //         })
//       //           .then(response => {
//       //             return response.json().then(data => ({
//       //               status: response.status,
//       //               data
//       //             }));
//       //           })
//       //           .then(response => {
//       //             const { data, status } = response;
//       //             if (timeout) {
//       //               clearTimeout(timeout);
//       //             }
//       //             if (status == 400 && data.error) {
//       //               return reject({
//       //                 error: data.error,
//       //                 message: data.error.message,
//       //               });
//       //             }
//       //             if (status == 404 && data.error) {
//       //               timeout = setTimeout(waitForHookResponse, 10000);
//       //             }
//       //             if (status == 200 && data.data) {
//       //               Sentry.captureMessage('Result of validatePaymentIntent', {extra: data});
//       //               return resolve({
//       //                 payment_intent_id: data.data.id,
//       //                 payment_method_id: data.data.payment_method
//       //               });
//       //             }
//       //           });
//       //       })();
//       //   });
//       // }

//       // const confirmCardPayment = stripe.confirmCardPayment(clientSecret).then((result) => {
//       //   Sentry.captureMessage('Result of confirmCardPayment', {extra: result});
//       //   if (result.error) {
//       //     return Promise.reject({
//       //       error: result.error,
//       //       message: result.error.message,
//       //     });
//       //   }

//       //   return ({
//       //     payment_intent_id: result.paymentIntent.id,
//       //     payment_method_id: result.paymentIntent.payment_method
//       //   });
//       // }).catch(error => {
//       //   return {
//       //     error,
//       //     message: error.message,
//       //   };
//       // });
//       // const validatePaymentIntent = ensureStripeHookFetched();
//       // paymentPromise = Promise.race([confirmCardPayment, validatePaymentIntent]);
//       showThreeDForm(hotel_id, state_token);
//     }
//     return paymentPromise;
//   }
// }

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

function showThreeDForm (id, state_token) {
  const formHolder = document.getElementById('3dsForm');
  var hide_or_show = (gatewaySettings.onlyTokenizeCard) ? "100%" : "0%"
  formHolder.style.height = '600px';
  formHolder.style.paddingBottom = '10px';
  formHolder.innerHTML = `
  <iframe width="100%"
    height="100%"
    frameborder="0"
    border="0"
    id="three_d_secure_form"
    src="${DOMAIN}/api/public/v1/stripe_three_d_secure_form?&hotel_id=${id}&state_token=${state_token}&only_tokenize_card=${gatewaySettings.onlyTokenizeCard}">
    </iframe>`;
} ;


export default class {
  constructor(settings) {
    gatewaySettings = {
      ...settings,
      postfix: (new Date()).getTime()
    };

    _initializeScripts();
  }

  showThreeDForm = showThreeDForm
}