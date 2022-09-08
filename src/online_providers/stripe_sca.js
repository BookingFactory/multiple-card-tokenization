import * as Sentry from "@sentry/browser";

export default {
  handleOnlinePayment: ({ settings, payment, onlyTokenizeCard}) => {
    const token = settings.token;
    const { clientSecret } = payment;
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
      paymentPromise = stripe.confirmCardPayment(clientSecret).then((result) => {
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
        })
      }).catch(error => {
        return {
          error,
          message: error.message,
        };
      });
    }
    return paymentPromise;
  }
}
