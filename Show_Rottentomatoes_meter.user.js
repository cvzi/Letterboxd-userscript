// ==UserScript==
// @name        Show Rottentomatoes meter
// @description Show Rotten Tomatoes score on imdb.com, metacritic.com, letterboxd.com, BoxOfficeMojo, serienjunkies.de, Amazon, tv.com, Google Play, allmovie.com, Wikipedia, themoviedb.org, movies.com, tvmaze.com, tvguide.com, followshows.com, thetvdb.com, tvnfo.com
// @namespace   cuzi
// @updateURL   https://openuserjs.org/meta/cuzi/Show_Rottentomatoes_meter.meta.js
// @grant       GM_xmlhttpRequest
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       unsafeWindow
// @grant       GM.xmlHttpRequest
// @grant       GM.setValue
// @grant       GM.getValue
// @require     http://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @license     GPL-3.0
// @version     2
// @connect     www.rottentomatoes.com
// @include     https://play.google.com/store/movies/details/*
// @include     http://www.amazon.com/*
// @include     https://www.amazon.com/*
// @include     http://www.amazon.co.uk/*
// @include     https://www.amazon.co.uk/*
// @include     http://www.amazon.fr/*
// @include     https://www.amazon.fr/*
// @include     http://www.amazon.de/*
// @include     https://www.amazon.de/*
// @include     http://www.amazon.es/*
// @include     https://www.amazon.es/*
// @include     http://www.amazon.ca/*
// @include     https://www.amazon.ca/*
// @include     http://www.amazon.in/*
// @include     https://www.amazon.in/*
// @include     http://www.amazon.it/*
// @include     https://www.amazon.it/*
// @include     http://www.amazon.co.jp/*
// @include     https://www.amazon.co.jp/*
// @include     http://www.amazon.com.mx/*
// @include     https://www.amazon.com.mx/*
// @include     http://www.amazon.com.au/*
// @include     https://www.amazon.com.au/*
// @include     http://www.imdb.com/title/*
// @include     https://www.imdb.com/title/*
// @include     http://www.serienjunkies.de/*
// @include     https://www.serienjunkies.de/*
// @include     http://www.tv.com/shows/*
// @include     http://www.boxofficemojo.com/movies/*
// @include     http://www.allmovie.com/movie/*
// @include     https://www.allmovie.com/movie/*
// @include     https://en.wikipedia.org/*
// @include     http://www.movies.com/*/m*
// @include     https://www.themoviedb.org/movie/*
// @include     https://www.themoviedb.org/tv/*
// @include     http://letterboxd.com/film/*
// @include     https://letterboxd.com/film/*
// @include     http://www.tvmaze.com/shows/*
// @include     http://www.tvguide.com/tvshows/*
// @include     https://www.tvguide.com/tvshows/*
// @include     http://followshows.com/show/*
// @include     https://followshows.com/show/*
// @include     http://thetvdb.com/*tab=series*
// @include     https://thetvdb.com/*tab=series*
// @include     http://www.thetvdb.com/*tab=series*
// @include     https://www.thetvdb.com/*tab=series*
// @include     http://tvnfo.com/s/*
// @include     http://www.metacritic.com/movie/*
// @include     http://www.metacritic.com/tv/*
// ==/UserScript==


var baseURL = "https://www.rottentomatoes.com"
var baseURL_search = baseURL + "/api/private/v2.0/search/?limit=20&q={query}";
var baseURL_openTab = baseURL + "/search/?search={query}";
const cacheExpireAfterHours = 4;

function minutesSince(time) {
  var seconds = ((new Date()).getTime() - time.getTime()) / 1000;
  return seconds>60?parseInt(seconds/60)+" min ago":"now";
}

