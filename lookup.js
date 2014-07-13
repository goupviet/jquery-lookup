$(function () {
    $.fn.lookup = function (col, promise, opts, callback) {
		// Do this for each lookup element
        return this.each(function () {
            // Input box element
            var mainElement = $(this);

            // Default options
            var defaultOpts = {
				// Do sorting (order and column (index))
				// Disable: false
				sort: {"order": "asc", "col": 0},
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

			// Extend options
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
				// Text to be displayed when there are no results found
				noResults: mainElement.data('noresults') === undefined ? 'No results found' : mainElement.data('noresults'),
				// Handle closing lookup
                closeLookup: function () {
                    mainElement.next('div').slideUp('fast');
                },
				// Handles caching data
                cacheData: function (d) {
                    cache = d;
                },
				// Handles destroying cache
                destroyCache: function () {
                    cache = [];
                },
				// Handles sorting by a property
				dynamicSort: function (property) {
					var sortOrder = 1;
					if(property[0] === "-") {
						sortOrder = -1;
						property = property.substr(1);
					}
					return function (a,b) {
						var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
						return result * sortOrder;
					}
				},
				// Handles highlighting words in a line
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
				// Checks if a line contains a word
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
				// Handles loading data and displaying in the DOM
                loadData: function (data) {
					var loadContext = this;
				
					// Remove element from DOM
                    mainElement.next('div').remove();
					// Remove loading state
                    mainElement.removeClass('loading');
					
					// How many rows we want to display
					var iter = data.length;
					if (options.rows !== 0) {
						iter = options.rows;
					}
					
					// Sort data array (if enabled)				
					if(options.sort !== false) {
						// If first element is an object, expect all elements to be
						if(typeof(data[0]) === 'object') {
							data.sort(util.dynamicSort(Object.keys(data[0])[options.sort.col]));
						} else {
							data.sort();
						}
						
						// If not ascending, then it must be descending
						if(options.sort.order !== 'asc' && options.sort.order !== 'ascending') {
							data.reverse();
						}
					}

                    // New data array
                    var dataArray = [];
					// Keep track of old indexes for referral when item is selected
                    var oldIndexArray = [];
					// Go through returned data array
                    for (var i = 0; i < data.length; i++) {
						if(data[i] === undefined) continue;
						
						// Stores items for each row
                        var tmp = [];
                        var addRow = false;
						
						// If the item is an object, we have to loop through each property
						if(typeof(data[i]) === 'object') {
							// Go through each property in object
							for (var prop in data[i]) {
								// Check if the value contains the input text
								if (this.findWord(data[i][prop], mainElement.val())) {
									addRow = true;
								}
								
								// Highlight words in input text
								var tmpText = this.highlightWords(data[i][prop], mainElement.val());
								tmp.push(tmpText);
							}
						// The item is not an object
						} else {
							// Check if the value contains the input text
							if (this.findWord(data[i], mainElement.val())) {
								addRow = true;
							}
							
							// Highlight words in input text
							var tmpText = this.highlightWords(data[i], mainElement.val());					
							tmp.push(tmpText);
						}

						// If all conditions are met for adding the row to the new data array
                        if (addRow) {
                            dataArray.push(tmp);
							
							// Keep track of indexes in original data array
                            oldIndexArray.push(i);
                        }
                    }
					
					dataArray.splice(iter);
					oldIndexArray.splice(iter);

                    // Render the table
                    var table = Mustache.render(template, {
                        "col": dataArray.length === 0 ? [util.noResults] : col,
                        "rows": dataArray
                    });

					// Create a new div containing our table
                    var newDiv = $('<div style="position: absolute; z-index: 1; width: 100%"/>');
                    newDiv.append(table);
                    newDiv.appendTo(wrapper.parent('div')).hide();

					// If lookup is open, we don't want animation
                    if (isOpen) {
                        newDiv.show();
                    }
					// Lookup is not open, animate!
                    else {
                        newDiv.slideDown('fast');
                    }

					// Mark the lookup as open
                    isOpen = true;

                    // Hide specific columns
                    for (var j = 0; j < options.hideCol.length; j++) {
						// Don't hide first column if no results are found
						if(j == 0 && dataArray.length == 0) continue;
						
                        var idx = (options.hideCol[j] + 1);
                        wrapper.parent('div').find('td:nth-of-type(' + idx + '),th:nth-of-type(' + idx + ')').css('display', 'none');
                    }

                    // Hover over a row
                    wrapper.parent('div').find('table tbody tr').hover(
						// Hover active
						function () {
							var selfRow = $(this);
							selfRow.css('cursor', 'pointer');
							selfRow.addClass('hover');
						},
						// Hover inactive
						function () {
							var selfRow = $(this);
							selfRow.css('cursor', 'initial');
							selfRow.removeClass('hover');
						}
					);

                    // Event handler for click on a row in the lookup
                    wrapper.parent('div').find('table tbody tr').click(function () {
                        var selfRow = $(this);
						// Callback with original index, the input element and the selected row
                        callback({ "index": oldIndexArray[selfRow.index()], "element": mainElement, "row": data[oldIndexArray[selfRow.index()]] });
						
						// Close lookup
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
					// Add loading state
                    mainElement.addClass('loading');
                    // If there is no data in cache
                    if (cache.length === 0) {
						// Async data loader that loads data on callback (e.g. with AJAX)
                        promise().then(function (data) {
                            cache = data;
                            util.loadData(cache);
                        });
					// Data is in cache, load it
                    } else {
                        util.loadData(cache);
                    }
				// Minimum input length not reached
                } else {
                    util.closeLookup();
                    util.destroyCache();
                    return;
                }
            });

			// Close look up when mouse leaves the container
            wrapper.parent('div').mouseleave(function () {
                util.closeLookup();
                isOpen = false;
            });
        });
    };
});