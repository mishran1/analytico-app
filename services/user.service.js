var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var Mailchimp = require('mailchimp-api-v3');
var moment = require('moment');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('users');

// Calling the specific MailChimp controller logic
var MCController = require('controllers/api/MC.controller');

var service = {};

service.authenticate = authenticate;
service.getById = getById;
service.create = create;
service.update = update;
service.delete = _delete;

module.exports = service;

function authenticate(username, password) {
    var deferred = Q.defer();

    db.users.findOne({ username: username }, function (err, user) {
        if (err) deferred.reject(err);

        if (user && bcrypt.compareSync(password, user.hash)) {
            // authentication successful
            deferred.resolve(jwt.sign({ sub: user._id }, config.secret));
        } else {
            // authentication failed
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function getById(_id) {
    var deferred = Q.defer();

    db.users.findById(_id, function (err, user) {
        if (err) deferred.reject(err);

        if (user) {
            // return user (without hashed password)
            deferred.resolve(_.omit(user, 'hash'));
        } else {
            // user not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function create(userParam) {
    var deferred = Q.defer();

    // validation
    db.users.findOne(
        { username: userParam.username },
        function (err, user) {
            if (err) deferred.reject(err);

            if (user) {
                // username already exists
                deferred.reject('Username "' + userParam.username + '" is already taken');
            } else {
                createUser();
            }
        });

    function createUser() {
        // set user object to userParam without the cleartext password
        var user = _.omit(userParam, 'password');

        // add hashed password to user object
        user.hash = bcrypt.hashSync(userParam.password, 10);

        db.users.insert(
            user,
            function (err, doc) {
                if (err) deferred.reject(err);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function update(_id, userParam) {
    var deferred = Q.defer();

    // validation
    db.users.findById(_id, function (err, user) {
        if (err) deferred.reject(err);

        if (user.username !== userParam.username) {
            // username has changed so check if the new username is already taken
            db.users.findOne(
                { username: userParam.username },
                function (err, user) {
                    if (err) deferred.reject(err);

                    if (user) {
                        // username already exists
                        deferred.reject('Username "' + req.body.username + '" is already taken')
                    } else {
                        updateUser();
                    }
                });
        } else {
            updateUser();
        }
    });

    function updateUser() {

        var now = moment().format('YYYY-MM-DD-HH-mm-ss');
        var diff = moment(now,'YYYY-MM-DD-HH-mm-ss').diff(moment(userParam.modTime,'YYYY-MM-DD-HH-mm-ss'));
        var d = moment.duration(diff);
        
        if(d>300000){

            var getData = new Promise(function(resolve, reject) {
                var temp = MCController.getMC(userParam.apiKey);
                resolve(temp);
            });

            getData.then(function(result) {
                
                // fields to update
                var set = {
                    firstName: userParam.firstName,
                    lastName: userParam.lastName,
                    username: userParam.username,
                    apiKey: userParam.apiKey,
                    dataMC: result,
                    modTime: moment().format('YYYY-MM-DD-HH-mm-ss'),
                };

                // update password if it was entered
                if (userParam.password) {
                    set.hash = bcrypt.hashSync(userParam.password, 10);
                }

                db.users.update(
                { _id: mongo.helper.toObjectID(_id) },
                { $set: set },
                function (err, doc) {
                    if (err) deferred.reject(err);

                    deferred.resolve();
                });

            }, function(err) {
                console.log(err);
            });

        }
        else{
            console.log('too recent too update');
        }
    }

    return deferred.promise;
}

function _delete(_id) {
    var deferred = Q.defer();

    db.users.remove(
        { _id: mongo.helper.toObjectID(_id) },
        function (err) {
            if (err) deferred.reject(err);

            deferred.resolve();
        });

    return deferred.promise;
}