function meterBar(data) {
  // Create the "progress" bar with the meter score
  var barColor = "grey";
  var bgColor = "#ECE4B5";
  var color = "black";
  var width = 0;
  var textInside = "";
  var textAfter = "";
  
  if (data.meterClass == "certified_fresh") {
    barColor = "#C91B22";
    color = "yellow";
    textInside = data.meterScore + "%"
    width = data.meterScore;
  }
  else if (data.meterClass == "fresh") {
    barColor = "#C91B22";
    color = "white";
    textInside = data.meterScore + "%"
    width = data.meterScore;
  } else if(data.meterClass == "rotten") {
    color = "gray";
    barColor = "#94B13C";
    textAfter = data.meterScore + "%"
    width = data.meterScore;
  } else {
    bgColor = barColor = "#787878";
    color = "silver";
    textInside = "N/A";
    width = 100
  }
  
  return '<div style="width:100px; overflow: hidden;height: 20px;background-color: '+bgColor+';color: ' + color + ';text-align:center; border-radius: 4px;box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);">' + 
    '<div style="width:'+ data.meterScore +'%; background-color: ' + barColor + '; color: ' + color + '; font-size:15px; font-weight:bold; text-align:center; float:left; height: 100%;line-height: 20px;box-shadow: inset 0 -1px 0 rgba(0,0,0,0.15);transition: width 0.6s ease;">' + textInside + '</div>' + textAfter +'</div>'; 
}

var current = {
  type : null,
  query : null,
  year : null
};


async function loadMeter(query, type, year) {
  // Load data from rotten tomatoes search API or from cache
  
  current.type = type;
  current.query = query;
  current.year = year;
  
  var url = baseURL_search.replace("{query}", encodeURIComponent(query));
  
  var cache = JSON.parse(await GM.getValue("cache","{}"));
  
  // Delete cached values, that are expired
  for(var prop in cache) {
    if((new Date()).getTime() - (new Date(cache[prop].time)).getTime() > cacheExpireAfterHours*60*60*1000) {
      delete cache[prop];
    }
  }
  
  // Check cache or request new content
  if(url in cache) {
    // Use cached response
    handleResponse(cache[url]);
  } else {
    GM.xmlHttpRequest({
      method: "GET",
      url: url,
      onload: function(response) {

        // Save to chache
        response.time = (new Date()).toJSON();
        cache[url] = response;
        
        GM.setValue("cache",JSON.stringify(cache));
        
        handleResponse(response);
      },
      onerror: function(response) { 
        console.log("GM.xmlHttpRequest Error: "+response.status+"\nURL: "+requestURL+"\nResponse:\n"+response.responseText);
      },
    });
  }
}

function handleResponse(response) {
  // Handle GM.xmlHttpRequest response
  
  var data = JSON.parse(response.responseText);
  
  // Adapt type name from original metacritic type to rotten tomatoes type
  var prop;
  if(current.type == "movie") {
    prop = "movies";
  } else {
    prop = "tvSeries";
    // Align series info with movie info
    for(var i = 0; i < data[prop].length; i++) {
      data[prop][i]["name"] = data[prop][i]["title"];
      data[prop][i]["year"] = data[prop][i]["startYear"];
    }
  }

  if(data[prop]) {
    // Sort results by closest match
    function matchQuality(title, year) {
      if(title == current.query && year == current.year) {
        return 1000 + year;
      }
      if(title == current.query) {
        return 6 + year;
      }
      if(title.startsWith(current.query)) {
        return 5;
      }
      if(current.query.indexOf(title) != -1) {
        return 4;
      }
      if(title.indexOf(current.query) != -1) {
        return 3;
      }
      if(current.query.toLowerCase().indexOf(title.toLowerCase()) != -1) {
        return 2;
      }
      if(title.toLowerCase().indexOf(current.query.toLowerCase()) != -1) {
        return 1;
      }
      return 0;
    }
    
    data[prop].sort(function(a,b) {
      a.matchQuality = matchQuality(a.name, a.year);
      b.matchQuality = matchQuality(b.name, b.year);
      
      return b.matchQuality - a.matchQuality;
    });
    
    showMeter(data[prop], new Date(response.time));
  } else {
    console.log("No results for "+current.query);
  }
}





