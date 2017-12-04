/* global malarkey:false, moment:false, _:true */
(function() {
  'use strict';

  angular
    .module('angulargame')
    .constant('malarkey', malarkey)
    .constant('moment', moment)


    .constant('API_URL', 'https://api.mlab.com/api/1/databases/blockchainz/collections/')
    .constant('API_KEY', 'BC6Nv1iEK_ZTzlp6IvIxF7jHRMEMREzz')
    ; // end of constants

})();
