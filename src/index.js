import braintree_service from './providers/braintree';
import pci_proxy_service from './providers/pci_proxy';
import stripe_service from './providers/stripe';
import stripe_sca_service from './providers/stripe_sca';
import omise_service from './providers/omise';
import worldpay_service from './providers/worldpay';
import pcibooking_service from './providers/pcibooking';
import payment_express_service from './providers/payment_express';
import valitor_service from './providers/valitor';

import stripePaymentGateways from './payment_gateways/stripe_sca';

const SERVICES = {
  braintree_service,
  pci_proxy_service,
  stripe_service,
  stripe_sca_service,
  omise_service,
  worldpay_service,
  pcibooking_service,
  payment_express_service,
  valitor_service
};

const PAYMENT_GATEWAYS = {
  stripe_sca: stripePaymentGateways
};

export function init(service, settings) {
  try {
    return new SERVICES[`${service}_service`](settings);
  } catch (error) {
    console.log(error);
    console.log('Unsupported payment service');

    return false;
  }
}

export function handleOnlinePayment(gateway, payload) {
  try {
    const paymentGateway = PAYMENT_GATEWAYS[gateway];

    if (!paymentGateway) {
      throw new Error("Unsupported payment gateway");
    }

    return paymentGateway.handleOnlinePayment(payload);
  } catch (error) {
    console.error(error);
    console.error('Unsupported payment gateway');

    return false;
  }
}

export function handleCardSetup(gateway, settings) {
  try {
    const paymentGateway = PAYMENT_GATEWAYS[gateway];

    if (!paymentGateway) {
      throw new Error("Unsupported payment gateway");
    }

    return paymentGateway.handleCardSetup(settings);
  } catch (error) {
    console.error(error);
    console.error('Unsupported payment gateway');

    return false;
  }
}
