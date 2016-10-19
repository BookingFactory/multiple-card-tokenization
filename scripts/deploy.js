var AWS = require('aws-sdk');
var fs = require('fs');
var mime = require('mime');
var config = require('../aws-upload.conf.js');

AWS.config.loadFromPath(config.credentials)

var s3obj = new AWS.S3({params: {Bucket: config.bucketName}});

fs.readdir(config.source, function(err, response) {
  response.forEach(function (filename) {
    s3obj
      .upload({
        Body: fs.createReadStream(config.source + '/' + filename),
        Key: filename,
        ContentType: mime.lookup(config.source + '/' + filename)
      })
      .on('httpUploadProgress', function(evt) { console.log(evt); })
      .send(function(err, data) { console.log(err, data) });
  });
});
