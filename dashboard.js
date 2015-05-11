var JSON = JSON || {};
// implement JSON.stringify serialization
JSON.stringify = JSON.stringify || function (obj) {
	var t = typeof (obj);
	if (t != "object" || obj === null) {
		// simple data type
		if (t == "string") obj = '"' + obj + '"';
		return String(obj);
	}
	else {
		// recurse array or object
		var n, v, json = [], arr = (obj && obj.constructor == Array);
		for (n in obj) {
			v = obj[n];
			t = typeof(v);
			if (t == "string") v = '"' + v + '"';
			else if (t == "object" && v !== null) v = JSON.stringify(v);
			json.push((arr ? "" : '"' + n + '":') + String(v));
		}
		return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
	}
};
function initColumns() {
	$(".column").sortable({
		connectWith: ".column",
		receive: function (event, ui) {
			widgetMoved();
		},
		update: function (event, ui) {
			widgetMoved();
		}
	});

	$(".portlet").addClass("ui-widget ui-widget-content ui-helper-clearfix ui-corner-all")
		.find(".portlet-header")
		.addClass("ui-widget-header ui-corner-all")
		.prepend("<span class='ui-icon ui-icon-minusthick'></span>")
		.end()
		.find(".portlet-content");

	$(".portlet-header .ui-icon").click(function () {
		$(this).toggleClass("ui-icon-minusthick").toggleClass("ui-icon-plusthick");
		$(this).parents(".portlet:first").find(".portlet-content").toggle();
	});

	$(".column").disableSelection();
}
google.load("feeds", "1");
var widgetCounter = 0;

function makePortlet(url, col, start, content) {
	var portlet = $("<div class='portlet'></div>");
	portlet.data("url", url);
	var portletHeader = $("<div class='portlet-header'><div class='title'></div><div class='close' title='Remove this feed'>&#215;</div></div>");
	var portletContent = $("<div class='portlet-content" + (start ? " highlight" : "") + "'></div>");
	portletContent.append(content);
	portlet.append(portletHeader);
	portlet.append(portletContent);
	if (start) {
		$($(".column")[col]).hide().prepend(portlet).fadeIn('slow', function () {
			portletContent.removeClass("highlight", 2000);
		});
	} else {
		$($(".column")[col]).append(portlet);
	}
	portlet.find(".close").on("click", function (e) {
		var idx = portlet.index();
		portlet.fadeOut();
		if (feeds[col].length == 1) {
			feeds[col] = [];
		} else {
			feeds[col].splice(idx, 1);
		}
		setUrl();
	});
	return portlet;
}

/**
 * Gets a thumbnail URL, looking up the json and xml entry of the feed item with different ways
 * @param jsonEntry
 * @param xmlEntry
 * @returns {*}
 */
function getThumbnailUrl(jsonEntry, xmlEntry) {
	if (jsonEntry.mediaGroups && jsonEntry.mediaGroups.length > 0) {
		for (var m = 0; m < jsonEntry.mediaGroups.length; m++) {
			var mediaGroup = jsonEntry.mediaGroups[m];
			if (mediaGroup.contents && mediaGroup.contents.length > 0) {
				for (var c = 0; c < mediaGroup.contents.length; c++) {
					var content = mediaGroup.contents[c];
					if (content.medium == 'image') {
						if (content.thumbnails && content.thumbnails.length > 0) {
							for (var t = 0; t < content.thumbnails.length; t++) {
								var thumbnail = content.thumbnails[t];
								var url = thumbnail.url;
								if (url) {
									return url;
								}
							}
						}
					}
				}
			}
		}
	}
	var thumbnail = xmlEntry.thumbnail;
	if (thumbnail) {
		if (thumbnail.url) {
			return thumbnail.url;
		} else if (thumbnail.length > 0) {
			for (var t = 0; t < thumbnail.length; t++) {
				if (thumbnail[t].url) {
					return thumbnail[t].url;
				}
			}
		}
	}
	var cnt = xmlEntry.content;
	if (cnt && cnt.url) {
		return cnt.url;
	}
	var enclosure = xmlEntry.enclosure;
	if (enclosure && enclosure.url) {
		return enclosure.url;
	}
	return null;
}

