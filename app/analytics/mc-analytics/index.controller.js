(function () {
    'use strict';

    angular
        .module('app')
        .controller('MailChimp.IndexController', Controller)

    function Controller($scope, $rootScope, $window) {
      console.log("You are accessing the MailChimp Analytics page");
    }

})();