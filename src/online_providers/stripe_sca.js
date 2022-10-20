import * as Sentry from "@sentry/browser";
// for local testing 
// const DOMAIN = "http://localhost:3000";
const DOMAIN = process.env.ENV_DOMAIN ? process.env.ENV_DOMAIN : "https://app.thebookingfactory.com";
export default {
  handleOnlinePayment: ({ settings, payment, onlyTokenizeCard, apiKey}) => {
    const token = settings.token;
    const { clientSecret, paymentIntentId } = payment;
    const stripe = window.Stripe(token);
    let paymentPromise = Promise.resolve();

    if (onlyTokenizeCard) {
      paymentPromise = stripe.handleCardSetup(clientSecret).then((result) => {
        if (result.error) {
          return Promise.reject({
            error: result.error,
            message: result.error.message,
          });
        }

        return ({
          setup_intent_id: result.setupIntent.id,
          payment_method_id: result.setupIntent.payment_method
        })
      }).catch(error => {
        return {
          error,
          message: error.message,
        };
      });
    } else {
      let timeout;

      function ensureStripeHookFetched() {
        return new Promise(function (resolve, reject) {
            (function waitForHookResponse(){
              return fetch(`${DOMAIN}/api/public/v1/validate_payment_intent?payment_intent_id=${paymentIntentId}`, {
                method:  'GET',
                headers: {
                  'Token': apiKey,
                  'Content-Type': 'application/json'
                },
              })
                .then(response => {
                  return response.json().then(data => ({
                    status: response.status,
                    data
                  }));
                })
                .then(response => {
                  const { data, status } = response;
                  if (timeout) {
                    clearTimeout(timeout);
                  }
                  if (status == 400 && data.error) {
                    return reject({
                      error: data.error,
                      message: data.error.message,
                    });
                  }
                  if (status == 404 && data.error) {
                    timeout = setTimeout(waitForHookResponse, 10000);
                  }
                  if (status == 200 && data.data) {
                    Sentry.captureMessage('Result of validatePaymentIntent', {extra: data});
                    return resolve({
                      payment_intent_id: data.data.id,
                      payment_method_id: data.data.payment_method
                    });
                  }
                });
            })();
        });
      }

      const confirmCardPayment = stripe.confirmCardPayment(clientSecret).then((result) => {
        Sentry.captureMessage('Result of confirmCardPayment', {extra: result});
        if (result.error) {
          return Promise.reject({
            error: result.error,
            message: result.error.message,
          });
        }

        return ({
          payment_intent_id: result.paymentIntent.id,
          payment_method_id: result.paymentIntent.payment_method
        });
      }).catch(error => {
        return {
          error,
          message: error.message,
        };
      });
      const validatePaymentIntent = ensureStripeHookFetched();
      paymentPromise = Promise.race([confirmCardPayment, validatePaymentIntent]);
    }
    return paymentPromise;
  }
}
