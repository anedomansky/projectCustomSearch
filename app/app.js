var app = angular.module('myApp',  ['ui.router']);

app.config(['$stateProvider', function($stateProvider) {

	$stateProvider
	.state('analyze', {
		templateUrl: './app/components/analyze/analyze.html'
	})

	.state('chronicle', {
		templateUrl: './app/components/chronicle/chronicle.html'
	})
	.state('default', {
		url: '?query&a&h',
		controller: 'RequestCtrl',
		templateUrl : './app/components/analyze/analyze.html'
	});
}]);

/** Begin Angular Services */
app.service('TopicsService', function() {
	this.topics = {};
	this.setTopics = function(topics) {
		this.topics = topics;
	}
	this.selectedTopics = function() {
		var selectedTopics = "";
		for (var topicName in this.topics) {
			if( this.topics[topicName] ) {
				selectedTopics += topicName + " ";
			}
		}
		return selectedTopics;
	}

	this.getAll = function() {	
		return Object.keys(this.topics);
	}

	this.changeStatus = function(topic) {
		this.topics[topic] = !this.topics[topic];
	}

	this.setStatus = function(topic, status) {
		this.topics[topic] = status;
	}
});

app.service('KeywordsService', function() {
	this.keywords = {}; // all keywords
	this.topKeywords = []; // top 4 keywords

	/** Functions */
	this.setKeywords = function(keywords) {
		this.keywords = keywords;
	}
	this.selectedKeywords = function() {
		var selectedKeywords = "";
		for (var keywordName in this.keywords) {
			if( this.keywords[keywordName] ) {
				selectedKeywords += keywordName + " ";
			}
		}
		return selectedKeywords;
	}

	this.getAll = function() {	
		return Object.keys(this.keywords);
	}

	this.changeStatus = function(keyword) {
		this.keywords[keyword] = !this.keywords[keyword];
	}

	this.setStatus = function(keyword, status) {
		this.keywords[keyword] = status;
	}

	this.getTopKeywords = function() {
		return this.topKeywords;
	}

	this.setTopKeywords = function(topKeywords) {
		this.topKeywords = topKeywords;
	}

	/** End Functions */
});

app.service('PastQueriesService', function() {
	this.queries = {query1: true, query2: false};
	this.selectedQuery = function() {
		var selectedQuery = "";
		for (var queryName in this.queries) {
			if( this.queries[queryName] ) {
				selectedQuery += queryName + " ";
			}
		}
		return selectedQuery;
	}
});

/** End Angular Services */

/** Begin Angular Controllers */
app.controller('RequestCtrl', ['$scope', '$state', '$stateParams', 'KeywordsService', 'TopicsService',
	function($scope, $state, $stateParams, KeywordsService, TopicsService) {

	/** Functions */
	/* convert array to Object */
	$scope.arrToObject = function(arr) {
		var rv = {};
		for (var i = 0,len=arr.length; i<len; ++i) {
			if (arr[i] !== undefined) {
				rv[arr[i]] = false;
			}
		}
		return rv;
	}
	/* Get the request parameters from the url and place them as keywords and topics */
	$scope.processRequestParameter = function() {
		var keywords = [];
		var topics = [];
		var topKeywords = [];
		var keywordsObj = {};
		var topicsObj = {};
		// fill table with keywords:
		keywords = $stateParams.a.split(";");
		// fill most important keywords:
		for (var i=0; i<4; i++) {
			topKeywords.push(keywords[i]);
		}
		KeywordsService.setTopKeywords(topKeywords);
		keywordsObj = $scope.arrToObject(keywords);
		KeywordsService.setKeywords(keywordsObj);
		// fill table with topics:
		topics = $stateParams.h.split(";");
		topicsObj = $scope.arrToObject(topics);
		TopicsService.setTopics(topicsObj);
		// preselect the top 4 keywords
		for (var i = 0; i<4; i++) {
			keywordsObj[keywords[i]] = true;
		}
	}
	/** End Functions */
	$scope.processRequestParameter();

}]);

app.controller('SideMenuCtrl', function($scope) {

});

app.controller('DropdownMenuCtrl', ['$scope', '$state',
	function($scope, $state) {
	$scope.changeView = function(destination) {
		$state.go(destination);
	}
}]);

app.controller('KeywordsMenuCtrl', function($scope, $rootScope, KeywordsService, TopicsService) {
	$scope.keywords = KeywordsService.keywords;

	// user clicked a checkbox:
	$scope.clicked = function(keyword) {
		var status = $scope.keywords[keyword];

		if (TopicsService.getAll().indexOf(keyword) > 0) { //selected keyword is also a topic
			TopicsService.setStatus(keyword, status);
		}
		//notify SearchInputCtrl:
		$rootScope.$broadcast('selectedTermsChanged', { term: keyword, status: status });

	}

	/* initialization */
	$scope.init = function() {
		// The objects are already set to true, but if the keywords are topics at the same time,
		// they must also be manually clicked to transfer the object status of the keywords to the topics
		$scope.topKeywords = KeywordsService.getTopKeywords();
		for(var i=0; i<4; i++) {
			$scope.clicked($scope.topKeywords[i]);
		}
	}

	$scope.init();

});

app.controller('TopicsMenuCtrl', function($scope, $rootScope, TopicsService, KeywordsService) {
	$scope.topics = TopicsService.topics;

	// user clicked a checkbox:
	$scope.clicked = function(topic) {
		var status = $scope.topics[topic];

		if (KeywordsService.getAll().indexOf(topic) > 0) { //selected topic is also a keyword
			KeywordsService.setStatus(topic, status);
		}
		//notify SearchInputCtrl:
		$rootScope.$broadcast('selectedTermsChanged', { term: topic, status: status });
	}
});

