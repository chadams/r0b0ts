angular.module('magic', ['ngAnimate'])
	.controller('MagicController', function($scope, $timeout){

		var ctrl = this;

    var socket = io();

    socket.on('magic', function(msg){
      $scope.$apply(function(){
      	ctrl.magic(msg);
      });
    });


		ctrl.messages = [];

		ctrl.magic = function(msg){
			ctrl.messages.push(msg);
		};

	})
	.directive('magic', function($timeout){
		return {
			restrict:'E'
			,transclude:true
			,scope:{
				msg:'='
				,host:'='
			}
			,template:'<div class="magic" ng-transclude></div>'
			,link: function(scope, ele, attr, ctrl){

				var messages = scope.host;
				var msg = scope.msg;
				var pause = msg.pause ? msg.pause*1000 : 2000;

				$timeout(function(){
					var indx;
					for(var i = 0; i < messages.length; i++){
						if(messages[i] === msg){
							indx = i;
						}
					}
					if(indx >= 0){
						messages.splice(indx, 1);
					}
				}, pause);

			}
		};
	});