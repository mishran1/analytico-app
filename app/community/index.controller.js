(function () {
    'use strict';

    angular
        .module('app')
        .controller('Community.IndexController', Controller)

    function Controller(UserService, $scope, $rootScope, $window) {
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
                UserService.GetMailChimpCommunityData(user.username).then(function (dataMC) {
                    console.log(dataMC);
                    console.log(user.dataMC);
                    var click_rates = [];
                    var open_rates = [];
                    var names = [];
                    user.dataMC[2].obj3.forEach(function(row, i) {
                      click_rates.push(row.click_rate);
                      open_rates.push(row.open_rate);
                      names.push(row.title);
                    });

                    Highcharts.chart('container1', {
                        title: {
                          text: 'Engagement Analysis'
                        },
                        xAxis: {
                          categories: names
                        },
                        labels: {
                            items: [{
                                html: 'Total fruit consumption',
                                style: {
                                    left: '50px',
                                    top: '18px',
                                    color: (Highcharts.theme && Highcharts.theme.textColor) || 'black'
                                }
                            }]
                        },
                        credits: {
                          enabled: false
                        },
                        yAxis: {
                         plotLines: [{
                           color: 'blue',
                           width: 2,
                           value: dataMC[0].avgClickRate,
                           dashStyle: 'longdashdot'              
                         },{
                           color: 'red',
                           width: 2,
                           value: dataMC[0].avgOpenRate,
                           dashStyle: 'longdashdot'              
                         }]
                        },
                                                series: [{
                            type: 'column',
                            name: 'Click Rate',
                            data: click_rates
                        }, {
                            type: 'column',
                            name: 'Open Rate',
                            data: open_rates
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
                    });
                });

                // Set the theme
                    Highcharts.theme = {
                        colors: ['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572', 
                                 '#FF9655', '#FFF263', '#6AF9C4'],
                        chart: {
                            backgroundColor: {
                                linearGradient: [0, 0, 500, 500],
                                stops: [
                                    [0, 'rgb(255, 255, 255)'],
                                    [1, 'rgb(255, 250, 250)']
                                ]
                            },
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

                /**
                * Draw the a chart.js bar chart with data from the specified view that
                * overlays session data for the current year over session data for the
                * previous year, grouped by month.
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

                        var data = {
                            labels : labels,
                            datasets : [
                              {
                                label: 'Last Month',
                                fillColor : 'rgba(220,220,220,0.5)',
                                strokeColor : 'rgba(220,220,220,1)',
                                data : data2
                              },
                              {
                                label: 'This Month',
                                fillColor : 'rgba(151,187,205,0.5)',
                                strokeColor : 'rgba(151,187,205,1)',
                                data : data1
                              }
                            ]
                        };


                        Highcharts.chart('container2', {

                          chart: {
                                type: 'areaspline'
                            },

                          title: {
                                text: ''
                          },

                          plotOptions: {
                                column: {
                                    depth: 15
                                }
                          },

                          xAxis: {
                            categories: labels
                            },

                          yAxis: {
                              title: {
                                  text: 'AOV'
                              }
                          },

                          tooltip: {
                              pointFormat: '{series.name}: <b>{point:.1f}</b>'
                          },

                          series: [{
                              name: 'Last Month',
                              data: data2
                          }, {
                              name: 'This Month',
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