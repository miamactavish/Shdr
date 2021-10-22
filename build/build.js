var fs = require("fs");
var path = require("path");
var argparse =  require( "argparse" );
var uglify = require("uglify-js");
var execSync = require('child_process').execSync;
var spawn = require('child_process').spawn;
var getDirName = require('path').dirname;

var root = "./";
var base = root+"sources/";
var coffeedir = base+"shdr";
var files = [
];
var chrome_output = "shdr-chrome.zip";
var chrome_dir = "shdr-chrome";
var chrome_iconspath = root+"icons/";
var chrome_icons = [
	"icon_016.png",
	"icon_032.png",
	"icon_048.png",
	"icon_128.png",
	"icon_256.png",
	"icon_512.png"
];
var chrome_shdrdir = "build";
var chrome_dirs = [
	"css",
	"fonts",
	"fonts/font-awesome",
	"fonts/ubuntu-mono",
	"img",
	"models"
];
var chrome_files = [ // ignore shdr.js && nobase
	"index.html",
	"manifest.json",
	"css/main.css",
	"fonts/font-awesome/FontAwesome.otf",
	"fonts/font-awesome/font-awesome.min.css",
	"fonts/font-awesome/fontawesome-webfont.eot",
	"fonts/font-awesome/fontawesome-webfont.svg",
	"fonts/font-awesome/fontawesome-webfont.ttf",
	"fonts/font-awesome/fontawesome-webfont.woff",
	"fonts/ubuntu-mono/bold.woff",
	"fonts/ubuntu-mono/bolditalic.woff",
	"fonts/ubuntu-mono/font.css",
	"fonts/ubuntu-mono/italic.woff",
	"fonts/ubuntu-mono/normal.woff",
	"img/loader.gif",
	"models/cube.js",
	"models/dragon.js",
	"models/hexmkii.js",
	"models/sphere.js",
	"models/suzanne_high.js",
	"models/suzanne_low.js",
	"models/torus.js"
];

function recrmdirSync(dirPath) {
  try { var files = fs.readdirSync(dirPath); }
  catch(e) { return; }
  if (files.length > 0)
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
      else
        recrmdirSync(filePath);
    }
  fs.rmdirSync(dirPath);
}

function copySync(srcFile, destFile) {
  var content = fs.readFileSync(srcFile);
  fs.writeFileSync(destFile, content);
}

function main() {

	"use strict";

	var parser = new argparse.ArgumentParser();
	parser.addArgument(['--chromeapp'], { action: 'storeTrue', defaultValue: false });
	parser.addArgument(['--persist'], { action: 'storeTrue', defaultValue: false });
	parser.addArgument(['--output'], { defaultValue: 'shdr.js' });

	var args = parser.parseArgs();
	
	var output = args.output;
	console.log(' * Building ' + output);

	console.log(' * Compiling coffeescript classes from '+coffeedir);
	try {
		var comp = execSync('coffee -c '+coffeedir);
	}catch(e){
		console.log(e);
	}

	var buffer = [];
	var sources = [];

	console.log(' * Concating .js files');
	if(!args.minify && !args.chromeapp)
	{
		for(var j = 0; j < files.length; j++)
		{
			var file = files[j];
			console.log("    - "+file);
			sources.push(file);
			buffer.push(fs.readFileSync(file, 'utf8'));
		}

		var temp = buffer.join('');
		recrmdirSync(getDirName(output));
		fs.mkdirSync(getDirName(output));
		fs.writeFileSync(output, temp, 'utf8');
	}
	else
	{

		console.log(' * Minifying...');
		var result = uglify.minify(files, {});
		fs.writeFileSync(output, result.code, 'utf8');
	}

	console.log(' * Shdr was built to '+output);

	if(args.chromeapp)
	{
		console.log(' * Building Chrome App into '+chrome_dir);

		recrmdirSync(chrome_dir);
		fs.mkdirSync(chrome_dir);

		var targetpath = chrome_dir+'/';

		console.log(' * Creating directories');
		for(var j=0; j < chrome_dirs.length; j++)
		{
			var d = targetpath+chrome_dirs[j];
			console.log('    - '+d);
			fs.mkdirSync(d);
		}

		console.log(' * Copying core files');
		for(var k=0; k < chrome_files.length; k++)
		{
			var file = chrome_files[k];
			var o = base+file;
			var t = targetpath+file;
			console.log('    - '+o+' -> '+t);
			copySync(o,t);
		}

		console.log(' * Copying icons');
		for(var l=0; l < chrome_icons.length; l++)
		{
			var file = chrome_icons[l];
			var o = chrome_iconspath+file;
			var t = targetpath+file;
			console.log('    - '+o+' -> '+t);
			copySync(o,t);
		}

		console.log(' * Copying '+output+' to '+chrome_shdrdir+'/');
		var dir = targetpath+chrome_shdrdir;
		fs.mkdirSync(dir);
		var o = output;
		var t = dir+'/shdr.js';
		console.log('    - '+o+' -> '+t);
		copySync(o,t);

		console.log(' * Zipping '+chrome_dir+'...');
		try {
			var zip = execSync('zip -r '+chrome_output+' '+chrome_dir);
		}catch(e){
			console.log(e);
		}

		if(!args.persist)
		{
			console.log(' * Cleaning up...');
			recrmdirSync(chrome_dir);
		}

		console.log(' * Chrome app built to '+chrome_output);
	
	}
}

main();
