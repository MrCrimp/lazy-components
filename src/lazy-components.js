!(function() {
  'use strict';
  
  function LazyComponents($window, $q) {
  
    var self = this;

    this.basePath = '.';

    this.queue = [ /*{path: '.', name: 'svg-viewer', scripts:['lazy.js'], run: function(){}}*/ ];

    this.loaded = { /*'svg-viewer':true'*/ };

    this.loadAll = function() {
      var components = self.queue.map(function loadEach(component) {
        component.pending = true;
        return self.load(component);
      })
      return $q.all(components);
    }

    this.load = function(component) {

      if (angular.isString(component)) {
        component = resolveComponent(component)
      }

      if (!component)
        throw new Error('The lazy component is not registered and cannot load')

      if (!component.name)
        throw new Error('The lazy component must register with name property and cannot load');

      if (self.loaded[component.name]) {
        return $q.when(component);
      }

      var scripts = component.scripts.map(function scriptInComponent(path) {
        return loadItem(path, component);
      });

      return $q.all(scripts).then(function(result) {
        component.pending = false;
        self.loaded[component.name] = true;

        if (angular.isFunction(component.run))
          component.run.apply(component);

        return component;
      });
    }

    function resolveComponent(name) {
      var match = self.queue.filter(function componentFilter(component) {
        return component.name === name;
      });
      return match.length ? match[0] : null;
    }

    function loadItem(path, component) {
      var d = $q.defer();
      var startPath = component.path || self.basePath;
      var newScriptTag = document.createElement('script');
      newScriptTag.type = 'text/javascript';
      newScriptTag.src = startPath ? startPath + '/' + path : path;
      console.log(component.path)
      newScriptTag.setAttribute('data-name', component.name)
      newScriptTag.addEventListener('load', function(ev) {
        d.resolve(component);
      });

      newScriptTag.addEventListener('error', function(ev) {
        d.reject(component);
      });

      window.setTimeout(function() {
        if (component.pending) {
          throw new Error('Component ' + component.name + ' did not load in time.');
        }
      }, 10000);
      document.head.appendChild(newScriptTag);
      return d.promise;
    }
  }
  
  LazyComponents.$inject = ['$window', '$q'];
  
  angular.module('crimp', []).service('lazyComponents', LazyComponents);
})();