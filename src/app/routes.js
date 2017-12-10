(function() {
  'use strict';

  angular
    .module('angulargame')
    .config(routerConfig);

  /** @ngInject */
  function routerConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/routes/main/main.html',
        controller: 'MainController',
        controllerAs: 'main'
      });

    $stateProvider
      .state('room', {
        url: '/room/:roomId',
        templateUrl: 'app/routes/room/room.html',
        controller: 'RoomController',
        controllerAs: 'roomCtrl'
      });

    $urlRouterProvider.otherwise('/');
  }

})();
