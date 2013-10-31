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
    $( ".column" ).sortable({
        connectWith: ".column"
    });

    $( ".portlet" ).addClass( "ui-widget ui-widget-content ui-helper-clearfix ui-corner-all" )
        .find( ".portlet-header" )
        .addClass( "ui-widget-header ui-corner-all" )
        .prepend( "<span class='ui-icon ui-icon-minusthick'></span>")
        .end()
        .find( ".portlet-content" );

    $( ".portlet-header .ui-icon" ).click(function() {
        $( this ).toggleClass( "ui-icon-minusthick" ).toggleClass( "ui-icon-plusthick" );
        $( this ).parents( ".portlet:first" ).find( ".portlet-content" ).toggle();
    });

    $( ".column" ).disableSelection();
}
google.load("feeds", "1");
var widgetCounter = 0;
function setFeed(url, col, start) {
    var feed = new google.feeds.Feed(url);
    feed.load(function (result) {
//        if (!result.error) {
        var content = $("<table class='feed'></table>");
        if (!result.error) {
            for (var i = 0; i < result.feed.entries.length; i++) {
                var entry = result.feed.entries[i];
                content.append($("<tr><td><a target=\"_blank\" href=\"" + entry.link + "\">" + entry.title + "</a><br>" + entry.contentSnippet + "</td></tr>"));
            }
        } else {
            content.append($("<div class='error'>Error while loading URL: '" + url + "'</div>"));
        }
        var portlet = $("<div class='portlet'></div>");
        var portletHeader = $("<div class='portlet-header'><div class='title'></div><div class='close' title='Remove this feed'>&#215;</div></div>");
        if (!result.error) {
            portletHeader.find(".title").text(result.feed.title);
        } else {
            portletHeader.find(".title").text("Error");
        }
        var portletContent = $("<div class='portlet-content"+(start ? " highlight" : "")+"'></div>");
        portletContent.append(content);
        portlet.append(portletHeader);
        portlet.append(portletContent);
        if (start) {
            $($(".column")[col]).hide().prepend(portlet).fadeIn('slow', function() {
                portletContent.removeClass("highlight", 2000);
            });
        } else {
            $($(".column")[col]).append(portlet);
        }
        portlet.find(".close").on("click", function(e) {
            var idx = portlet.index();
            portlet.fadeOut();
            if (feeds[col].length == 1) {
                feeds[col] = [];
            } else {
                feeds[col].splice(idx, 1);
            }
            setUrl();
        });
    });
}
function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}
function addFeed(urls) {
    var urls = urls.split(" ");
    for (var i = 0; i < urls.length; i++) {
        var url = urls[i].trim();
        setFeed(url, 0, true);
        feeds[0].splice(0, 0, url);
    }
    setUrl();
}
var feeds = {};

function initDefault() {
    feeds = [
        [ "http://www.arretsurimages.net/rss/tous-les-contenus.rss", "http://www.rue89.com/homepage/feed" ],
        [ "http://www.lemonde.fr/rss/sequence/0,2-3208,1-0,0.xml", "http://www.liberation.fr/interactif/rss/actualites/index.FR.php" ],
        [ "http://www.mediapart.fr/articles/feed", "http://feedproxy.google.com/TechCrunch" ],
    ];
    setUrl();
}

function setUrl() {
    window.history.pushState("state", "title", window.location.pathname + "?feeds=" + encodeURIComponent(JSON.stringify(feeds)));
}

function makeUrl(feeds) {
    return "dashboard.html?feeds=" + encodeURIComponent(JSON.stringify(feeds));
}

function initDashboard() {
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
    $("#addFeed").on("click", function(e) {
        addFeed($("#feedUrl").val());
    });
    $("#feedUrl").on("keypress", function(e) {
        var keycode = (e.keyCode ? e.keyCode : e.which);
        if (keycode == '13') {
            addFeed($("#feedUrl").val());
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    });
}
