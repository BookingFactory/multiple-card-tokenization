var AWS = require('aws-sdk');

try {
  var config = require('../aws-upload.conf.js');
  AWS.config.loadFromPath(config.credentials)
} catch (e) { }

var cloudfront = new AWS.CloudFront();
var params = {
  DistributionId: 'E393H99K5LG2JH',
  InvalidationBatch: {
    CallerReference: (new Date()).toISOString(),
    Paths: {
      Quantity: 1,
      Items: [
        '/multipleCardTokenizationStaging.min.js',
      ]
    }
  }
};
cloudfront.createInvalidation(params, function(err, data) {
  if (err) console.log(err, err.stack);
  else     console.log(data);
});
