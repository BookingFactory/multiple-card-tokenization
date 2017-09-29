import braintree_service from './providers/braintree';
import pci_proxy_service from './providers/pci_proxy';
import stripe_service from './providers/stripe';
import omise_service from './providers/omise';
import worldpay_service from './providers/worldpay';
import pcibooking_service from './providers/pcibooking';
import payment_express_service from './providers/payment_express';

const SERVICES = {
  braintree_service,
  pci_proxy_service,
  stripe_service,
  omise_service,
  worldpay_service,
  pcibooking_service,
  payment_express_service
}

export function init(service, settings) {
  try {
    return new SERVICES[`${service}_service`](settings);
  } catch (error) {
    console.log(error);
    console.log('Unsupported payment service');
    return false;
  }
}
