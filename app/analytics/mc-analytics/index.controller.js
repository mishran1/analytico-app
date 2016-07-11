(function () {
    'use strict';

    angular
        .module('app')
        .controller('MailChimp.IndexController', Controller)

    function Controller($scope, $rootScope, $window) {
    	$rootScope.flag = 1;
      	console.log("You are accessing the MailChimp Analytics page");
    }

})();