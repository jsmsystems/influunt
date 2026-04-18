'use strict';

/**
 * @ngdoc directive
 * @name influuntApp.directive:helperEndereco
 * @description
 * # helperEndereco
 */
angular.module('influuntApp')
  .directive('helperEndereco', ['PLACES_API', '$timeout',
    function (PLACES_API, $timeout) {
      return {
        restrict: 'A',
        scope: {
          localizacao: '=',
          anelId: '=?'
        },
        link: function (scope, element) {
          var URL = PLACES_API.baseUrl + '/endereco';
          var inputEventNamespace = '.helper-endereco';
          var shouldPersistTypedValue = false;
          var currentTypedValue = '';

          var bindSearchField = function() {
            var select2 = $(element).data('select2');
            var $searchField = _.get(select2, 'dropdown.$search');

            if (!$searchField || $searchField.length === 0) {
              return;
            }

            $searchField.off(inputEventNamespace)
              .on('input' + inputEventNamespace, function() {
                currentTypedValue = $.trim($(this).val());
              })
              .on('keydown' + inputEventNamespace, function(ev) {
                if (ev.which === 13 && currentTypedValue) {
                  ev.preventDefault();
                  ev.stopPropagation();
                  shouldPersistTypedValue = true;
                  persistTypedValue(currentTypedValue);
                  $(element).select2('close');
                }
              });
          };

          var unbindSearchField = function() {
            var select2 = $(element).data('select2');
            var $searchField = _.get(select2, 'dropdown.$search');

            if ($searchField && $searchField.length > 0) {
              $searchField.off(inputEventNamespace);
            }
          };

          var ensureOption = function(value) {
            if (!value) { return; }

            var escapedValue = value.replace(/"/g, '\\"');
            var selector = 'option[value="' + escapedValue + '"]';
            var $option = $(element).find(selector);

            if ($option.length === 0) {
              $option = $('<option></option>').val(value).text(value);
              $(element).append($option);
            }

            return $option;
          };

          var persistTypedValue = function(value) {
            if (!value) { return; }

            ensureOption(value);
            $(element).val(value).trigger('change');
          };

          var getSelect2Object = function(obj) {
            var endereco = obj.logradouro1;
            var texto = [endereco.tipo, endereco.titulo, endereco.nome, ',', endereco.altNum, ',', endereco.distrito]
                .join(' ')
                .replace(/\,\s+\,/, ',')
                .replace(/\s\,/, ',')
                .replace(/\s+/, ' ');
            var id = [endereco.tipo, endereco.titulo, endereco.nome, endereco.altNum]
                .join(' ')
                .replace(/\s+/, ' ');
            return { id: id, text: texto };
          };

          $(element).select2(
            {
              ajax: {
                url: function(params) { return [URL, '/', params.term].join(''); },
                dataType: 'json',
                delay: 250,
                timeout: 3000,
                data: {},
                processResults: function (data) {
                  var result = _.get(data, 'ArrayOfEndereco.Endereco');
                  if (_.isArray(result)) {
                    return { results: _.chain(result).map(getSelect2Object).uniqBy('text').take(5).value() };
                  } else if (_.isObject(result)) {
                    return { results: [getSelect2Object(result)] };
                  } else {
                    return { results: [] };
                  }
                },
                cache: true
              },
              minimumInputLength: 3,
              tags: true,
              createTag: function(params) {
                var term = $.trim(params.term);

                if (term === '') {
                  return null;
                }

                return {
                  id: term,
                  text: term,
                  newTag: true
                };
              }
            }
          )
          .on('select2:open', function() {
            shouldPersistTypedValue = true;
            currentTypedValue = '';
            bindSearchField();
          })
          .on('select2:select', function() {
            shouldPersistTypedValue = false;
            currentTypedValue = '';
          })
          .on('change', function(ev) {
            $timeout(function() {
              scope.localizacao = ev.target.value;
            });
          })
          .on('select2:closing', function() {
            unbindSearchField();
            if (shouldPersistTypedValue && currentTypedValue) {
              $timeout(function() {
                persistTypedValue(currentTypedValue);
              });
            }
            shouldPersistTypedValue = false;
            currentTypedValue = '';
          })
          ;

          var cacheAnel = null;
          scope.$watch('localizacao', function(val, prevVal) {
            $timeout(function() {
              if (!!scope.anelId && cacheAnel !== scope.anelId || !!val && typeof prevVal === 'undefined') {
                cacheAnel = scope.anelId;
                ensureOption(val);
                $(element).val(val).trigger('change');
              }
            }, 1000);
          });
        }
      };
    }]);
