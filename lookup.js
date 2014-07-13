$(function () {
    // Here is the jQuery function
    $.fn.lookup = function (col, promise, opts, callback) {
        return this.each(function () {
            // Input box element
            var mainContext = $(this);

            // Options
            var defaultOpts = {
                hideCol: [], // Hide column (index)
                minlength: 3, // Don't start search until minlength reached
                rows: 10, // Rows displayed
                begin: false, // Only search/highlight beginning of words
                casesens: false // Case sensitive search/highlight
            };

            var options = $.extend({}, defaultOpts, opts);

            var cache = [];

            // How many rows we want to display
            var iter = data.length;
            if (options.rows !== 0) {
                iter = options.rows;
            }

            // Container
            var container = $('<div style="display: inline-block; position: relative"/>');
			// Wrapper around input box
            var wrapper = mainContext.wrap(container);

            // Lookup table template
            var template = '<table style="position: absolute; border-radius: 5px; width: 100%"><thead><tr>{{#col}}<td>{{.}}</td>{{/col}}</tr></thead><tbody>{{#rows}}<tr>{{#.}}<td>{{{.}}}</td>{{/.}}</tr>{{/rows}}</tbody></table>';

            // Whether lookup is open (active)
            var isOpen = false;

            // Utility object
            var util = {
				noResults: mainContext.data('noresults') === undefined ? 'No results found' : mainContext.data('noresults'),
                closeLookup: function () {
                    mainContext.next('div').slideUp('fast');
                },
                cacheData: function (d) {
                    cache = d;
                },
                destroyCache: function () {
                    cache = [];
                },
                highlightWords: function (line, word) {
                    var pattern = '(' + word + ')';
                    // Highlight only beginning
                    if (options.begin) {
                        pattern += '{0,' + word.length + '}';
                    }

                    // Case sensitive
                    var r = options.casesens ? '' : 'i';
                    var regex = new RegExp(pattern, r);

                    var newline = line.toString();
                    if (word.length > 0) {
                        newline = line.toString().replace(regex, '<span class="highlight">$1</span>');
                    }

                    return newline;
                },
                findWord: function (line, word) {
                    if (options.begin) {
                        line = line.toString().substring(0, word.length);
                    }

                    // Case sensitive
                    if (options.casesens) {
                        return line.toString().indexOf(word) !== -1;
                    }
                    else {
                        return line.toString().toLowerCase().indexOf(word.toLowerCase()) !== -1;
                    }
                },
                loadData: function (data) {
					var loadContext = this;
				
                    mainContext.next('div').remove();
                    mainContext.removeClass('loading');

                    // Filtering
                    var dataArray = [];
                    var oldIndexArray = [];
                    for (var i = 0; i < iter; i++) {
                        var tmp = [];
                        var addRow = false;
                        for (var prop in data[i]) {
                            if (this.findWord(data[i][prop], mainContext.val())) {
                                addRow = true;
                            }

                            var tmpText = this.highlightWords(data[i][prop], mainContext.val());
                            tmp.push(tmpText);
                        }

                        if (data[i] !== undefined && addRow) {
                            dataArray.push(tmp);
                            oldIndexArray.push(i);
                        }
                    }

                    // Render the table
                    var table = Mustache.render(template, {
                        "col": dataArray.length === 0 ? ['', util.noResults] : col,
                        "rows": dataArray
                    });

                    var newDiv = $('<div style="position: absolute; z-index: 1; width: 100%"/>');
                    newDiv.append(table);
                    newDiv.appendTo(wrapper.parent('div')).hide();

                    if (!isOpen) {
                        newDiv.slideDown('fast');
                    }
                    else {
                        newDiv.show();
                    }

                    isOpen = true;

                    // Hide specific columns
                    for (var j = 0; j < options.hideCol.length; j++) {
                        var idx = (options.hideCol[j] + 1);
                        wrapper.parent('div').find('td:nth-of-type(' + idx + '),th:nth-of-type(' + idx + ')').css('display', 'none');
                    }

                    // Hover over a row
                    wrapper.parent('div').find('table tbody tr').hover(function () {
                        var selfRow = $(this);
                        selfRow.css('cursor', 'pointer');
                        selfRow.addClass('hover');
                    },
                    function () {
                        var selfRow = $(this);
                        selfRow.css('cursor', 'initial');
                        selfRow.removeClass('hover');
                    });

                    // Click on a row
                    wrapper.parent('div').find('table tbody tr').click(function () {
                        var selfRow = $(this);
                        callback({ "index": oldIndexArray[selfRow.index()], "element": mainContext, "row": data[oldIndexArray[selfRow.index()]] });
                        loadContext.closeLookup();
                        isOpen = false;
                    });
                }
            };

            // Event handler on input box for input and click
            mainContext.on('input click', function (e) {
                // If element is clicked and the minlength has been reached, we load the cache
                if (e.type === 'click' && mainContext.val().length > options.minlength) {
                    util.loadData(data);
                }

                // Check if minimum length is reached
                if (mainContext.val().length >= options.minlength) {
                    mainContext.addClass('loading');
                    // Check cache
                    if (cache.length === 0) {
                        promise().then(function (data) {
                            cache = data;
                            util.loadData(cache);
                        });
                    } else {
                        util.loadData(data);
                    }
                } else {
                    util.closeLookup();
                    util.destroyCache();
                    return;
                }
            });

            wrapper.parent('div').mouseleave(function () {
                util.closeLookup();
                isOpen = false;
            });
        });
    };


    // Here is the data...

    var data = [
      { "ID": 0, "First": "Gudjon", "Last": "Jonsson", "Age": 28 },
      { "ID": 1, "First": "Lov�sa", "Last": "J�l�usd�ttir", "Age": 30 },
      { "ID": 2, "First": "Kjartan", "Last": "Hjartarson", "Age": 25 },
      { "ID": 3, "First": "Gu�mundur", "Last": "Ingvarsson", "Age": 31 },
      { "ID": 4, "First": "Vignir", "Last": "Sveinsson", "Age": 40 },
      { "ID": 5, "First": "Haf��r", "Last": "H�ni", "Age": 33 }
    ];

    // Here is the magic...

    // Callback to handle the selected row
    var selectedCallback = function (obj) {
        $(obj.element).val(obj.row.First);
    };

    var options = {
        hideCol: [0],
        minlength: 1,
        rows: 10,
        begin: false,
        casesens: false
    };

    // This will be a AJAX call to webserver
    function dataLoader() {
        var timer;
        var dfd = new $.Deferred();
        clearTimeout(timer);
        timer = setTimeout(function () {
            dfd.resolve(data);
        }, 1000);

        return dfd;
    }

    // Run the function
    $('#test').lookup(["ID", "Fornafn", "Eftirnafn", "Aldur"], dataLoader, options, selectedCallback);
    $('#test2').lookup(["ID", "Fornafn", "Eftirnafn", "Aldur"], dataLoader, options, selectedCallback);
    $('#test3').lookup(["ID", "Fornafn", "Eftirnafn", "Aldur"], dataLoader, options, selectedCallback);
});