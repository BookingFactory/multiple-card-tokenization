import braintree_service from './providers/braintree';
import pci_proxy_service from './providers/pci_proxy';
import stripe_service from './providers/stripe';

const SERVICES = {
  braintree_service,
  pci_proxy_service,
  stripe_service
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
