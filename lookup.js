$(function () {
    $.fn.lookup = function (col, promise, opts, callback) {
        return this.each(function () {
            // Input box element
            var mainElement = $(this);

            // Default options
            var defaultOpts = {
				// Hide these columns (index)
                hideCol: [],
				// Don't start search until minlength reached
                minlength: 3,
				// How many rows to display
                rows: 10,
				// Only search and highlight beginning of words
                begin: false,
				// Case sensitive search and highlight
                casesens: false
            };

            var options = $.extend({}, defaultOpts, opts);
			
			// Data cache
            var cache = [];
			
            // Container
            var container = $('<div style="display: inline-block; position: relative; width: inherit"/>');
			// Wrapper around input box
            var wrapper = mainElement.wrap(container);

            // Lookup table template
            var template = '<table style="border-radius: 5px; width: inherit"><thead><tr>{{#col}}<td>{{.}}</td>{{/col}}</tr></thead><tbody>{{#rows}}<tr>{{#.}}<td>{{{.}}}</td>{{/.}}</tr>{{/rows}}</tbody></table>';

            // Whether lookup is open (active)
            var isOpen = false;

            // Utility object
            var util = {
				noResults: mainElement.data('noresults') === undefined ? 'No results found' : mainElement.data('noresults'),
                closeLookup: function () {
                    mainElement.next('div').slideUp('fast');
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
				
                    mainElement.next('div').remove();
                    mainElement.removeClass('loading');
					
					// How many rows we want to display
					var iter = data.length;
					if (options.rows !== 0) {
						iter = options.rows;
					}

                    // Filtering
                    var dataArray = [];
                    var oldIndexArray = [];
                    for (var i = 0; i < iter; i++) {
                        var tmp = [];
                        var addRow = false;
                        for (var prop in data[i]) {
                            if (this.findWord(data[i][prop], mainElement.val())) {
                                addRow = true;
                            }

                            var tmpText = this.highlightWords(data[i][prop], mainElement.val());
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
                        callback({ "index": oldIndexArray[selfRow.index()], "element": mainElement, "row": data[oldIndexArray[selfRow.index()]] });
                        loadContext.closeLookup();
                        isOpen = false;
                    });
                }
            };

            // Event handler on input box for input and click
            mainElement.on('input click', function (e) {
                // If element is clicked and the minlength has been reached, we load the cache
                if (e.type === 'click' && mainElement.val().length > options.minlength) {
                    util.loadData(cache);
                }

                // Check if minimum length is reached
                if (mainElement.val().length >= options.minlength) {
                    mainElement.addClass('loading');
                    // Check cache
                    if (cache.length === 0) {
                        promise().then(function (data) {
                            cache = data;
                            util.loadData(cache);
                        });
                    } else {
                        util.loadData(cache);
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
});