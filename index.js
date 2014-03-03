var operation = require('plumber').operation;
var Report = require('plumber').Report;

var highland = require('highland');
var AWS = require('aws-sdk');
var extend = require('extend');


var mimes = {
    javascript: 'application/javascript',
    css:  'text/css',
    json: 'application/json',
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
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

function writeOperation(key, secret) {

    var s3 = new AWS.S3({
        accessKeyId: key,
        secretAccessKey: secret
    });

    var putObject = highland.wrapCallback(s3.putObject.bind(s3));


    function writeOperation(bucket) {
        return operation(function(resources) {
            return resources.map(function(resource) {
                var mimeType = mimes[resource.type()];
                return putObject(extend({
                    Bucket: bucket,
                    Body: resource.data(),
                    Key: resource.path().absolute()
                }, mimeType && {ContentType: mimeType})).
                    map(returnValue(createReport(resource.path())));
            }).merge();
            // TODO: or parallel to set a maximum concurrent uploads?
        });
    }

    return {
        write: writeOperation
    };
};

module.exports = writeOperation;
