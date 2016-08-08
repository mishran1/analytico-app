(function () {
    'use strict';

    angular
        .module('app')
        .controller('Home.IndexController', ['$scope', '$timeout', 'UserService',
            function ($scope, $timeout, UserService, $watch) {
                let dataMC;
                var names = [];
                var click_rates = [];
                var open_rates = [];

                // Set the theme
                Highcharts.theme = {
                    colors: ['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572', 
                             '#FF9655', '#FFF263', '#6AF9C4'],
                    chart: {
                        backgroundColor: {
                            linearGradient: [0, 0, 500, 500],
                            stops: [
                                [0, 'rgb(255, 255, 255)'],
                                [1, 'rgb(0, 4, 255)']
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

                UserService.GetCurrent().then(function (user) {
                    dataMC = user.dataMC;
                })
                .then(function() {
                    setTimeout(function() { 
                        chart0();
                        chart1();
                    }, 500);

                    dataMC[2].obj3.forEach(function(row, i) {
                      click_rates.push(row.click_rate);
                      open_rates.push(row.open_rate);
                      names.push(row.title);
                    });
                });

                $scope.gridsterOptions = {
                    margins: [20, 20],
                    columns: 4,
                    draggable: {
                        handle: 'h3'
                    },
                    rowHeight: 'match'
                };

                $scope.dashboard = {
                        name: 'Home',
                        widgets: [{
                            col: 0,
                            row: 0,
                            sizeY: 2,
                            sizeX: 2,
                            index: 0,
                            name: "Widget 1"
                        }, {
                            col: 2,
                            row: 0,
                            sizeY: 2,
                            sizeX: 2,
                            index: 1,
                            name: "Widget 2"
                        }]
                };

                $scope.clear = function() {
                    $scope.dashboard.widgets = [];
                };

                var chart0 = function () {
                  Highcharts.chart('mc-container-0', {
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

                    credits: {
                      enabled: false
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
                  })
                };

                var chart1 = function () {
                  Highcharts.chart('mc-container-1', {
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
                    }]
                  });
                }


                $scope.$watch('[dashboard.widgets[0].sizeX, [dashboard.widgets[0].sizeY]]', function(newX, oldX) {
                  if (newX !== oldX) {
                    setTimeout(function() { 
                        chart0();
                    }, 2000);
                  }
                });

                $scope.$watch('[dashboard.widgets[1].sizeX, [dashboard.widgets[1].sizeY]]', function(newX, oldX) {
                  if (newX !== oldX) {
                    setTimeout(function() { 
                        chart1();
                    }, 2000);
                  }
                });

                $scope.addWidget = function() {
                    $scope.dashboard.widgets.push({
                        name: "New Widget",
                        sizeX: 1,
                        sizeY: 1
                    });
                };
            }
        ])

        .controller('CustomWidgetCtrl', ['$scope', '$modal',
            function ($scope, $modal) {
                $scope.remove = function(widget) {
                    $scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
                };

                $scope.openSettings = function(widget) {
                    $modal.open({
                        scope: $scope,
                        templateUrl: 'home/widget_settings.html',
                        controller: 'WidgetSettingsCtrl',
                        resolve: {
                            widget: function() {
                                return widget;
                            }
                        }
                    });
                };
            }
        ])

        .controller('WidgetSettingsCtrl', ['$scope', '$timeout', '$rootScope', '$modalInstance', 'widget',
            function ($scope, $timeout, $rootScope, $modalInstance, widget) {
                $scope.widget = widget;

                $scope.form = {
                    name: widget.name,
                    sizeX: widget.sizeX,
                    sizeY: widget.sizeY,
                    col: widget.col,
                    row: widget.row
                };

                $scope.sizeOptions = [{
                    id: '1',
                    name: '1'
                }, {
                    id: '2',
                    name: '2'
                }, {
                    id: '3',
                    name: '3'
                }, {
                    id: '4',
                    name: '4'
                }];

                $scope.dismiss = function() {
                    $modalInstance.dismiss();
                };

                $scope.remove = function() {
                    $scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
                    $modalInstance.close();
                };

                $scope.submit = function() {
                    angular.extend(widget, $scope.form);

                    $modalInstance.close(widget);
                };

            }
        ]);

        (function () {

        })
})();