﻿(function () {
    'use strict';

    angular
        .module('app')
        .controller('Community.IndexController', Controller)

    function Controller(UserService, $scope, $rootScope, $window) {
        // Set the theme
        Highcharts.theme = {
            colors: ['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572', 
                     '#FF9655', '#FFF263', '#6AF9C4'],
            chart: {
                backgroundColor: 'white',
            },
            title: {
                style: {
                    color: '#000',
                    font: 'bold 16px "Avenir", Verdana, sans-serif'
                }
            },
            subtitle: {
                style: {
                    color: '#666666',
                    font: 'bold 12px "Avenir", Verdana, sans-serif'
                }
            },
            lang: {
                thousandsSep: ','
            },
            legend: {
                itemStyle: {
                    font: '9pt Avenir, Verdana, sans-serif',
                    color: 'black'
                },
                itemHoverStyle:{
                    color: 'black'
                }   
            }
        };

        // Apply the theme
        Highcharts.setOptions(Highcharts.theme);

        // For loading Google Analytics
        $window.location.href = '/app/#/community';
        if ($rootScope.flagC == '1') {
            $rootScope.flagC = '0';
            $window.location.reload();
        }
        else
        {
            $rootScope.flag = '1';
            $rootScope.flagH = '1';

            UserService.GetCurrent().then(function (user) {
                UserService.GetMailChimpCommunityData(user.username).then(function (avgDataMC) {
                    var click_rates = [];
                    var open_rates = [];
                    var names = [];
                    user.dataMC[2].obj3.forEach(function(row, i) {
                      click_rates.push(row.click_rate);
                      open_rates.push(row.open_rate);
                      names.push(row.title);
                    });

                    Highcharts.chart('container1', {
                        chart: {
                          zoomType: 'xy'
                        },
                        title: {
                          text: 'MailChimp Engagement'
                        },
                        subtitle: {
                          text: 'Campaign Open Rates, Click Rates, and Averages'
                        },
                        xAxis: [{
                          categories: names,
                          crosshair: true
                        }],
                        yAxis: [{
                          // Primary yAxis
                          labels: {
                            format: '{value}%',
                            style: {
                              color: Highcharts.getOptions().colors[0]
                            }
                          },
                          plotLines: [{
                            value: avgDataMC[0].avgOpenRate,
                              color: Highcharts.getOptions().colors[0],
                              dashStyle: 'shortdot',
                              width: 2,
                              zIndex: 10,
                              label: {
                                  text: 'Average Open Rate'
                              }
                          }],
                          title: {
                            text: 'Open Rate',
                            style: {
                              color: Highcharts.getOptions().colors[0]
                            }
                          },
                        },
                        {
                          // Secondary yAxis
                          plotLines: [{
                              value: avgDataMC[0].avgClickRate,
                              color: Highcharts.getOptions().colors[1],
                              dashStyle: 'shortdot',
                              width: 2,
                              zIndex: 10,
                              label: {
                                  text: 'Average Click Rate'
                              }
                          }],
                          title: {
                            text: 'Click Rate',
                            style: {
                              color: Highcharts.getOptions().colors[1]
                            }
                          },
                          labels: {
                            format: '{value}%',
                            style: {
                              collor: Highcharts.getOptions().colors[1]
                            }
                          },
                          opposite: true,

                        }],
                        tooltip: {
                          pointFormat: '{series.name}: <b>{point.y:.2f}%</b><br>',
                          shared: true,
                          positioner: function () {
                            return { x: 180, y: 50 };
                          }
                        },
                        credits: {
                          enabled: false
                        },
                        series: [{
                          name: 'Open Rate',
                          type: 'column',
                          color: Highcharts.getOptions().colors[0],
                          yAxis: 0,
                          data: open_rates,
                          tooltip: {
                            valueSuffix: '%',
                          }
                        },
                        {
                          name: 'Click Rate',
                          type: 'column',
                          color: Highcharts.getOptions().colors[1],
                          yAxis: 1,
                          data: click_rates,
                          tooltip: {
                            valueSuffix: '%',
                          }
                        }]
                    });
                });
            });


            gapi.analytics.ready(function() {
                /**
                * Authorize the user immediately if the user has already granted access.
                * If no access has been created, render an authorize button inside the
                * element with the ID "embed-api-auth-container".
                */
                gapi.analytics.auth.authorize({
                    container: 'embed-api-auth-container',
                    clientid: '254081485976-4mpdlk6p12n0n6rgiuoq962163n1no0e.apps.googleusercontent.com'
                });


                /**
                * Query params representing the date range.
                */
                var dateRange = {
                    'start-date': '14daysAgo',
                    'end-date': 'yesterday'
                };

                /**
                * Create a new DateRangeSelector instance to be rendered inside of an
                * element with the id "date-range-selector-container", set its date range
                * and then render it to the page.
                */
                var dateRangeSelector = new gapi.analytics.ext.DateRangeSelector({
                    container: 'date-range-selector-container',
                    template:
                              '<div class="DateRangeSelector">' +
                              '  <div class="DateRangeSelector-item">' +
                              '    <label>Start Date</label> ' +
                              '    <input type="date">' +
                              '    <label>End Date</label> ' +
                              '    <input type="date">' +
                              '  </div>' +
                              '</div>'
                })
                .set(dateRange)
                .execute();

                /**
                * Register a handler to run whenever the user changes the date range from
                * the first datepicker. The handler will update the dataChart
                * instance as well as change the dashboard subtitle to reflect the range.
                */
                dateRangeSelector.on('change', function(data) {

                    // Update the "from" dates text.
                    /*var datefield = document.getElementById('from-dates');
                    datefield.innerHTML = data['start-date'] + '&mdash;' + data['end-date'];*/

                    dateRange = data;
                    var e = document.getElementById("selectedid");
                    var gaid = 'ga:' + e.options[e.selectedIndex].value;

                    renderTopBrowsersChart(gaid);
                    renderTopCountriesChart(gaid);
                    renderTopProductsChart(gaid);
                });

                /**
                * Create a new ActiveUsers instance to be rendered inside of an
                * element with the id "active-users-container" and poll for changes every
                * five seconds.
                */
                var activeUsers = new gapi.analytics.ext.ActiveUsers({
                    container: 'active-users-container',
                    pollingInterval: 5
                });


                /**
                * Add CSS animation to visually show the when users come and go.
                */
                activeUsers.once('success', function() {
                    var element = this.container.firstChild;
                    var timeout;

                    this.on('change', function(data) {
                        var element = this.container.firstChild;
                        var animationClass = data.delta > 0 ? 'is-increasing' : 'is-decreasing';
                        element.className += (' ' + animationClass);

                        clearTimeout(timeout);
                        timeout = setTimeout(function() {
                        element.className =
                            element.className.replace(/ is-(increasing|decreasing)/g, '');
                        }, 3000);
                    });
                });


                /**
                * Create a new ViewSelector2 instance to be rendered inside of an
                * element with the id "view-selector-container".
                * Pass the template for the view selector with an id for the form
                */
                var viewSelector = new gapi.analytics.ext.ViewSelector2({
                    container: 'view-selector-container',
                    template:
                              '<div class="ViewSelector2">' +
                              '  <div class="ViewSelector2-item">' +
                              '    <label>Account</label>' +
                              '    <select class="FormField"></select>' +
                              '    <label>Property</label>' +
                              '    <select class="FormField"></select>' +
                              '    <label>View</label>' +
                              '    <select class="FormField" id="selectedid"></select>' +
                              '  </div>' +
                              '</div>'
                })
                .execute();


                /**
                * Update the activeUsers component, the Chartjs charts, and the dashboard
                * title whenever the user changes the view.
                */
                viewSelector.on('viewChange', function(data) {
                    var title = document.getElementById('view-name');
                    title.innerHTML = data.property.name + ' (' + data.view.name + ')';

                    // Start tracking active users for this view.
                    activeUsers.set(data).execute();

                    // Render all the of charts for this view.
                    UserService.GetGACommunityData(data.ids).then(function (dataGA) {
                        renderAOV(data.ids, dataGA);
                        renderSessions(data.ids, dataGA);
                        renderCPA(data.ids, dataGA);
                        renderCR(data.ids, dataGA);
                        renderRevenue(data.ids, dataGA);
                    });
                });

                /**
                * Draw the overlayed 30-day AOV data for current user over community data.
                */
                function renderAOV(ids, dataGA) {

                    // Adjust `now` to experiment with different days, for testing only...
                    var now = moment(); // .subtract(3, 'day');

                    var thisMonth = query({
                      'ids': ids,
                      'dimensions': 'ga:day',
                      'metrics': 'ga:revenuePerTransaction',
                      'start-date': moment(now).startOf("month").format('YYYY-MM-DD'),
                      'end-date': moment(now).format('YYYY-MM-DD')
                    });


                    thisMonth.then(function(results) {
                        var data1 = results.rows.map(function(row) { return +row[1]; });
                        var data2 = dataGA.map(function (row) { return +row.avgAOV; });
                        var labels = dataGA.map(function (row) { return row._id; });

                        // Ensure the data arrays are at least as long as the labels array.
                        // Chart.js bar charts don't (yet) accept sparse datasets.
                        for (var i = 0, len = labels.length; i < len; i++) {
                            if (data1[i] === undefined) data1[i] = null;
                        }

                        Highcharts.chart('container2', {
                          chart: {
                            type: 'areaspline',
                            zoomType: 'xy'
                          },
                          title: {
                            text: 'Average Order Value (AOV)'
                          },
                          subtitle: {
                            text: 'E-Commerce Revenue Per Transaction'
                          },
                          xAxis: {
                            categories: labels,
                            title: {
                              enabled: true,
                              text: 'Day of Month',
                            }
                          },

                          yAxis: {
                              title: {
                                  text: 'AOV'
                              },
                          },

                          tooltip: {
                              pointFormat: '{series.name}: <b>${point.y:.2f}</b><br>',
                              shared: true
                          },
                          credits: {
                            enabled: false
                          },
                          series: [{
                              name: 'Community',
                              data: data2
                          }, {
                              name: 'You',
                              data: data1
                          }]

                        });

                    })
                    .catch(function(err) {
                        console.error(err.stack);
                    });
                }

                /**
                * Draw the overlayed 30-day session data for current user over community data.
                */
                function renderSessions(ids, dataGA) {

                    // Adjust `now` to experiment with different days, for testing only...
                    var now = moment(); // .subtract(3, 'day');

                    var thisMonth = query({
                      'ids': ids,
                      'dimensions': 'ga:day',
                      'metrics': 'ga:sessions',
                      'start-date': moment(now).startOf("month").format('YYYY-MM-DD'),
                      'end-date': moment(now).format('YYYY-MM-DD')
                    });


                    thisMonth.then(function(results) {
                        var data1 = results.rows.map(function(row) { return +row[1]; });
                        var data2 = dataGA.map(function (row) { return +row.avgSessions; });
                        var labels = dataGA.map(function (row) { return row._id; });

                        // Ensure the data arrays are at least as long as the labels array.
                        // Chart.js bar charts don't (yet) accept sparse datasets.
                        for (var i = 0, len = labels.length; i < len; i++) {
                            if (data1[i] === undefined) data1[i] = null;
                        }

                        Highcharts.chart('container3', {
                          chart: {
                            type: 'areaspline',
                            zoomType: 'xy'
                          },
                          title: {
                            text: 'Session Analysis'
                          },
                          subtitle: {
                            text: 'Number of Store Interactions'
                          },
                          xAxis: {
                            categories: labels,
                            title: {
                              enabled: true,
                              text: 'Day of Month',
                            }
                          },

                          yAxis: {
                              title: {
                                  text: 'Sessions'
                              },
                          },

                          tooltip: {
                              pointFormat: '{series.name}: <b>{point.y}</b><br>',
                              shared: true
                          },
                          credits: {
                            enabled: false
                          },
                          series: [{
                              name: 'Community',
                              data: data2
                          }, {
                              name: 'You',
                              data: data1
                          }]
                        });
                    })
                    .catch(function(err) {
                        console.error(err.stack);
                    });
                }

                /**
                * Draw the overlayed 30-day CPA data for current user over community data.
                */
                function renderCPA(ids, dataGA) {

                    // Adjust `now` to experiment with different days, for testing only...
                    var now = moment(); // .subtract(3, 'day');

                    var thisMonth = query({
                      'ids': ids,
                      'dimensions': 'ga:day',
                      'metrics': 'ga:costPerTransaction',
                      'start-date': moment(now).startOf("month").format('YYYY-MM-DD'),
                      'end-date': moment(now).format('YYYY-MM-DD')
                    });


                    thisMonth.then(function(results) {
                        var data1 = results.rows.map(function(row) { return +row[1]; });
                        var data2 = dataGA.map(function (row) { return +row.avgCPA; });
                        var labels = dataGA.map(function (row) { return row._id; });

                        // Ensure the data arrays are at least as long as the labels array.
                        // Chart.js bar charts don't (yet) accept sparse datasets.
                        for (var i = 0, len = labels.length; i < len; i++) {
                            if (data1[i] === undefined) data1[i] = null;
                        }

                        Highcharts.chart('container4', {
                          chart: {
                            type: 'areaspline',
                            zoomType: 'xy'
                          },
                          title: {
                            text: 'Cost Per Acquisition (CPA)'
                          },
                          subtitle: {
                            text: ''
                          },
                          xAxis: {
                            categories: labels,
                            title: {
                              enabled: true,
                              text: 'Day of Month',
                            }
                          },

                          yAxis: {
                              title: {
                                  text: 'Cost'
                              },
                          },

                          tooltip: {
                              pointFormat: '{series.name}: <b>${point.y:.2f}</b><br>',
                              shared: true
                          },
                          credits: {
                            enabled: false
                          },
                          series: [{
                              name: 'Community',
                              data: data2
                          }, {
                              name: 'You',
                              data: data1
                          }]
                        });
                    })
                    .catch(function(err) {
                        console.error(err.stack);
                    });
                }

                /**
                * Draw the overlayed 30-day CR data for current user over community data.
                */
                function renderCR(ids, dataGA) {

                    // Adjust `now` to experiment with different days, for testing only...
                    var now = moment(); // .subtract(3, 'day');

                    var thisMonth = query({
                      'ids': ids,
                      'dimensions': 'ga:day',
                      'metrics': 'ga:sessions, ga:transactions',
                      'start-date': moment(now).startOf("month").format('YYYY-MM-DD'),
                      'end-date': moment(now).format('YYYY-MM-DD')
                    });

                    thisMonth.then(function(results) {
                        var data1 = results.rows.map(function(row) { return +row[2]/row[1]; });
                        var data2 = dataGA.map(function (row) { return +row.avgCR; });
                        var labels = dataGA.map(function (row) { return row._id; });

                        // Ensure the data arrays are at least as long as the labels array.
                        // Chart.js bar charts don't (yet) accept sparse datasets.
                        for (var i = 0, len = labels.length; i < len; i++) {
                            if (data1[i] === undefined) data1[i] = null;
                        }

                        Highcharts.chart('container5', {
                          chart: {
                            type: 'areaspline',
                            zoomType: 'xy'
                          },
                          title: {
                            text: 'Conversion Rate (CR)'
                          },
                          subtitle: {
                            text: 'Number of Transactions Per Session'
                          },
                          xAxis: {
                            categories: labels,
                            title: {
                              enabled: true,
                              text: 'Day of Month',
                            }
                          },

                          yAxis: {
                              title: {
                                  text: 'Conversion Rate'
                              },
                          },

                          tooltip: {
                              pointFormat: '{series.name}: <b>{point.y:.2f}%</b><br>',
                              shared: true
                          },
                          credits: {
                            enabled: false
                          },
                          series: [{
                              name: 'Community',
                              data: data2
                          }, {
                              name: 'You',
                              data: data1
                          }]
                        });
                    })
                    .catch(function(err) {
                        console.error(err.stack);
                    });
                }

                /**
                * Draw the overlayed 30-day revenue data for current user over community data.
                */
                function renderRevenue(ids, dataGA) {

                    // Adjust `now` to experiment with different days, for testing only...
                    var now = moment(); // .subtract(3, 'day');

                    var thisMonth = query({
                      'ids': ids,
                      'dimensions': 'ga:day',
                      'metrics': 'ga:transactionRevenue',
                      'start-date': moment(now).startOf("month").format('YYYY-MM-DD'),
                      'end-date': moment(now).format('YYYY-MM-DD')
                    });

                    thisMonth.then(function(results) {
                        var data1 = results.rows.map(function(row) { return +row[1]; });
                        var data2 = dataGA.map(function (row) { return +row.avgRev; });
                        var labels = dataGA.map(function (row) { return row._id; });

                        // Ensure the data arrays are at least as long as the labels array.
                        // Chart.js bar charts don't (yet) accept sparse datasets.
                        for (var i = 0, len = labels.length; i < len; i++) {
                            if (data1[i] === undefined) data1[i] = null;
                        }

                        Highcharts.chart('container6', {
                          chart: {
                            type: 'areaspline',
                            zoomType: 'xy'
                          },
                          title: {
                            text: 'Transaction Revenue'
                          },
                          subtitle: {
                            text: ''
                          },
                          xAxis: {
                            categories: labels,
                            title: {
                              enabled: true,
                              text: 'Day of Month',
                            }
                          },

                          yAxis: {
                              title: {
                                  text: 'Revenue'
                              },
                          },

                          tooltip: {
                              pointFormat: '{series.name}: <b>${point.y:.2f}</b><br>',
                              shared: true
                          },
                          credits: {
                            enabled: false
                          },
                          series: [{
                              name: 'Community',
                              data: data2
                          }, {
                              name: 'You',
                              data: data1
                          }]
                        });
                    })
                    .catch(function(err) {
                        console.error(err.stack);
                    });
                }

                /**
                * Extend the Embed APIs `gapi.analytics.report.Data` component to
                * return a promise the is fulfilled with the value returned by the API.
                * @param {Object} params The request parameters.
                * @return {Promise} A promise.
                */
                function query(params) {
                    return new Promise(function(resolve, reject) {
                      var data = new gapi.analytics.report.Data({query: params});
                      data.once('success', function(response) { resolve(response); })
                          .once('error', function(response) { reject(response); })
                          .execute();
                    });
                }


                /**
                * Create a new canvas inside the specified element. Set it to be the width
                * and height of its container.
                * @param {string} id The id attribute of the element to host the canvas.
                * @return {RenderingContext} The 2D canvas context.
                */
                function makeCanvas(id) {
                    var container = document.getElementById(id);
                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');

                    container.innerHTML = '';
                    canvas.width = container.offsetWidth;
                    canvas.height = container.offsetHeight;
                    container.appendChild(canvas);

                    return ctx;
                }


                /**
                * Create a visual legend inside the specified element based off of a
                * Chart.js dataset.
                * @param {string} id The id attribute of the element to host the legend.
                * @param {Array.<Object>} items A list of labels and colors for the legend.
                */
                function generateLegend(id, items) {
                    var legend = document.getElementById(id);
                    legend.innerHTML = items.map(function(item) {
                      var color = item.color || item.fillColor;
                      var label = item.label;
                      return '<li><i style="background:' + color + '"></i>' + label + '</li>';
                    }).join('');
                }



                // Set some global Chart.js defaults.
                Chart.defaults.global.animationSteps = 60;
                Chart.defaults.global.animationEasing = 'easeInOutQuart';
                Chart.defaults.global.responsive = true;
                Chart.defaults.global.maintainAspectRatio = false;


            });
        }
    }

})();