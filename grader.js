#!/usr/bin/env node
/*
  Automatically grade files for the presence of specified HTML tags/attributes.
  Uses commander.js and cheerio. Teaches command line application development
  and basic DOM parsing.
  
  References:
  
  + cheerio
  - https://github.com/MatthewMueller/cheerio
  - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
  - http://maxogden.com/scraping-with-node.html
  
  + commander.js
  - https://github.com/visionmedia/commander.js
  - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy
  
  + JSON
  - http://en.wikipedia.org/wiki/JSON
  - https://developer.mozilla.org/en-US/docs/JSON
  - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var util = require('util');
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    var $ = cheerioHtmlFile(htmlfile);
    return performCheck($, checksfile);
};

var performCheck = function($, checksfile) {
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length;
        out[checks[ii]] = present > 0;
    }
    return out;
    
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var checkUrl= function(url, checksfile) {
    var cheerioUrl = function(result) {
    	if (result instanceof Error) {
	    console.error('error during fetching page' + result);
	    process.exit(1);
    	} else {
	    var $ = cheerio.load(result);
	    var checkJson = performCheck($, checksfile);
	    var outJson = JSON.stringify(checkJson, null, 4);
	    console.log(outJson);
	}
    };
    
    rest.get(url).on('complete', cheerioUrl);
};


if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists))
        .option('-u, --url <html_url>', 'index.html url')
	.parse(process.argv);
    if(program.file)
    {
	checkJson = checkHtmlFile(program.file, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
	
    }
    else
    {
	checkUrl(program.url, program.checks);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
