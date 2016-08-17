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
            UserService.GetGACommunityData().then(function (dataGA) {
              console.log(dataGA);
            });

            UserService.GetMailChimpCommunityData().then(function (dataMC) {
              console.log(dataMC);
            });
        }

        initController();
    }

})();