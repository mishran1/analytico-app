(function () {
    'use strict';

    angular
        .module('app')
        .controller('Analytics.IndexController', Controller)

    function Controller(UserService, $scope, $rootScope, $window) {
        // For loading Google Analytics
        $window.location.href = '/app/#/analytics';
        if ($rootScope.flag == '1') {
            $rootScope.flag = '0';
            $window.location.reload();
        }
        else {
            var data = $rootScope.mailchimp;
            var vm = this;
            vm.user = null;

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
                renderWeekOverWeekChart(data.ids);
                renderYearOverYearChart(data.ids);
                renderTopBrowsersChart(data.ids);
                renderTopCountriesChart(data.ids);
                renderTopProductsChart(data.ids);
              });


              /**
               * Draw the a chart.js line chart with data from the specified view that
               * overlays session data for the current week over session data for the
               * previous week.
               */
              function renderWeekOverWeekChart(ids) {

                // Adjust `now` to experiment with different days, for testing only...
                var now = moment(); // .subtract(3, 'day');

                var thisWeek = query({
                  'ids': ids,
                  'dimensions': 'ga:date,ga:nthDay',
                  'metrics': 'ga:sessions',
                  'start-date': moment(now).subtract(1, 'day').day(0).format('YYYY-MM-DD'),
                  'end-date': moment(now).format('YYYY-MM-DD')
                });

                var lastWeek = query({
                  'ids': ids,
                  'dimensions': 'ga:date,ga:nthDay',
                  'metrics': 'ga:sessions',
                  'start-date': moment(now).subtract(1, 'day').day(0).subtract(1, 'week')
                      .format('YYYY-MM-DD'),
                  'end-date': moment(now).subtract(1, 'day').day(6).subtract(1, 'week')
                      .format('YYYY-MM-DD')
                });

                Promise.all([thisWeek, lastWeek]).then(function(results) {

                  var data1 = results[0].rows.map(function(row) { return +row[2]; });
                  var data2 = results[1].rows.map(function(row) { return +row[2]; });
                  var labels = results[1].rows.map(function(row) { return +row[0]; });

                  labels = labels.map(function(label) {
                    return moment(label, 'YYYYMMDD').format('ddd');
                  });

                  Highcharts.chart('container2', {

                      chart: {
                          type: 'areaspline'
                      },

                      title: {
                          text: 'This Week vs Last Week (by sessions)'
                      },

                      legend: {
                          layout: 'vertical',
                          align: 'left',
                          verticalAlign: 'top',
                          x: 150,
                          y: 100,
                          floating: true,
                          borderWidth: 1,
                          backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
                      },

                      xAxis: {
                          categories: labels
                      },

                      yAxis: {
                          title: {
                              text: 'Users'
                          }
                      },

                      tooltip: {
                          pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                      },

                      plotOptions: {
                          areaspline: {
                              fillOpacity: 0.5
                          }
                      },

                      series: [{
                          name: 'Last Week',
                          data: data2
                      }, {
                          name: 'This Week',
                          data: data1
                      }]

                  });

                });
              }


              /**
               * Draw the a chart.js bar chart with data from the specified view that
               * overlays session data for the current year over session data for the
               * previous year, grouped by month.
               */
              function renderYearOverYearChart(ids) {

                // Adjust `now` to experiment with different days, for testing only...
                var now = moment(); // .subtract(3, 'day');

                var thisYear = query({
                  'ids': ids,
                  'dimensions': 'ga:month,ga:nthMonth',
                  'metrics': 'ga:users',
                  'start-date': moment(now).date(1).month(0).format('YYYY-MM-DD'),
                  'end-date': moment(now).format('YYYY-MM-DD')
                });

                var lastYear = query({
                  'ids': ids,
                  'dimensions': 'ga:month,ga:nthMonth',
                  'metrics': 'ga:users',
                  'start-date': moment(now).subtract(1, 'year').date(1).month(0)
                      .format('YYYY-MM-DD'),
                  'end-date': moment(now).date(1).month(0).subtract(1, 'day')
                      .format('YYYY-MM-DD')
                });

                Promise.all([thisYear, lastYear]).then(function(results) {
                  var data1 = results[0].rows.map(function(row) { return +row[2]; });
                  var data2 = results[1].rows.map(function(row) { return +row[2]; });
                  var labels = ['Jan','Feb','Mar','Apr','May','Jun',
                                'Jul','Aug','Sep','Oct','Nov','Dec'];

                  // Ensure the data arrays are at least as long as the labels array.
                  // Chart.js bar charts don't (yet) accept sparse datasets.
                  for (var i = 0, len = labels.length; i < len; i++) {
                    if (data1[i] === undefined) data1[i] = null;
                    if (data2[i] === undefined) data2[i] = null;
                  }

                  var data = {
                    labels : labels,
                    datasets : [
                      {
                        label: 'Last Year',
                        fillColor : 'rgba(220,220,220,0.5)',
                        strokeColor : 'rgba(220,220,220,1)',
                        data : data2
                      },
                      {
                        label: 'This Year',
                        fillColor : 'rgba(151,187,205,0.5)',
                        strokeColor : 'rgba(151,187,205,1)',
                        data : data1
                      }
                    ]
                  };

                  new Chart(makeCanvas('chart-2-container')).Bar(data);
                  generateLegend('legend-2-container', data.datasets);
                })
                .catch(function(err) {
                  console.error(err.stack);
                });
              }


              /**
               * Draw the a chart.js doughnut chart with data from the specified view that
               * show the top 5 browsers over the past seven days.
               */
              function renderTopBrowsersChart(ids) {

                query({
                  'ids': ids,
                  'dimensions': 'ga:browser',
                  'metrics': 'ga:pageviews',
                  'sort': '-ga:pageviews',
                  'start-date': dateRange['start-date'],
                  'end-date': dateRange['end-date'],
                  'max-results': 5
                })
                .then(function(response) {

                  var data = [];

                  response.rows.forEach(function(row, i) {
                    data.push({ name: row[0], y: +row[1] });
                  });

                  Highcharts.getOptions().colors = Highcharts.map(Highcharts.getOptions().colors, function (color) {
                      return {
                          radialGradient: {
                              cx: 0.5,
                              cy: 0.3,
                              r: 0.7
                          },
                          stops: [
                              [0, color],
                              [1, Highcharts.Color(color).brighten(-0.3).get('rgb')] // darken
                          ]
                      };
                  });

                  Highcharts.chart('container', {

                      chart: {
                        plotBackgroundColor: null,
                        plotBorderWidth: null,
                        plotShadow: false,
                        type: 'pie'
                      },

                      title: {
                          text: 'Top Browsers (by PageView)'
                      },

                      tooltip: {
                          pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                      },

                      plotOptions: {
                          pie: {
                              allowPointSelect: true,
                              cursor: 'pointer',
                              dataLabels: {
                                  enabled: true,
                                  format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                                  style: {
                                      color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                                  },
                                  connectorColor: 'silver'
                              }
                          }
                      },

                      series: [{
                          name: 'Browsers',
                          data: data
                      }]

                  });

                });
              }


              /**
               * Draw the a chart.js doughnut chart with data from the specified view that
               * compares sessions from mobile, desktop, and tablet over the past seven
               * days.
               */
              function renderTopCountriesChart(ids) {
                query({
                  'ids': ids,
                  'dimensions': 'ga:country',
                  'metrics': 'ga:sessions',
                  'sort': '-ga:sessions',
                  'start-date': dateRange['start-date'],
                  'end-date': dateRange['end-date'],
                  'max-results': 5
                })
                .then(function(response) {

                  var data = [];

                  response.rows.forEach(function(row, i) {
                    data.push({
                      name: row[0],
                      y: +row[1]
                    });
                  });

                  Highcharts.chart('container1', {

                      chart: {
                          type: 'pie',
                          options3d: {
                              enabled: true,
                              alpha: 45
                          }
                      },

                      title: {
                          text: 'Top Countries (by sessions)'
                      },

                      tooltip: {
                          pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                      },

                      plotOptions: {
                          pie: {
                              innerSize: 100,
                              depth: 45,
                              allowPointSelect: true,
                              cursor: 'pointer',
                              dataLabels: {
                                  enabled: true,
                                  format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                                  style: {
                                      color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                                  },
                                  connectorColor: 'silver'
                              }
                          }
                      },

                      series: [{
                          name: 'Sessions',
                          data: data
                      }]

                  });

                });
              }

              /**
               * Queries top performing product data from the GA API 
               * @param {string} ids The Google client identifier
               */
              function renderTopProductsChart(ids) {
                query({
                  'ids': ids,
                  'dimensions': 'ga:productName' ,
                  'metrics': 'ga:itemQuantity,ga:revenuePerItem,ga:itemRevenue',
                  'sort' : '-ga:itemRevenue',
                  'start-date': dateRange['start-date'],
                  'end-date': dateRange['end-date'],
                  'max-results': 10
                })
                .then(function(response) {
                  var columnNames = ['Product Name','Quantity Sold','Average Price','Product Revenue'];
                  var headerHTML = '<h3>Top Performing Products</h3>'
                  renderTable(response, 'chart-top-products', headerHTML, columnNames)
                });
              }

              /**
               * Writes a table to index.html containing data returned from the GA API response.
               * @param {Object} response The API response from GA
               * @param {string} id The id attribute of the containing HTML element
               * @param {string} headerHTML The HTML header for this data section
               * @param {string Array} columnNames The column names for this table
               */
              function renderTable(response, id, headerHTML, columnNames) {
                  var output = [];
                  var table = ['<table>', headerHTML];

                  // Create table header row
                  table.push('<tr>');
                  for (var i = 0; i < columnNames.length; i++) {
                      table.push('<th>', columnNames[i], '</th>');
                  }
                  table.push('</tr>');

                  // Create table data rows
                  for (var i = 0; i < response.rows.length; i++) {
                      table.push('<tr>');
                      for (var j = 0; j < response.rows[i].length; j++) {
                          table.push('<td>', response.rows[i][j], '</td>');
                      }
                      table.push('</tr>')
                  } 
                  table.push('</table>')
                  
                  output.push(table.join(''));
                  document.getElementById(id).innerHTML = output.join('');
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
        
              console.log($rootScope.mailchimp);

              Highcharts.chart('mc-container-1', {

                  chart: {
                    type: 'column'
                  },

                  title: {
                      text: 'Mailing List Subscribers'
                  },

                  subtitle: {
                      text: 'Click the columns to view monthly subscribers'
                  },

                  xAxis: {
                      type: 'category'
                  },

                  yAxis: {
                      title: {
                          text: 'Users'
                      }

                  },

                  legend: {
                      enabled: false
                  },

                  plotOptions: {
                      series: {
                          borderWidth: 0,
                          dataLabels: {
                              enabled: true,
                              format: '{point.y}'
                          }
                      }
                  },

                  tooltip: {
                      headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                      pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y}</b> users added to Total Subscribers<br/>'
                  },

                  series: [{
                      name: 'Lists',
                      colorByPoint: true,
                      data: data[0].obj1
                  }],

                  drilldown: {
                      series: data[1].obj2
                  }
              });

              var click_rates = [];
              var open_rates = [];
              var names = [];

              data[2].obj3.forEach(function(row, i) {
                click_rates.push(row.click_rate);
                open_rates.push(row.open_rate);
                names.push(row.name);
              });

              Highcharts.chart('mc-container-2', {
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
                series: [{
                    type: 'column',
                    name: 'Click Rate',
                    data: click_rates
                }, {
                    type: 'column',
                    name: 'Open Rate',
                    data: open_rates
                }, {
                    type: 'pie',
                    name: 'Total consumption',
                    data: [{
                        name: 'Jane',
                        y: 13,
                        color: Highcharts.getOptions().colors[3] // Jane's color
                    }, {
                        name: 'John',
                        y: 23,
                        color: Highcharts.getOptions().colors[1] // John's color
                    }, {
                        name: 'Joe',
                        y: 19,
                        color: Highcharts.getOptions().colors[2] // Joe's color
                    }],
                    center: [20, 20],
                    size: 100,
                    showInLegend: false,
                    dataLabels: {
                        enabled: false
                    }
                }]
              });

              Highcharts.chart('mc-container-3', {

                  chart: {
                    type: 'column'
                  },

                  title: {
                      text: 'Recent List Activity'
                  },

                  subtitle: {
                      text: 'Click the columns to view Daily Activity'
                  },

                  xAxis: {
                      type: 'category'
                  },

                  yAxis: {
                      title: {
                          text: 'Users'
                      }

                  },

                  legend: {
                      enabled: false
                  },

                  plotOptions: {
                      series: {
                          borderWidth: 0,
                          dataLabels: {
                              enabled: true,
                              format: '{point.y}'
                          }
                      }
                  },

                  tooltip: {
                      headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                      pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y}</b> users added to Total Subscribers<br/>'
                  },

                  series: [{
                      name: 'Lists',
                      colorByPoint: true,
                      data: data[3].obj4
                  }],

                  drilldown: {
                      series: data[4].obj5
                  }
              });
        }
    }

})();