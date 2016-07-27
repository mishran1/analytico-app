(function () {
    'use strict';

    angular
        .module('app')
        .controller('Home.IndexController', Controller);

    function Controller(UserService, $rootScope) {
        var vm = this;

        vm.user = null;

        // For loading Google Analytics
        $rootScope.flag = '1';

        initController($rootScope);

        function initController($rootScope) {
            if (!($rootScope.mailchimp)) {
                UserService.GetCurrent().then(function (user) {
                    UserService.GetMC().then(function(data) {
                        $rootScope.mailchimp = data;
                    })
                });
            }
        }
    }

})();