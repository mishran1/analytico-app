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
    var TopLevel = [];          //Top Level Data for drill down chart
    var DetailedData = [];          //Detailed Data
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
                          lid.push({
                            id: result.lists[i].id,
                            title: result.lists[i].name
                            });
                        }
                        resolve(lid);
                    })
                })

                get_ids.then(function(result) {
                    var counter = 0;    //Count number of list ids processed
                    var limit = result.length;  //Total number of list ids

                    //Loop through list ids and retrieve growth history for each
                    for (var i = 0; i < result.length; i++) {
                        var get_history = new Promise(function(resolve, reject) {
                            var title = result[i].title;
                            var data = mailchimp.request({
                                method: 'get',
                                path : '/lists/{list_id}/growth-history',
                                path_params: {
                                    list_id : result[i].id
                                }
                            }, function (err, result) {
                                if (err) {
                                    reject(err);
                                }
                                var subs = 0; //Variable for total Subscriptions
                                var monthly = [];

                                //Loop through each month
                                result.history.forEach(function (row, i) {
                                    subs = subs + row.imports + row.optins;
                                    monthly.push([row.month, row.imports + row.optins]);
                                });

                                resolve({
                                    top: {
                                    name: title,
                                    y: subs,
                                    drilldown: title
                                    },
                                    down: {
                                    id: title,
                                    name: title,
                                    data: monthly
                                    }
                                });
                            })
                        })

                        get_history.then(function(result) {
                            counter = counter+1;
                            TopLevel.push(result.top);
                            DetailedData.push(result.down);
                            if (counter == limit) {
                                res.send({ obj1: TopLevel, obj2: DetailedData});
                            }
                        }, function(err) {
                            console.log(err);
                        });
                    }
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