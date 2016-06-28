(function () {
    'use strict';

    angular
        .module('app')
        .controller('Analytics.IndexController', Controller)

        // Directive for generic chart, pass in chart options
        .directive('hcChart', function () {
            return {
                restrict: 'E',
                template: '<div></div>',
                scope: {
                    options: '='
                },
                link: function (scope, element) {
                    Highcharts.chart(element[0], scope.options);
                }
            };
        })
        
        // Directive for pie charts, pass in title and data only    
        .directive('hcPieChart', function () {
            return {
                restrict: 'E',
                template: '<div></div>',
                scope: {
                    title: '@',
                    data: '='
                },
                link: function (scope, element) {
                    Highcharts.chart(element[0], {
                        chart: {
                            type: 'pie'
                        },
                        credits: {
                            enabled: false
                        },
                        title: {
                            text: scope.title
                        },
                        plotOptions: {
                            pie: {
                                allowPointSelect: true,
                                cursor: 'pointer',
                                dataLabels: {
                                    enabled: true,
                                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                                }
                            }
                        },
                        series: [{
                            data: scope.data
                        }]
                    });
                }
            };
        })

    function Controller($scope, $rootScope, $window) {
        // For loading Google Analytics
        $window.location.href = '/app/#/analytics';
        if($rootScope.flag == '1'){
            $rootScope.flag = '0';
            $window.location.reload();
        }
        // Sample options for first chart
        $scope.chartOptions = {
            title: {
                text: 'Temperature data'
            },
            credits: {
                enabled: false
            },
            xAxis: {
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            },

            series: [{
                data: [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
            }]
        };

        // Sample data for pie chart
        $scope.pieData = [{
                name: "Microsoft Internet Explorer",
                y: 56.33
            }, {
                name: "Chrome",
                y: 24.03,
                sliced: true,
                selected: true
            }, {
                name: "Firefox",
                y: 10.38
            }, {
                name: "Safari",
                y: 4.77
            }, {
                name: "Opera",
                y: 0.91
            }, {
                name: "Proprietary or Undetectable",
                y: 0.2
        }]
    }

})();