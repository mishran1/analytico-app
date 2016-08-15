(function () {
    'use strict';

    angular
        .module('app')
        .controller('Community.IndexController', Controller)

    function Controller(UserService, $scope, $rootScope, $window) {
        // For loading Google Analytics
        $window.location.href = '/app/#/community';
        var dataMC = null;

        function initController() {
            // get all users
            UserService.GetAll().then(function (users) {
              console.log(users);
            });

            /*
            UserService.GetCurrent().then(function (user) {
              dataMC = user.dataMC;
            })
            .then(function() {
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
                        data: dataMC[0].obj1
                    }],

                    drilldown: {
                        series: dataMC[1].obj2
                    }
                });

                var click_rates = [];
                var open_rates = [];
                var names = [];

                dataMC[2].obj3.forEach(function(row, i) {
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
                        data: dataMC[3].obj4
                    }],

                    drilldown: {
                        series: dataMC[4].obj5
                    }
                });
            });
        */
        }
        initController();
    }

})();