function loadFeed(result, url, col, start) {
//        if (!result.error) {
	var content = $("<table class='feed'></table>");
	var json = $.xml2json(result.xmlDocument);
	if (!result.error) {
		for (var i = 0; i < result.feed.entries.length; i++) {
			var jsonEntry = result.feed.entries[i];
			var xmlEntry = json.channel.item[i];
			var imgUrl = getThumbnailUrl(jsonEntry, xmlEntry);
			if (typeof imgUrl != "string") {
				console.log("no URL found");
			}
			content.append($("<tr><td class='image'>" + (imgUrl ? ("<img width='80px' src='" + imgUrl + "'></img>") : "") + "</td><td><a target=\"_blank\" href=\"" + jsonEntry.link + "\">" + jsonEntry.title + "</a><br>" + jsonEntry.contentSnippet + "</td></tr>"));
		}
	} else {
		if (url.substring(url.length - 3) != "rss") {
			setFeed((url.substring(url.length - 1) == "/") ? (url + "rss") : (url + "/rss"), col, start);
			return;
		} else {
			content.append($("<div class='error'>Error while loading URL: '" + url + "'</div>"));
		}
	}
	var portlet = makePortlet(url, col, start, content);
	var portletHeader = portlet.find(".portlet-header");
	if (!result.error) {
		portletHeader.find(".title").html("<a target='_blank' href='" + result.feed.link + "'>" + result.feed.title + "</a>");
	} else {
		portletHeader.find(".title").text("Error");
	}

};

function setFeed(url, col, start) {
	if (url == 'https://mail.google.com') {
		var portlet = makePortlet(url, col, start);
		portlet.find(".portlet-header").find(".title").text("GMail");
		var signinUrl = "http://localhost:8081/oauth2/google/auth?clientRedirectURI=" + encodeURIComponent(window.location.href);
		portlet.find(".portlet-content").html("<a href='" + signinUrl + "'>Sign in</a>");

//        window.location = "http://localhost:8081/oauth2/google/auth?clientRedirectURI=" + encodeURIComponent(window.location.href);

//        url = "http://localhost:8081/gmail?userName=amelki156&password=Bxocely,";
//        $.get(url, function(feedStr) {
//            alert(feedStr);
//            var parsed = new DOMParser().parseFromString(feedStr, "text/xml");
//            var result = {};
//            result.title = parsed.getElementsByTagName("title")[0];
//            result.entries = [];
//            loadFeed(result, url, col, start);
//        });
	} else {
		if (url.substring(0, 4) != "http") {
			url = "http://" + url;
		}
		var feed = new google.feeds.Feed(url);
		feed.setResultFormat(google.feeds.Feed.MIXED_FORMAT);
		feed.load(function (result) {
			loadFeed(result, url, col, start);
		});
	}
}
function getURLParameter(name) {
	return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
}
function addFeed(urls) {
	var urls = urls.split(" ");
	for (var i = 0; i < urls.length; i++) {
		var url = urls[i].trim();
		setFeed(url, 0, true);
		feeds[0].splice(0, 0, url);
	}
	setUrl();
	$("#feedUrl").typeahead("val", "");
	$("#feedUrl").focus();
}
var feeds = {};

