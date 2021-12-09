export default {
  handleOnlinePayment: ({ settings, payment, onlyTokenizeCard}) => {
    const token = settings.token;
    const { clientSecret, paymentIntentId, paymentMethodId, requiresAction} = payment;
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
      if(requiresAction)  {
        paymentPromise = stripe.handleCardAction(clientSecret).then((result) => {
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
      } else {
        paymentPromise = paymentPromise.then(() => {
          return {
            client_secret: clientSecret,
            payment_intent_id: paymentIntentId,
            payment_method_id: paymentMethodId,
          }
        });
      }
    }

    return paymentPromise;
  }
}
