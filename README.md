#Window Bookmark
A addon to bookmark a window and all its tabs.


#Features
*Instantly bookmark all tabs in the current window
*Choose an open window to save.
*Open a bookmarked window and all it's tabs with just a few clicks.


#Building/Testing
Building this extension requires typescript be installed globally.
In package.json replace ${path/to/firefox/developer/edition} with a path to a directory containing a version
of firefox that allows unsigned addons (developer edition/nightly).
To build and run


`npm test`


To build only
`npm run build`


To package as an XPI
`jpm xpi`