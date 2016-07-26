var config = require('config.json');
var express = require('express');
var router = express.Router();
var userService = require('services/user.service');
var Mailchimp = require('mailchimp-api-v3');

router.get('/MC', getMC);

module.exports = router;

function getMC(req, res) {
    //Variables to store data requested from MailChimpAPI
    var lid = [];               //List IDs
    var rid = [];               //List IDs
    var map = {};
    var MCdata = [];

    userService.getById(req.user.sub)
        .then(function (user) {
            if (user) {
                //Initialize MailChimp Object
                try {
                    var mailchimp = new Mailchimp(user.apiKey);
                } catch (error) {
                    console.log(error.message);
                }
                
                //Promise to retrieve list ids from the API object
                var get_ids = new Promise(function(resolve, reject) {
                    var data = mailchimp.request({
                        method : 'get',
                        path : 'lists'
                    }, function (err,result) {
                        if (err) {
                            reject(err);
                        }
                        
                        for (var i = 0; i < result.lists.length; i++) {
                            map[result.lists[i].id] = result.lists[i].name;
                        }
                    })

                    var data1 = mailchimp.request({
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
                    })

                    setTimeout(function(){ resolve({ lists: map, reports: rid }) }, 2000);
                })


                get_ids.then(function(result) {
                    //Loop through list ids and retrieve growth history for each
                    var hist_req = [];
                    var act_req = [];
                    for (var i in result.lists) {
                        hist_req.push({
                            method : 'get',
                            path : '/lists/{list_id}/growth-history',
                            path_params : {
                                list_id : i
                                }
                            });

/*                        act_req.push({
                            method: 'get',
                            path: 'lists/{list_id}/activity',
                            path_params : {
                                list_id : i
                            }
                        });*/
                    }

                    for (var j = 0; j < result.reports.length; j++) {
                        hist_req.push({
                            method: 'get',
                            path: '/reports/{report_id}/',
                            path_params : {
                                report_id : result.reports[j].id
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
                        result.forEach(function (row, i) {
                            if (("history" in row)) {                                
                                var subs = 0; //Variable for total Subscriptions
                                var monthly = [];
                                row.history.forEach(function (row, j) {
                                    subs = subs + row.imports + row.optins;
                                    monthly.push([row.month, row.imports + row.optins]);
                                });
                                top.push({
                                        name: map[row.list_id],
                                        y: subs,
                                        drilldown: map[row.list_id]
                                    })
                                down.push({
                                    id: map[row.list_id],
                                    name: map[row.list_id],
                                    data: monthly
                                })
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
                        });
                        MCdata.push({ obj1: top});
                        MCdata.push({ obj2: down});
                        MCdata.push({ obj3: campaign});

                        res.send(MCdata);
                    }, function(err) {
                        console.log(err);
                    });

/*                    var get_activity = new Promise(function(resolve, reject) {
                        var data = mailchimp.batch(act_req, function (err, result) {
                            if (err) {
                                reject(err);
                            }
                            resolve(result)
                        })
                    })

                    get_activity.then(function(result) {
                        res.send(result);
                    }, function(err) {
                        console.log(err);
                    });
*/


                }, function(err) {
                    console.log(err);
                });
            } else {
                res.sendStatus(404);
            }
        })
        .catch(function (err) {
            res.status(400).send(err);
        }
    );
}