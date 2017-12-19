(function() {
  'use strict';

  angular
    .module('angulargame', [
      'ngAnimate',
      'ngCookies',
      'ngTouch',
      'ngSanitize',
      'ngMessages',
      'ngAria',

      // Bower
      'restangular',
      'ui.router',
      'toastr',
      'ngWebSocket',
      'ngDialog',
      'LocalStorageModule',
      'whimsicalRipple',
      'ngSwipeItem',

      // Local modules
      'tabs',
      'countTo'

    ]);

})();
