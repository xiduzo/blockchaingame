(function () {
  'use strict';

  angular
  .module('angulargame')

  .filter('secondsToDateTime', function() {
    return function(seconds) {
      return new Date(1970, 0, 1).setSeconds(seconds);
    };
  })

}());
