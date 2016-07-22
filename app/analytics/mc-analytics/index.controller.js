(function () {
    'use strict';

    angular
        .module('app')
        .controller('MailChimp.IndexController', Controller)

    function Controller(UserService, $rootScope, $scope) {
    	$rootScope.flag = 1;
    	console.log("You are accessing the MailChimp Analytics page");

    	var vm = this;
    	vm.user = null;

  		UserService.GetCurrent().then(function (user) {
  			UserService.GetMC().then(function(data) {
          console.log(data);

          Highcharts.chart('container', {

              chart: {
                type: 'column'
              },

              title: {
                  text: 'Subscribers for mailing Lists'
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
                  data: data.obj1
              }],

              drilldown: {
                  series: data.obj2
              }
          });
  			})
  		});
    }

})();