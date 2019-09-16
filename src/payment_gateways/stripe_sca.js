export default {
  handleOnlinePayment: (payload) => {
    const token = payload.providerConnection.token;
    const clientSecret = payload.card.payload.clientSecret;

    const stripe = window.Stripe(token);

    return stripe.handleCardPayment(clientSecret);
  },

  handleCardSetup: ({ token, clientSecret }) => {
    const stripe = window.Stripe(token);

    return stripe.handleCardSetup(clientSecret);
  }
}
