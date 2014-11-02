var operation = require('plumber').operation;
var Report = require('plumber').Report;
var Rx = require('plumber').Rx;

var AWS = require('aws-sdk');
var extend = require('extend');


var mimes = {
    javascript: 'application/javascript',
    css:  'text/css',
    json: 'application/json',
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    png:  'image/png',
    gif:  'image/gif',
    // FIXME: no html type yet
    html: 'text/html'
};

function createReport(path) {
    return new Report({
        path: path,
        type: 'write'
    });
}

function returnValue(value) {
    return function() {
        return value;
    };
}


// s3(key, secret).write('bucket')

function writeOperation(key, secret, region) {

    var s3 = new AWS.S3({
        accessKeyId: key,
        secretAccessKey: secret,
        region: region
    });

    var putObject = Rx.Node.fromNodeCallback(s3.putObject.bind(s3));

    // FIXME: not applying logic to append reference to source map in
    // source data, because it lives in plumber-write...

    function writeOperation(bucket) {
        return operation.parallelFlatMap(function(resource) {
            var mimeType = mimes[resource.type()];
            return putObject(extend({
                Bucket: bucket,
                Body: resource.rawData(),
                Key: resource.path().absolute()
            }, mimeType && {ContentType: mimeType})).
                map(returnValue(createReport(resource.path())));
        });
    }

    return {
        write: writeOperation
    };
};

module.exports = writeOperation;
