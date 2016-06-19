angular.module('ion-google-autocomplete', [])
.directive('googleAutocompleteSuggestion', function($document, $ionicModal, $ionicTemplateLoader, googleAutocompleteService) {
    return {
        restrict: 'A',
        scope: {
            location: '=',//Required
            countryCode: '@',//Optional
            onSelection: '&'//Optional
        },
        link: function($scope, element) {
        
            $scope.search = {
                suggestions: [],
                query: ''
            };

            var template = [
                '<ion-modal-view>',
                '<ion-header-bar class="item-input-inset">',
                '<label class="item-input-wrapper">',
                '<i class="icon ion-search placeholder-icon"></i>',
                '<input type="search" ng-model="search.query" placeholder="Search">',
                '</label>',
                '<button class="ion-autocomplete-cancel button button-clear button-dark ng-binding" ng-click="close()" translate>Done</button>',
                '</ion-header-bar>',
                '<ion-content>',
                '<ion-list>',
                '<ion-item ng-show="search.error">',
                '{{search.error}}',
                '</ion-item>',
                '<ion-item ng-repeat="suggestion in search.suggestions" ng-click="choosePlace(suggestion)">',
                '{{suggestion.description}}',
                '</ion-item>',
                '</ion-list>',
                '<div class="padding">',
                '<img src="https://developers.google.com/maps/documentation/places/images/powered-by-google-on-white.png" style="margin-left: 5px" alt="" />',
                '</div>',
                '</ion-content>',
                '</ion-modal-view>'
            ].join('')            

            var popupPromise = $ionicTemplateLoader.compile({
                template: template,
                scope: $scope,
                appendTo: $document[0].body
            });

            popupPromise.then(function (el) {
                
                var searchInputElement = angular.element(el.element.find('input'));
            
                element[0].addEventListener('focus', function(event) {
                    
                    $scope.search.query = '';
                    $scope.open();
                });
                    
                $scope.open = function() {
                    
                    el.element.css('display', 'block');
                    searchInputElement[0].focus();
                };
                
                $scope.close = function() {
                    
                    el.element.css('display', 'none');
                };

                $scope.close();
                
                $scope.choosePlace = function(place) {
                    
                    googleAutocompleteService.getDetails(place.place_id).then(function(location) {
                        
                        $scope.location = location;
                        $scope.close();
                        
                        if ($scope.onSelection !== undefined)
                            $scope.onSelection({ location: location });
                    });
                };
                
                $scope.$watch('search.query', function(newValue) {
                    
                    if (newValue) {
                        
                        googleAutocompleteService.searchAddress(newValue, $scope.countryCode).then(function(result) {
                            
                            $scope.search.error = null;
                            $scope.search.suggestions = result;
                        }, function(status) {
                            
                            $scope.search.error = "There was an error :( " + status;
                        });
                    }
                });
            });
        }
    }
})
angular.module('ion-google-autocomplete')
.factory('googleAutocompleteService', function ($q) {

  var autocompleteService = new google.maps.places.AutocompleteService();
  var detailsService = new google.maps.places.PlacesService(document.createElement("input"));
  
  return {
    searchAddress: function(input, countryCode) {
      var dfd = $q.defer();

      autocompleteService.getPlacePredictions({
        input: input,
        componentRestrictions: countryCode ? { country: countryCode } : undefined
      }, function(result, status) {
          
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            
          console.log(status);
          dfd.resolve(result);
        }
        else
          dfd.reject(status);
      });

      return dfd.promise;
    },
    getDetails: function(placeId) {
        
      var dfd = $q.defer();
      
      detailsService.getDetails({placeId: placeId}, function(result) {
          
        dfd.resolve(result);
      });
      
      return dfd.promise;
    }
  };
})
