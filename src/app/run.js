(function() {
  'use strict';

  angular
    .module('angulargame')
    .run(runBlock);

  /** @ngInject */
  function runBlock(
    $rootScope,
    $log,
    Global
  ) {

    $rootScope.Global = Global;


    $log.debug('runBlock end');
  }

})();
