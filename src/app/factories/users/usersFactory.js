(function() {
  'use strict';

  angular
    .module('angulargame')
    .factory('Users', function(
      Restangular
    ) {

      var vm = this;

      vm.methods = {
        api: Restangular.service('users')
      };

      return vm.methods;
    });

})();
