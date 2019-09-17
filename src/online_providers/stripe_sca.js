export default {
  handleOnlinePayment: ({ settings, payment }) => {
    const token = settings.token;
    const clientSecret = payment.clientSecret;

    const stripe = window.Stripe(token);

    return stripe.handleCardPayment(clientSecret);
  },

  handleCardSetup: ({ settings, payment }) => {
    const token = settings.token;
    const clientSecret = payment.clientSecret;

    const stripe = window.Stripe(token);

    return stripe.handleCardSetup(clientSecret);
  }
}