function showMeter(arr, time) {
  // Show a small box in the right lower corner
  $("#mcdiv321rotten").remove();
  var main,div;
  div = main = $('<div id="mcdiv321rotten"></div>').appendTo(document.body);
  div.css({
    position:"fixed", 
    bottom :0, 
    right: 0,
    minWidth: 100,
    maxHeight: "95%",
    overflow: "auto",
    backgroundColor: "#fff",
    border: "2px solid #bbb",
    borderRadius:" 6px",
    boxShadow: "0 0 3px 3px rgba(100, 100, 100, 0.2)",
    color: "#000",
    padding:" 3px",
    zIndex: "5010001",
    fontFamily : "Helvetica,Arial,sans-serif"
  });
  
  // First result
  var row = $('<div><a style="font-size:small; color:#136CB2; " href="' + baseURL + arr[0].url + '">' + arr[0].name + " (" + arr[0].year + ")</a>" + meterBar(arr[0]) +  '</div>').appendTo(main);
  
  // Shall the following results be collapsed by default?
  if((arr.length > 1 && arr[0].matchQuality > 10) || arr.length > 10) {
    var a = $('<span style="color:gray;font-size: x-small">More results...</span>').appendTo(main).click(function() { more.css("display", "block"); this.parentNode.removeChild(this); });
    var more = div = $("<div style=\"display:none\"></div>").appendTo(main);
  }
  
  // More results
  for(var i = 1; i < arr.length; i++) {
    var row = $('<div><a style="font-size:small; color:#136CB2; " href="' + baseURL + arr[i].url + '">' +arr[i].name + " (" + arr[i].year + ")</a>" + meterBar(arr[i]) +  '</div>').appendTo(div);
  }
  
  // Footer
  var sub = $("<div></div>").appendTo(main);
  $('<time style="color:#b6b6b6; font-size: 11px;" datetime="'+time+'" title="'+time.toLocaleTimeString()+" "+time.toLocaleDateString()+'">'+minutesSince(time)+'</time>').appendTo(sub);
  $('<a style="color:#b6b6b6; font-size: 11px;" target="_blank" href="' + baseURL_openTab.replace("{query}", encodeURIComponent(current.query)) + '" title="Open Rotten Tomatoes">@rottentomatoes.com</a>').appendTo(sub);
  $('<span title="Hide me" style="cursor:pointer; float:right; color:#b6b6b6; font-size: 11px; padding-left:5px;padding-top:3px">&#10062;</span>').appendTo(sub).click(function() {
    document.body.removeChild(this.parentNode.parentNode);
  });
  
}





