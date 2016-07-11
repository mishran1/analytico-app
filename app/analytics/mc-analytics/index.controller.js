(function () {
    'use strict';

    angular
        .module('app')
        .controller('MailChimp.IndexController', Controller)

    function Controller(UserService, $rootScope) {
    	$rootScope.flag = 1;
      	console.log("You are accessing the MailChimp Analytics page");

      	var vm = this;

      	vm.user = null;

      	initController();

      	function initController() {
      		UserService.GetCurrent().then(function (user) {
      			UserService.GetMC().then(function(data) {
      				console.log(data);
      			})
      		});
      	}
    }

})();