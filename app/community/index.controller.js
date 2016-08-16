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
            UserService.GetCommunityData().then(function (users) {
              console.log(users);
            });

        }

        initController();
    }

})();