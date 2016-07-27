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
            UserService.GetCurrent().then(function (user) {
                vm.user = user;
            });
        }
    }

})();