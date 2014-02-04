var Report = require('plumber').Report;
var mapEachResource = require('plumber').mapEachResource;

var AWS = require('aws-sdk');
var q = require('q');


function createReport(resource) {
    return new Report({
        resource: resource,
        type: 'write'
    });
}

function write(key, secret, bucket) {
    AWS.config.update({
        accessKeyId: key,
        secretAccessKey: secret
    });

    var s3 = new AWS.S3();
    var putObject = q.denodeify(s3.putObject);

    var mimes = {
        javascript: 'application/javascript',
        css: 'text/css',
        json: 'application/json',
        // FIXME: no html type yet
        html: 'text/html'
    };

    return mapEachResource(function(resource) {
        return putObject({
            Body: resource.data(),
            Bucket: bucket,
            Key: resource.path().absolute(),
            ContentType: mimes[resource.type()]
        }).thenResolve(createReport(resource));
    });
};


module.exports = {
    write: write
};
