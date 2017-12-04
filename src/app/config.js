(function() {
  'use strict';

  angular
    .module('angulargame')
    .config(config);

  /** @ngInject */
  function config(
    $logProvider,
    toastrConfig,
    RestangularProvider,
    API_URL,
    API_KEY
  ) {
    // Enable log
    $logProvider.debugEnabled(true);

    // RestangularProvider
    RestangularProvider
    .setBaseUrl(API_URL)
    .setDefaultRequestParams({apiKey: API_KEY});

    angular.extend(toastrConfig, {
      autoDismiss: false,
      containerId: 'toast-container',
      maxOpened: 15,
      newestOnTop: true,
      positionClass: 'toast-top-right',
      preventDuplicates: false,
      preventOpenDuplicates: false,
      target: 'body'
    });


  }

})();