app.controller('PastQueriesMenuCtrl', function($scope, PastQueriesService) {
	$scope.pastQueries = PastQueriesService.queries;
	$scope.change = function() {
	}
});

app.controller('SearchInputCtrl', function($scope, TopicsService, KeywordsService) {
	$scope.topicsService = TopicsService;
	$scope.keywordsService = KeywordsService;
	$scope.queryInputTemplate = ""; // buffer for search bar
	$scope.queryInput = ""; // search bar
	$scope.queryInputArr = []; // search bar items as array
	$scope.selectedTerms = [];
	$scope.diff = [];

	/** Functions */
	$scope.onlyUnique = function(value, index, self) {
		return self.indexOf(value) === index;
	}

	$scope.symmetricDifference = function(a1, a2) {
		var result = [];
		for (var i = 0; i < a1.length; i++) {
			if (a2.indexOf(a1[i]) === -1 && result.indexOf(a1[i]) === -1) { // new difference found
				result.push(a1[i]);
			}
		}
		for (i = 0; i < a2.length; i++) {
			if (a1.indexOf(a2[i]) === -1 && result.indexOf(a2[i]) === -1) {
				result.push(a2[i]);
			}
		}
		return result;
	}
	/** End Functions */

	/** Angular Functions */

	/* a term was selected or deselected */
	$scope.$on('selectedTermsChanged', function(event, args) {
		var status = args.status; // true for selected; false for deselected
		var term = args.term; // keyword/topic
		var queryLength = $scope.queryInput.length;
		if (status) { // add term to search bar
			if (queryLength === 0) { // first term
				$scope.queryInput += term;
			}
			else {
				$scope.queryInput += " " + term;
			}
		}
		else { //remove term from search bar
			var regex = term + "(\$| )";
			var regExp;
			var index = $scope.queryInput.search(regex); // first occurrence of the term
			if (index) { // it is not the first term in the search bar
				regex = " " + regex;
				regExp = new RegExp(regex,"g");
				var lastIndex = $scope.queryInput.lastIndexOf(term);
				if (lastIndex + term.length === queryLength) {
					// it is the last term in the search bar
					$scope.queryInput = $scope.queryInput.replace(regExp,"");
				}
				else {
					$scope.queryInput = $scope.queryInput.replace(regExp," ");
				}
			}
			else { // it is the first term in the search bar
				regExp = new RegExp(regex,"g");
				$scope.queryInput = $scope.queryInput.replace(regExp,"");
			}
		}
	});

	/* terms were selected or deselected */
	$scope.$watchGroup(['keywordsService.selectedKeywords()', 'topicsService.selectedTopics()'], function(newValues) {
		setTimeout(function() {
			angular.element(document.querySelector('#customSearch')).click(); // execute google search
		}, 0);
		// newValues array contains the current values of the watch expressions
		$scope.selectedKeywords = newValues[0].split(" ");
		$scope.selectedTopics = newValues[1].split(" ");
		$scope.selectedTerms = $scope.selectedKeywords.concat($scope.selectedTopics);
	});

	/*user manually change the queryInput */
	$scope.change = function() {
		$scope.queryInputArr = $scope.queryInput.split(" ");

		$scope.diff = $scope.symmetricDifference($scope.queryInputArr, $scope.selectedTerms);

		for(var i = 0; i < $scope.diff.length; i++) {
			// term must be keyword or topic
			if (KeywordsService.getAll().indexOf($scope.diff[i]) > 0) { // it is a keyword
				KeywordsService.changeStatus($scope.diff[i]);
			}
			if (TopicsService.getAll().indexOf($scope.diff[i]) > 0) { // it is a topic
				TopicsService.changeStatus($scope.diff[i]);
			}
		}
		/** End Angular Functions */
	}

	//$scope.change(); // call function to select topics that are also keywords
});

//Does not do anything at the moment
app.controller('SearchResultsCtrl', function($scope) {
	$scope.init = function() {
	}

	$scope.init();
});

/** End Angular Controllers */

//Setup for the Custom Google Search

//Hook callback into the rendered Google Search
window.__gcse = {
		callback: googleCSELoaded
}; 
function googleCSELoaded() {
	// initial search after the page is loaded for the first time
	var searchText = $("#q").val();
	console.log(searchText);
	google.search.cse.element.render({gname:'searchOnlyCSE', div:'results', tag:'searchresults-only', attributes:{linkTarget:''}});
	var element = google.search.cse.element.getElement('searchOnlyCSE');
	element.execute(searchText);

	// triggers every following search
	$("#customSearch").click(function() {
		var searchText = $("#q").val();
		console.log(searchText);
		google.search.cse.element.render({gname:'searchOnlyCSE', div:'results', tag:'searchresults-only', attributes:{linkTarget:''}});
		var element = google.search.cse.element.getElement('searchOnlyCSE');
		element.execute(searchText);
	})
}

//Custom Google Search
(function() {
	var cx = '003813809171160788124:z54qpilp6j4';
	var gcse = document.createElement('script');
	gcse.type = 'text/javascript';
	gcse.async = true;
	gcse.src = 'https://cse.google.com/cse.js?cx=' + cx;
	var s = document.getElementsByTagName('script')[0];
	s.parentNode.insertBefore(gcse, s);
})();