var Always = () => true;
var sites = {
  'googleplay' : {
    host : ["play.google.com"],
    condition : Always,
    products : [
    {
      condition : () => ~document.location.href.indexOf("/movies/details/"),
      type : "movie",
      data : () => document.querySelector("*[itemprop=name]").textContent
    }
    ]
  },
  'imdb' : {
    host : ["imdb.com"],
    condition : Always,
    products : [
    {
      condition : function() { 
        var e = document.querySelector("meta[property='og:type']");
        if(e) {
          return e.content == "video.movie"
        }
        return false; 
      },
      type : "movie",
      data : function() {
        var year = null
        if(document.querySelector("#titleYear")) {
          year = parseInt(document.querySelector("#titleYear a").firstChild.textContent);
        }
        
        if(document.querySelector("h1[itemprop=name]")) { // Movie homepage (New design 2015-12)
          return [document.querySelector("h1[itemprop=name]").firstChild.textContent.trim(), year];
        } else if(document.querySelector("*[itemprop=name] a") && document.querySelector("*[itemprop=name] a").firstChild.data) { // Subpage of a move
          return [document.querySelector("*[itemprop=name] a").firstChild.data.trim(), year];
        } else if(document.querySelector(".title-extra[itemprop=name]")) { // Movie homepage: sub-/alternative-/original title
          return [document.querySelector(".title-extra[itemprop=name]").firstChild.textContent.replace(/\"/g,"").trim(), year];
        } else { // Movie homepage (old design)
          return document.querySelector("*[itemprop=name]").firstChild.textContent.trim();
        }
      }
    },
    {
      condition : function() { 
        var e = document.querySelector("meta[property='og:type']");
        if(e) {
          return e.content == "video.tv_show"
        }
        return false; 
      },
      type : "tv",
      data : function() {
        var year = null;
        var m = document.title.match(/\s(\d{4})(\S\d{4}?)?/);
        if(m) {
          year = parseInt(m[1]);
        }
        return [document.querySelector("*[itemprop=name]").textContent ,year]
      }
    }
    ]
  },
  'tv.com' : {
    host : ["www.tv.com"],
    condition : () => document.querySelector("meta[property='og:type']"),
    products : [{
      condition : () => document.querySelector("meta[property='og:type']").content == "tv_show" && document.querySelector("h1[data-name]"),
      type : "tv",
      data : () => document.querySelector("h1[data-name]").dataset.name
    }]
  },
  'metacritic' : {
    host : ["www.metacritic.com"],
    condition : () => document.querySelector("meta[property='og:type']"),
    products : [{
      condition : () => document.querySelector("meta[property='og:type']").content == "video.movie",
      type : "movie",
      data : function() {
        var year = null;
        if(document.querySelector(".release_year")) {
          year = parseInt(document.querySelector(".release_year").firstChild.textContent);
        } else if(document.querySelector(".release_data .data")) {
          year = document.querySelector(".release_data .data").textContent.match(/(\d{4})/)[1]
        }
        
        return [document.querySelector("meta[property='og:title']").content, year]
      }
    },
    {
      condition : () => document.querySelector("meta[property='og:type']").content == "video.tv_show",
      type : "tv",
      data : function() {
        var title = document.querySelector("meta[property='og:title']").content
        var year = null;
        if(title.match(/\s\(\d{4}\)$/)) {
          year = parseInt(title.match(/\s\((\d{4})\)$/)[1]);
          title = title.replace(/\s\(\d{4}\)$/,""); // Remove year
        } else if(document.querySelector(".release_data .data")) {
          year = document.querySelector(".release_data .data").textContent.match(/(\d{4})/)[1]
        }
        
        return [title, year];
      }
    }
    ]
  },
  'serienjunkies' : {
    host : ["www.serienjunkies.de"],
    condition : Always,
    products : [{
      condition : () =>  Always,
      type : "tv",
      data : function() {
        if(document.querySelector("h1[itemprop=name]")) {
          return document.querySelector("h1[itemprop=name]").textContent;
        } else {
          var n = $("a:contains(Details zur)");
          if(n) {
            var name = n.text().match(/Details zur Produktion der Serie (.+)/)[1];
            return name;
          }
        }
      }
    }]
  },
  'amazon' : {
    host : ["amazon."],
    condition : Always,
    products : [
    {
      condition : () => (document.getElementById("aiv-content-title") && document.getElementsByClassName("season-single-dark").length),
      type : "tv",
      data : () => document.getElementById("aiv-content-title").firstChild.data.trim()
    },
    {
      condition : () => document.getElementById("aiv-content-title"),
      type : "movie",
      data : () => document.getElementById("aiv-content-title").firstChild.data.trim()
    }
    ]
  },
  'BoxOfficeMojo' : {
    host : ["boxofficemojo.com"],
    condition : () => ~document.location.search.indexOf("id="),
    products : [{
      condition : () => document.querySelector("#body table:nth-child(2) tr:first-child b"),
      type : "movie",
      data : () => document.querySelector("#body table:nth-child(2) tr:first-child b").firstChild.data
    }]
  },
  'AllMovie' : {
    host : ["allmovie.com"],
    condition : () => document.querySelector("h2[itemprop=name].movie-title"),
    products : [{
      condition : () => document.querySelector("h2[itemprop=name].movie-title"),
      type : "movie",
      data : () => document.querySelector("h2[itemprop=name].movie-title").firstChild.data.trim()
    }]
  },
  'en.wikipedia' : {
    host : ["en.wikipedia.org"],
    condition : Always,
    products : [{
      condition : function() {
        if(!document.querySelector(".infobox .summary")) {
          return false;
        }
        var r = /\d\d\d\d films/;
        return $("#catlinks a").filter((i,e) => e.firstChild.data.match(r)).length;
      },
      type : "movie",
      data : () => document.querySelector(".infobox .summary").firstChild.data
    },
    {
      condition : function() {
        if(!document.querySelector(".infobox .summary")) {
          return false;
        }
        var r = /television series/;
        return $("#catlinks a").filter((i,e) => e.firstChild.data.match(r)).length;
      },
      type : "tv",
      data : () => document.querySelector(".infobox .summary").firstChild.data
    }]
  },
  'movies.com' : {
    host : ["movies.com"],
    condition : () => document.querySelector("meta[property='og:title']"),
    products : [{
      condition : Always,
      type : "movie",
      data : () => document.querySelector("meta[property='og:title']").content
    }]
  },
  'themoviedb' : {
    host : ["themoviedb.org"],
    condition : () => document.querySelector("meta[property='og:type']"),
    products : [{
      condition : () => document.querySelector("meta[property='og:type']").content == "movie",
      type : "movie",
      data : () => document.querySelector("meta[property='og:title']").content
    },
    {
      condition : () => document.querySelector("meta[property='og:type']").content == "tv_series",
      type : "tv",
      data : () => document.querySelector("meta[property='og:title']").content
    }]
  },
  'letterboxd' : {
    host : ["letterboxd.com"],
    condition : () => unsafeWindow.filmData && "name" in unsafeWindow.filmData,
    products : [{
      condition : Always,
      type : "movie",
      data : () => unsafeWindow.filmData.name
    }]
  },
  'TVmaze' : {
    host : ["tvmaze.com"],
    condition : () => document.querySelector("h1"),
    products : [{
      condition : Always,
      type : "tv",
      data : () => document.querySelector("h1").firstChild.data
    }]
  },
  'TVGuide' : {
    host : ["tvguide.com"],
    condition : Always,
    products : [{
      condition : () => document.location.pathname.startsWith("/tvshows/"),
      type : "tv",
      data : () => document.querySelector("meta[property='og:title']").content
    }]
  },
  'followshows' : {
    host : ["followshows.com"],
    condition : Always,
    products : [{
      condition : () => document.querySelector("meta[property='og:type']").content == "video.tv_show",
      type : "tv",
      data : () => document.querySelector("meta[property='og:title']").content
    }]
  },
  'TheTVDB' : {
    host : ["thetvdb.com"],
    condition : Always,
    products : [{
      condition : () => ~document.location.search.indexOf("tab=series"),
      type : "tv",
      data : () => document.querySelector("#content h1").firstChild.data
    }]
  },
  'TVNfo' : {
    host : ["tvnfo.com"],
    condition : () => document.querySelector("#tvsign"),
    products : [{
      condition : Always,
      type : "tv",
      data : () => document.querySelector(".heading h1").textContent.trim()
    }]
  }
};


function main() {

  for(var name in sites) {
    var site = sites[name];
    if(site.host.some(function(e) {return ~this.indexOf(e)}, document.location.hostname))
    if(site.host.some(function(e) {return ~this.indexOf(e)}, document.location.hostname) && site.condition()) {
      for(var i = 0; i < site.products.length; i++) {
        if(site.products[i].condition()) {
          // Try to retrieve item name from page
          var data;
          try {
            data = site.products[i].data();
          } catch(e) {
            data = false;
            console.log(e);
          }
          if(data) {
            if(Array.isArray(data) && data[1]) {
              loadMeter(data[0].trim(), site.products[i].type, parseInt(data[1]));
            } else {
              loadMeter(data.trim(), site.products[i].type);
            }
          }
          break;
        }
      }
      break;
    }
  }
}



(function() {

  main();
  var lastLoc = document.location.href;
  var lastContent = document.body.innerText;
  var lastCounter = 0;
  function newpage() {
    if(lastContent == document.body.innerText && lastCounter < 15) {
      window.setTimeout(newpage, 500);
      lastCounter++;
    } else {
      lastCounter = 0;
      main();
    }
  }
  window.setInterval(function() {
    if(document.location.href != lastLoc) {
      lastLoc = document.location.href;
      $("#mcdiv321rotten").remove();
        
      window.setTimeout(newpage,1000);
    }
  },500);

})();
