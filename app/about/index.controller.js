(function () {
    'use strict';

    angular
        .module('app')
        .controller('About.IndexController', Controller);

    function Controller(UserService, $rootScope) {
        var vm = this;

        vm.user = null;

        // For loading Google Analytics
        $rootScope.flag = '1';
        $rootScope.flagH = '1';

        initController();

        function initController() {
            // get current user
            UserService.GetCurrent().then(function (user) {
                vm.user = user;
            });
        }
    }

})();