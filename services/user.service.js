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
db.bind('Community');

var MCStatus = false;

// Calling the specific MailChimp controller logic
var MCController = require('controllers/api/MC.controller');

var service = {};

service.authenticate = authenticate;
service.getById = getById;
service.create = create;
service.update = update;
service.delete = _delete;
service.getGACommunity = getGACommunity;
service.setGACommunity = setGACommunity;
service.getMailChimpCommunity = getMailChimpCommunity;

module.exports = service;

function setGACommunity(gaid, dataGA) {
    var deferred = Q.defer();

    var set = {
        dataGA: dataGA,
    }
    db.Community.update(
        { _id: gaid},
        { $set: set },
        { upsert: true },
        function (err, doc) {
            if(err) deferred.reject(err);

            deferred.resolve();
    });

    return deferred.promise;
}

function getGACommunity(gaid) {
    var deferred = Q.defer();

    db.Community.aggregate([
        {   $match: { _id: { $ne: gaid } } },
        {   $unwind: "$dataGA"  },
        { $group: {
            _id: "$dataGA.day",
            avgCR: { $avg: "$dataGA.CR"},
            avgRev: { $avg: "$dataGA.revenue"},
            avgAOV: { $avg: "$dataGA.AOV"},
            avgCPA: { $avg: "$dataGA.CPA"},
            avgSessions: { $avg: "$dataGA.sessions"}
            }
        },

        { $sort: { _id : 1 }}
    ], function (err, result) {
        if (err) deferred.reject(err);

        deferred.resolve(result);
    });

    return deferred.promise;
}

function getMailChimpCommunity(userid) {
    var deferred = Q.defer();

    db.users.aggregate([
        {   $match: { username: { $ne: userid } } },
        {   $unwind: "$dataMC"  },
        {   $unwind: "$dataMC.obj3"     },
        { $group: {
            _id: null,
            avgOpenRate: {  $avg:   "$dataMC.obj3.open_rate"    },
            avgClickRate: { $avg:   "$dataMC.obj3.click_rate"   }
            }
        },
    ], function (err, result) {
        if (err) deferred.reject(err);
        deferred.resolve(result);
    });

    return deferred.promise;
}

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
            if (user.apiKey) {
                update(_id, _.omit(user, 'hash'));
            }
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

    if(userParam.dflag == '1') {
        updateDash(_id, userParam.dash);
    } else if (userParam.gflag == '1') {
        updateGA(_id, userParam.dataGA);
    } else {
        // validation
        db.users.findById(_id, function (err, user) {
            var currentUser = user;

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
                            // fields to update
                            var set = {
                                firstName: userParam.firstName,
                                lastName: userParam.lastName,
                                username: userParam.username,
                                apiKey: userParam.apiKey,
                            };

                            // update password if it was entered
                            if (userParam.password) {
                                set.hash = bcrypt.hashSync(userParam.password, 10);
                            }

                            updateUser(set);
                        }
                    }
                );
            } else if (userParam.apiKey) {

                var now = moment().format('YYYY-MM-DD-HH-mm-ss');
                var diff = moment(now,'YYYY-MM-DD-HH-mm-ss').diff(moment(userParam.modTime,'YYYY-MM-DD-HH-mm-ss'));
                var d = moment.duration(diff);

                if (user.apiKey !== userParam.apiKey || d>3000000) {
                    if(!MCStatus || user.apiKey !== userParam.apiKey) {
                        MCStatus = true;
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

                            updateUser(set);
                            MCStatus = false;
                        },  function(err) {
                                console.log(err);
                            });
                    }
                    else {
                        console.log('im already running');
                    }
                }
                else {
                    console.log('Data up to date');
                }
            } else {
                // fields to update
                var set = {
                    firstName: userParam.firstName,
                    lastName: userParam.lastName,
                    username: userParam.username,
                    apiKey: userParam.apiKey,
                };

                // update password if it was entered
                if (userParam.password) {
                    set.hash = bcrypt.hashSync(userParam.password, 10);
                }

                updateUser(set);
            }
        });
    }

    function updateUser(set) {
        db.users.update(
        { _id: mongo.helper.toObjectID(_id) },
        { $set: set },
        function (err, doc) {
            if (err) deferred.reject(err);

            deferred.resolve();
        });
    }

    function updateDash(_id, dash) {
        var set = {
            dash: dash,
        }
        db.users.update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if(err) deferred.reject(err);

                deferred.resolve();
            });
    }

    function saveGA(_id, dataGA) {
        var set = {
            dataGA: dataGA,
        }
        db.users.update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if(err) deferred.reject(err);

                deferred.resolve();
        });
    }

    function updateGA(_id, dataGA) {
        var set = {
            dataGA: dataGA,
        }
        db.users.update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if(err) deferred.reject(err);

                deferred.resolve();
            });
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

