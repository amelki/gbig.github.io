function importIGoogleSettings(evt) {
    var files = evt.target.files; // FileList object
    // files is a FileList of File objects. List some properties.
    for (var i = 0, f; f = files[i]; i++) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var text = reader.result;
            var parsed = new DOMParser().parseFromString(text, "text/xml");
            var tabs = parsed.getElementsByTagName("Tab");
            for (var t = 0; t < tabs.length; t++) {
                var tab = tabs[t];
                var columns = tab.getElementsByTagName("Section");
                var feeds = new Array();
                for (var c = 0; c < columns.length; c++) {
                    var column = columns[c];
                    feeds[c] = [];
                    var widgets = column.getElementsByTagName("ModulePrefs");
                    for (var w = 0; w < widgets.length; w++) {
                        var widget = widgets[w];
                        var url = widget.getAttribute("xmlUrl");
                        feeds[c][w] = url;
                    }
                }
                var title = tab.getAttribute("title");
                addIGoogleLink(makeUrl(feeds), title);
            }
            alert("Import successful!");
        };
        reader.readAsText(f, "UTF-8");
    }
}

function addIGoogleLink(url, title) {
    if (!title) {
        title = "Untitled";
    }
    $("#igoogle").append($("<li><a href='"+url+"' target='_blank'>"+title+"</a></li>"));
}

$(function () {
    document.getElementById('files').addEventListener('change', importIGoogleSettings, false);
});
