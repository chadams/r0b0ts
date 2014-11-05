angular.module('magic', ['ngAnimate', 'ngAudio'])
	.controller('MagicController', function($scope, $timeout){

		var SECONDS_TO_SHOW_WELCOME_MESSAGE = 4;

		var ctrl = this;

    var socket = io();

    socket.on('magic', function(msg){
      $scope.$apply(function(){
      	ctrl.magic(msg);
      });
    });

    socket.on('welcome', function(obj){
      $scope.$apply(function(){
      	ctrl.welcome(obj);
      });
    });


		ctrl.messages = [];
		ctrl.welcomeShow = false;
		var welcomeTimer;

		ctrl.magic = function(msg){
			ctrl.messages.push(msg);
		};

		ctrl.welcome = function(obj){
			console.log(obj);
			ctrl.welcomeUser = obj;
			ctrl.welcomeShow = true;
			if(welcomeTimer){
				$timeout.cancel(welcomeTimer);
			}
			welcomeTimer = $timeout(function(){
				ctrl.welcomeShow = false;
			}, SECONDS_TO_SHOW_WELCOME_MESSAGE*1000);
		};

	})
	.directive('magic', function($timeout, ngAudio){
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

				// play any sounds
				if(msg.sound){
					ngAudio.play(msg.sound);
				}
				

			}
		};
	});