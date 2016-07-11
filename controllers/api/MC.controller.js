var config = require('config.json');
var express = require('express');
var router = express.Router();
var userService = require('services/user.service');
var Mailchimp = require('mailchimp-api-v3');

router.get('/MC', getMC);

module.exports = router;

function getMC(req, res) {
    //Store 
    var cid = [];
    var MCdata = [];
    
    userService.getById(req.user.sub)
        .then(function (user) {
            if (user) {
                try {
                    var mailchimp = new Mailchimp(user.apiKey);
                } catch (error) {
                    console.log(error.message);
                }
                
                var get_cid = new Promise(function(resolve, reject) {
                    var data = mailchimp.request({
                    method : 'get',
                    path : 'reports'
                    }, function (err,result) {
                        if (err) {
                            resolve("It broke");
                        }
                        for (var i = 0; i < result.reports.length; i++) {
                          cid.push(result.reports[i].id);
                        }
                        resolve(cid);
                    })
                })

                get_cid.then(function(result) {
                    var counter = 0;
                    var limit = result.length;
                    for (var i = 0; i < result.length; i++) {
                        var get_loc = new Promise(function(resolve, reject) {
                            var data1 = mailchimp.request({
                                method: 'get',
                                path : '/reports/{campaign_id}/locations',
                                path_params: {
                                    campaign_id : result[i]
                                }
                            }, function (err, result) {
                                if (err) {
                                    resolve("It Broke");
                                }
                                resolve(result);
                            })
                        })

                        get_loc.then(function(result) {
                            MCdata.push(result.locations);
                            counter = counter+1;
                            if (counter == limit) {
                                res.send(MCdata);
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