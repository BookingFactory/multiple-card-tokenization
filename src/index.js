import braintree_service from './providers/braintree';

const SERVICES = {
  braintree_service
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