function initDefault() {
//    feeds = [
//        [ "http://www.arretsurimages.net/rss/tous-les-contenus.rss", "http://www.rue89.com/homepage/feed" ],
//        [ "http://www.lemonde.fr/rss/sequence/0,2-3208,1-0,0.xml", "http://www.liberation.fr/interactif/rss/actualites/index.FR.php" ],
//        [ "http://www.mediapart.fr/articles/feed", "http://feedproxy.google.com/TechCrunch" ],
//    ];
	feeds = [
		["mashable.com", "http://feeds.bbci.co.uk/news/world/rss.xml"],
		["http://feeds.feedburner.com/cnet/NnTv", "http://rss.news.yahoo.com/rss/mostemailed"],
		["http://rss.cnn.com/rss/edition.rss", "http://feedproxy.google.com/TechCrunch"]
	];
	setUrl();
}

function setUrl() {
	window.history.pushState("state", "title", window.location.pathname + "?feeds=" + encodeURIComponent(JSON.stringify(feeds)));
}

function makeUrl(feeds) {
	return "dashboard.html?feeds=" + encodeURIComponent(JSON.stringify(feeds));
}

function widgetMoved() {
	feeds = [];
	$(".column").each(function () {
		var urls = [];
		$(this).find(".portlet").each(function () {
			urls[urls.length] = $(this).data("url");
		});
		feeds[feeds.length] = urls;
	});
	setUrl();
}

function initDashboard() {
/*
	$("#feedUrl").autocomplete({
		source : function(request, response) {
			var term = request.term;
			google.feeds.findFeeds(term, function(result) {
				if (!result.error) {
					var data = [];
					for (var i = 0; i < result.entries.length; i++) {
						data[data.length] = {
							label: result.entries[i].title,
							value: result.entries[i].url
						};
					}
					response(data);
				}
			});
		}
	});
*/
	$("#feedUrl").typeahead({
		minLength: 3,
		hint: false,
		highlight: true
	}, {
		name : "feeds",
		display: "url",
		source : function(query, syncResults, asyncResults) {
			// Use the feedly API instead of the Google one to find feeds, because results are much better and richer
			$.ajax({
				// use a proxy to avoid CORS issues while calling the feedly API
				url: "https://jsonp.afeld.me/",
				async: true,
				data: {
					url: "http://cloud.feedly.com/v3/search/feeds?query="+encodeURIComponent(query)
				},
				success: function(res){
					var data = [];
					for (var i = 0; i < res.results.length; i++) {
						data[data.length] = {
							title: res.results[i].title,
							url: res.results[i].feedId.substring("feed/".length),
							iconUrl: res.results[i].iconUrl
						}
					}
					asyncResults(data);
				}
			});

/*
			google.feeds.findFeeds(query, function(result) {
				if (!result.error) {
					var data = [];
					for (var i = 0; i < result.entries.length; i++) {
						 //if (result.entries[i].url) {
							 data[data.length] = result.entries[i];
						 //}
					}
					asyncResults(data);
				}
			});
*/
		},
		limit: 10,
		templates : {
			suggestion: Handlebars.compile('<div><div class="icon"><img src="{{iconUrl}}"></div><div class="title">{{title}}</div><div class="url">{{url}}</div></div>')
		}
	});

	var columnsCount = feeds.length;
	if (columnsCount < 1) {
		columnsCount = 3;
	}
	$(".columns").empty();
	for (var c = 0; c < columnsCount; c++) {
		$(".columns").append($("<div class='column'></div>"));
	}
	for (var c in feeds) {
		var columnFeeds = feeds[c];
		for (var f in columnFeeds) {
			var feedStr = columnFeeds[f];
			setFeed(feedStr, c);
		}
	}
	initColumns();
	$("#addFeed").on("click", function (e) {
		ga('send', 'event', 'add-feed', $("#feedUrl").val(), 'user-action');
		addFeed($("#feedUrl").val());
	});
	$("#feedUrl").on("keypress", function (e) {
		ga('send', 'event', 'add-feed', $("#feedUrl").val(), 'user-action');
		var keycode = (e.keyCode ? e.keyCode : e.which);
		if (keycode == '13') {
			addFeed($("#feedUrl").val());
			e.preventDefault();
			e.stopImmediatePropagation();
		}
	});
	$("#feedUrl").focus();
}
