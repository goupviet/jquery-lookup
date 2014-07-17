jQuery async lookup plugin
=======

A jQuery asynchronous lookup plugin. Works with asynchronous calls to web services or any datastores. Uses promises to trigger when data has been retrieved.

## Dependencies

- [jQuery](http://jquery.com) >=1.7.0 _(1.10.2 included)_
 - <1.7.0 doesn't have `on` function
- [Mustache JS](https://github.com/janl/mustache.js)

## Features

- Supports arrays
 - Array of primitives
 - Array of objects
- Sorting
 - By custom column _(specified by index)_
 - In ascending/descending order
- Filtering
 - Search for input in beginning of columns
 - Search for input anywhere in columns
- Caches data after lookup
- Ability to hide specific columns _(specified by index)_
- Ability to customize table header rows
- Minimum input length before loading data
- Maximum displayed rows in lookup table
- Highly customizable with CSS

## API

    $('#lookup').lookup(["ID", "First name", "Last name", "Age"], dataLoader, options, selectedCallback);

### 1. Header Row

Name your columns in your header.

Just pass in an array with your custom named header row.

For example:

    ["ID", "First name", "Last name", "Age"]

### 2. Data Loader (Promise)

This is our data loader or a `promise`. A promise is an object that represents the result of an asynchronous operation. This object will hold the information about the status of the async operation and will notify us when the async operation succeeds or fails.

We just pass in a `promise` into our lookup function and it will be called when the data has been retrieved.

Promises use the `$.Deferred()` function in jQuery. A similar function is also supported in AngularJS and other JavaScript frameworks.

The data loder in the example file uses in-memory data and a timer to simulate waiting for a response from a server.

With jQuery `$.ajax()` function this could be done like so:

    function dataLoader() {
        return $.ajax({
            type: "POST",
            url: "http://server/DataService",
            data: JSON.stringify({"keyword": $('#lookup').val()}),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) {
                return data;
            },
            error: function (err) {
                // Error, do something
            }
        });
    }

### 3. Options

This is your `options` object, specifying your needs for the lookup.

    var options = {
        sort: {"order": "asc", "col": 1},
        hideCol: [0],
        minlength: 1,
        rows: 10,
        begin: false,
        casesens: false
    };

### 4. Selected Callback

This is a function that is called when a row is selected from the lookup. This is up to you, what you want to happen.

The function is called with an `object` containing:

- Index from original dataset
- DOM element where your lookup is initiated _(the input box_)
- The selected row object containing data from original dataset

## Options

### Supports arrays

The plugin supports arrays of data to load in the lookup table.

#### Array of primitives

    var data = ['Some', 'elements', 'that', 'will', 'be', 'displayed'];

#### Array of objects

	var data = [
		{ "ID": 0, "First": "Ron", "Last": "Carpenter", "Age": 28 },
		{ "ID": 1, "First": "Elroy", "Last": "Babcoke", "Age": 30 },
		{ "ID": 2, "First": "Jake", "Last": "Bolton", "Age": 25 },
		{ "ID": 3, "First": "Ainsley", "Last": "Beckett", "Age": 31 },
		{ "ID": 4, "First": "Wyatt", "Last": "Goode", "Age": 40 },
		{ "ID": 5, "First": "Shayne", "Last": "Hunt", "Age": 33 },
		{ "ID": 6, "First": "Barnabas", "Last": "Hayward", "Age": 32 },
		{ "ID": 7, "First": "Vaughn", "Last": "Deering", "Age": 24 },
		{ "ID": 8, "First": "Royce", "Last": "Granger", "Age": 27 },
		{ "ID": 9, "First": "Dene", "Last": "Keighley", "Age": 21 },
		{ "ID": 10, "First": "Ilbert", "Last": "Queshire", "Age": 24 },
		{ "ID": 11, "First": "Leith", "Last": "Aylmer", "Age": 22 },
		{ "ID": 12, "First": "Abe", "Last": "Harlow", "Age": 20 },
		{ "ID": 13, "First": "Ansel", "Last": "Wilkinson", "Age": 17 }
	];

### Sorting

Just pass in a `sort` property in the `options` object where you specify which order you want to sort in and which column.

	var options = {
		sort: {"order": "asc", "col": 1},
	}

**Default:** First column _(index 0)_ in ascending order.

### Filtering

Supports filtering results by the input. You can specify if you want to search for the input text in the whole column or just in the beginning.

You can also specify if you want the filtering to be case sensitive or not.

Just pass in a `begin` and a `casesens` property in the `options` object where you specify if you want to only search in the beginning of columns or if you want case sensitive.

	var options = {
		begin: false,
        casesens: false
	}

**Default**: Both off _(false)_

### Caching

After lookup, the data is cached until the input field is cleared. This is so you can find results faster without always having to wait for the response from the server.

### Hide specific columns

It's possible to hide specific columns from being displayed. For example if you have an `ID` column being delivered from the server you don't want to be displayed in the lookup table.

Just pass in a `hideCol` property in the `options` object where you specify an array of column indexes you don't want to be displayed.

This will hide columns `ID` and `Age` for the data specified above.

	var options = {
		hideCol: [0,3]
	}

**Default**: No hidden columns _( [ ] )_

### Custom table header row

You can specify a custom table header row you want to be displayed.

Just pass in an array of headers in the `lookup()` plugin function, like so:

    $('#lookup').lookup(["ID", "First name", "Last name", "Age"], ...);

### Minimum input length

You can specify a minimum input length, before loading data (e.g. from server).

Just pass in an `minlength` property in the `options` object where you specify the minimum length of input value.

	var options = {
		minlength: 3
	}

**Default**: 3 characters

### Maximum displayed rows

You can specify how many rows you want to be displayed in the lookup table.

Just pass in an `rows` property in the `options` object where you specify the maximum number of rows you want to be displayed.

	var options = {
		rows: 6
	}

**Default**: 10 rows

### Customizable with CSS

You can customize everything with CSS selectors.

- When hovering over a row, the `hover` class is applied.
- On filtering input, the `highlight` class is applied.
- When loading, the `loading` class is applied.

#### DOM structure

- One main `div` wrapper
- Two sibling elements
 - `input` element _(main element)_
 - `div` containing the lookup table

    <div style="display: inline-block; position: relative; width: inherit">
        <input type="text" id="lookup" placeholder="Enter something" data-noresults="No results!">
        <div style="position: absolute; z-index: 1; width: 100%; display: none;">
            <table style="border-radius: 5px; width: inherit">
                <thead>
                    <tr>
                        <td>ID</td>
                        <td>First name</td>
                        <td>Last name</td>
                        <td>Age</td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>8</td>
                        <td>Royce</td>
                        <td>Granger</td>
                        <td>27</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

#### The lookup table

    #lookup + div table {
      background-color: #fcfdfd;
      font-size: 11px;
      box-shadow: 2px 2px 8px #ccc;
      border: 1px solid #a6c9e2;
    }

### The lookup table header row

    #lookup + div table td {
      padding: 5px;
    }

### Every column in the lookup table

    #lookup + div table td {
      padding: 5px;
    }

### Loading indicator

    #lookup.loading {
      background-image: url(loading.gif);
      background-size: 20px 20px;
      background-position: 195px 4px;
      background-repeat: no-repeat;
    }

### Hover effect on lookup table rows

    #lookup + div .hover {
      background-color: #d0f1ff;
    }

### Highlighting in columns

    #lookup + div .highlight {
      font-weight: bold;
      text-decoration: underline;
    }

# Todo

- Remove MustacheJS dependency.

# Changelog

## v0.2

- Added the ability to use keyboard up/down keys for navigation in lookup menu

## v0.1

- Current version