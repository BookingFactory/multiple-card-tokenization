export default {
  handleCardPayment: ({ token, clientSecret }) => {
    const stripe = window.Stripe(token);

    return stripe.handleCardPayment(clientSecret);
  },

  handleCardSetup: ({ token, clientSecret }) => {
    const stripe = window.Stripe(token);

    return stripe.handleCardSetup(clientSecret);
  }
}
