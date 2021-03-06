﻿(function () {
    'use strict';

    angular
        .module('app', ['ui.router', 'gridster', 'ui.bootstrap'])
        .config(config)
        .run(run);

    function config($stateProvider, $urlRouterProvider) {
        // default route
        $urlRouterProvider.otherwise("/");

        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'home/index.html',
                controller: 'Home.IndexController',
                data: { activeTab: 'home' }
            })
            .state('account', {
                url: '/account',
                templateUrl: 'account/index.html',
                controller: 'Account.IndexController',
                controllerAs: 'vm',
                data: { activeTab: 'account' }
            })
            .state('analytics', {
                url: '/analytics',
                templateUrl: 'analytics/index.html',
                controller: 'Analytics.IndexController',
                controllerAs: 'vm',
                data: { activeTab: 'analytics' }
            })
            .state('community', {
                url: '/community',
                templateUrl: 'community/index.html',
                controller: 'Community.IndexController',
                controllerAs: 'vm',
                data: { activeTab: 'community' }
            })
            .state('about', {
                url: '/about',
                templateUrl: 'about/index.html',
                controller: 'About.IndexController',
                controllerAs: 'vm',
                data: { activeTab: 'about' }
            })
            .state('logout', {
                url: '/logout',
                templateUrl: '', // Must include templateUrl, even if blank
                controller: 'logout.LogoutController',
                controllerAs: 'vm',
                data: { activeTab: 'logout' }
            });
    }

    function run($http, $rootScope, $window) {
        // add JWT token as default auth header
        $http.defaults.headers.common['Authorization'] = 'Bearer ' + $window.jwtToken;

        // update active tab on state change
        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            $rootScope.activeTab = toState.data.activeTab;
        });
    }



    // manually bootstrap angular after the JWT token is retrieved from the server
    $(function () {
        // get JWT token from server
        $.get('/app/token', function (token) {
            window.jwtToken = token;
            angular.bootstrap(document, ['app']);
        });
    });
})();