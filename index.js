var Report = require('plumber').Report;
var mapEachResource = require('plumber').mapEachResource;

var AWS = require('aws-sdk');
var q = require('q');
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



function write(key, secret, bucket) {
    AWS.config.update({
        accessKeyId: key,
        secretAccessKey: secret
    });

    var s3 = new AWS.S3();
    var putObject = q.denodeify(s3.putObject.bind(s3));

    var baseParams = {
        Bucket: bucket
    };

    return mapEachResource(function(resource) {
        var mimeType = mimes[resource.type()];
        return putObject(extend({}, baseParams, {
            Body: resource.data(),
            Key:  resource.path().absolute()
        }, mimeType && {ContentType: mimeType})).
            thenResolve(createReport(resource.path()));
    });
};

// s3(key, secret).write('bucket')

function writeOperation(key, secret) {

    AWS.config.update({
        accessKeyId: key,
        secretAccessKey: secret
    });

    var s3 = new AWS.S3();
    var putObject = q.denodeify(s3.putObject.bind(s3));


    function writeOperation(bucket) {
        return mapEachResource(function(resource) {
            var mimeType = mimes[resource.type()];
            return putObject(extend({
                Body: resource.data(),
                Key: resource.path().absolute()
            }, mimeType && {ContentType: mimeType})).
                thenResolve(createReport(resource.path()));
        });
    }

    return {
        write: writeOperation
    };
};

module.exports = writeOperation;
