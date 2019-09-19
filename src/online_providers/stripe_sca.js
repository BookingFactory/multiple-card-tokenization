export default {
  handleOnlinePayment: (initial_payment, { settings, payment }) => {
    const token = settings.token;
    const clientSecret = payment.clientSecret;

    const stripe = window.Stripe(token);
    let paymentPromise = Promise.resolve();

    if (Number(initial_payment) === 0) {
      paymentPromise = stripe.handleCardSetup(clientSecret).then((result) => ({
        setup_intent_id: result.setupIntent.id,
        payment_method_id: result.setupIntent.payment_method
      }));
    } else {
      paymentPromise = stripe.handleCardPayment(clientSecret).then((result) => ({
        payment_intent_id: result.paymentIntent.id,
        payment_method_id: result.paymentIntent.payment_method
      }));
    }

    return paymentPromise;
  }
}
