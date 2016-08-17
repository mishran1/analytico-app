var config = require('config.json');
var express = require('express');
var router = express.Router();
var userService = require('services/user.service');
var Q = require('q');
var Mailchimp = require('mailchimp-api-v3');

router.get('/MC', getMC);

router.getMC = getMC;

module.exports = router;

function getMC(apiKey) {
    var deferred = Q.defer();

        //Variables to store data requested from MailChimpAPI
        var lid = [];               //List IDs
        var rid = [];               //List IDs
        var map = {};
        var MCdata = [];

        try {
            var mailchimp = new Mailchimp(apiKey);
        } catch (error) {
            console.log(error.message);
        }

        var get_ids = new Promise(function(resolve, reject) {
            var data = new Promise(function(resolve, reject) {
                    mailchimp.request({
                    method : 'get',
                    path : 'lists'
                }, function (err,result) {
                    if (err) {
                        reject(err);
                    }
                    
                    for (var i = 0; i < result.lists.length; i++) {
                        map[result.lists[i].id] = result.lists[i].name;
                    }
                    resolve(map);
                })
            });

            var data1 = new Promise(function(resolve, reject) {
                    mailchimp.request({
                    method : 'get',
                    path : 'reports'
                }, function (err,result) {
                    if (err) {
                        reject(err);
                    }

                    for (var i = 0; i < result.reports.length; i++) {
                        rid.push({
                            id: result.reports[i].id,
                            title: result.reports[i].campaign_title
                        });
                    }
                    resolve(rid);
                })
            });

            Promise.all([data, data1]).then(function(results) {
                resolve(results);
            });
        })

        get_ids.then(function(result) {
        //Loop through list ids and retrieve growth history for each
            var hist_req = [];
            var act_req = [];
            for (var i in result[0]) {
                hist_req.push({
                    method : 'get',
                    path : '/lists/{list_id}/growth-history',
                    path_params : {
                        list_id : i
                        }
                    });
            }

            result[1].forEach(function (row, i){
                hist_req.push({
                    method: 'get',
                    path: '/reports/{report_id}/',
                    path_params : {
                        report_id : row.id
                    }
                });
            });

            for (var i in result[0]) {
                hist_req.push({
                    method : 'get',
                    path : '/lists/{list_id}/activity',
                    path_params : {
                        list_id : i
                    }
                });
            }

            var get_history = new Promise(function(resolve, reject) {
                var data = mailchimp.batch(hist_req, function (err, result) {
                    if (err) {
                        reject(err);
                    }
                    resolve(result);
                })
            })

            get_history.then(function(result) {
                var top = [];
                var down = [];
                var campaign = [];
                var top1 = [];
                var down1 = [];
                result.forEach(function (row, i) {
                    if (("history" in row)) {                                
                        var subs = 0; //Variable for total Subscriptions
                        var monthly = [];
                        row.history.forEach(function (row, j) {
                            subs = subs + row.imports + row.optins;
                            monthly.push([row.month, row.imports + row.optins]);
                        });
                        monthly.sort();
                        top.push({
                                name: map[row.list_id],
                                y: subs,
                                drilldown: map[row.list_id]
                            });

                        down.push({
                            id: map[row.list_id],
                            name: map[row.list_id],
                            data: monthly
                        });
                    }
                    else if ("campaign_title" in row) {
                        var open_rate = 0;
                        var click_rate = 0;

                        campaign.push({
                            title : row.campaign_title,
                            open_rate : row.opens.open_rate * 100,
                            click_rate : row.clicks.click_rate * 100
                        });
                    }
                    else if ("activity" in row){
                        var net = 0;
                        var day = [];
                        row.activity.forEach(function (row, k) {
                            net = net + row.subs - row.unsubs;
                            day.push([row.day, row.subs - row.unsubs])
                        });
                        top1.push({
                                name: map[row.list_id],
                                y: net,
                                drilldown: map[row.list_id]
                            });
                        day.reverse();
                        down1.push({
                            id: map[row.list_id],
                            name: map[row.list_id],
                            data: day
                        });
                    }
                });

                MCdata.push({ obj1: top});
                MCdata.push({ obj2: down});
                MCdata.push({ obj3: campaign});
                MCdata.push({ obj4: top1});
                MCdata.push({ obj5: down1});

                deferred.resolve(MCdata);

            }, function(err) {
                console.log(err);
            });
        }, function(err) {
            console.log(err);
        });

    return deferred.promise;
}