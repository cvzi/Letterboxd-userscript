// ==UserScript==
// @name        Show Metacritic.com ratings
// @description Show metacritic metascore and user ratings on: Bandcamp, Apple Itunes (Music), Amazon (Music,Movies,TV Shows), IMDb (Movies), Google Play (Music, Movies), TV.com, Steam, Gamespot (PS4, XONE, PC), Rotten Tomatoes, Serienjunkies, BoxOfficeMojo, allmovie.com, movie.com, Wikipedia (en), themoviedb.org, letterboxd, TVmaze, TVGuide, followshows.com, TheTVDB.com
// @namespace   cuzi
// @oujs:author cuzi
// @grant       GM_xmlhttpRequest
// @grant       GM_getResourceURL
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       unsafeWindow
// @require     http://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @resource    global.min.css http://www.metacritic.com/css/global.min.1446760484.css
// @resource    base.min.css http://www.metacritic.com/css/search/base.min.1446760407.css
// @license     GNUGPL
// @version     6
// @include     https://*.bandcamp.com/*
// @include     https://itunes.apple.com/*/album/*
// @include     https://play.google.com/store/music/album/*
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
// @include     http://store.steampowered.com/app/*
// @include     https://store.steampowered.com/app/*
// @include     http://www.gamespot.com/*
// @include     https://www.gamespot.com/*
// @include     http://www.serienjunkies.de/*
// @include     https://www.serienjunkies.de/*
// @include     http://www.tv.com/shows/*
// @include     http://www.rottentomatoes.com/m/*
// @include     https://www.rottentomatoes.com/m/*
// @include     http://www.rottentomatoes.com/tv/*
// @include     https://www.rottentomatoes.com/tv/*
// @include     http://www.boxofficemojo.com/movies/*
// @include     http://www.allmovie.com/movie/*
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
// ==/UserScript==

var baseURL = "http://www.metacritic.com/";

var baseURL_music = "http://www.metacritic.com/music/";
var baseURL_movie = "http://www.metacritic.com/movie/";
var baseURL_pcgame = "http://www.metacritic.com/game/pc/";
var baseURL_ps4 = "http://www.metacritic.com/game/playstation-4/";
var baseURL_xone = "http://www.metacritic.com/game/xbox-one/";
var baseURL_tv = "http://www.metacritic.com/tv/";

var baseURL_search = "http://www.metacritic.com/search/{type}/{query}/results";
var baseURL_autosearch = "http://www.metacritic.com/autosearch";

var mybrowser = "other";
if(~navigator.userAgent.indexOf("Chrome")) {
  mybrowser = "chrome";
}


// http://www.designcouch.com/home/why/2013/05/23/dead-simple-pure-css-loading-spinner/
var CSS = "#mcdiv123 .grespinner{height:16px;width:16px;margin:0 auto;position:relative;-webkit-animation:rotation .6s infinite linear;-moz-animation:rotation .6s infinite linear;-o-animation:rotation .6s infinite linear;animation:rotation .6s infinite linear;border-left:6px solid rgba(0,174,239,.15);border-right:6px solid rgba(0,174,239,.15);border-bottom:6px solid rgba(0,174,239,.15);border-top:6px solid rgba(0,174,239,.8);border-radius:100%}@-webkit-keyframes rotation{from{-webkit-transform:rotate(0)}to{-webkit-transform:rotate(359deg)}}@-moz-keyframes rotation{from{-moz-transform:rotate(0)}to{-moz-transform:rotate(359deg)}}@-o-keyframes rotation{from{-o-transform:rotate(0)}to{-o-transform:rotate(359deg)}}@keyframes rotation{from{transform:rotate(0)}to{transform:rotate(359deg)}}#mcdiv123searchresults .result{font:12px arial,helvetica,serif;border-top-width:1px;border-top-color:#ccc;border-top-style:solid;padding:5px}#mcdiv123searchresults .result .result_type{display:inline}#mcdiv123searchresults .result .result_wrap{float:left;width:100%}#mcdiv123searchresults .result .has_score{padding-left:42px}#mcdiv123searchresults .result .basic_stats{height:1%;overflow:hidden}#mcdiv123searchresults .result h3{font-size:14px;font-weight:700}#mcdiv123searchresults .result a{color:#09f;font-weight:700;text-decoration:none}#mcdiv123searchresults .metascore_w.game.seventyfive,#mcdiv123searchresults .metascore_w.positive,#mcdiv123searchresults .metascore_w.score_favorable,#mcdiv123searchresults .metascore_w.score_outstanding,#mcdiv123searchresults .metascore_w.sixtyone{background-color:#6c3}#mcdiv123searchresults .metascore_w.forty,#mcdiv123searchresults .metascore_w.game.fifty,#mcdiv123searchresults .metascore_w.mixed,#mcdiv123searchresults .metascore_w.score_mixed{background-color:#fc3}#mcdiv123searchresults .metascore_w.negative,#mcdiv123searchresults .metascore_w.score_terrible,#mcdiv123searchresults .metascore_w.score_unfavorable{background-color:red}#mcdiv123searchresults a.metascore_w,#mcdiv123searchresults span.metascore_w{display:inline-block}#mcdiv123searchresults .result .metascore_w{color:#fff!important;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-style:normal!important;font-weight:700!important;height:2em;line-height:2em;text-align:center;vertical-align:middle;width:2em;float:left;margin:0 0 0 -42px}#mcdiv123searchresults .result .more_stats{font-size:10px;color:#444}#mcdiv123searchresults .result .release_date .data{font-weight:700;color:#000}#mcdiv123searchresults ol,#mcdiv123searchresults ul{list-style:none}#mcdiv123searchresults .result li.stat{background:0 0;display:inline;float:left;margin:0;padding:0 6px 0 0;white-space:nowrap}#mcdiv123searchresults .result .deck{margin:3px 0 0}#mcdiv123searchresults .result .basic_stat{display:inline;float:right;overflow:hidden;width:100%}";

function name2metacritic(s) {
  return s.normalize('NFKD').replace(/\//g,"").replace(/[\u0300-\u036F]/g, '').replace(/&/g,"and").replace(/\W+/g, " ").toLowerCase().trim().replace(/\W+/g,"-");
}
function minutesSince(time) {
  var seconds = ((new Date()).getTime() - time.getTime()) / 1000;
  return seconds>60?parseInt(seconds/60)+" min ago":"now";
}
function randomStringId() {
  var id10 = () => Math.floor((1 + Math.random()) * 0x10000000000).toString(16).substring(1);
  return id10()+id10()+id10()+id10()+id10()+id10();
}
function fixMetacriticURLs(html) {
  return html.replace(/<a /g,'<a target="_blank" ').replace(/href="\//g,'href="'+baseURL).replace(/src="\//g,'src="'+baseURL);
}
function searchType2metacritic(type) {
  return ({
    'movie' : 'movie',
    'pcgame' : 'game',
    'xonegame' : 'game',
    'ps4game' : 'game',
    'music' : 'album',
    'tv' : 'tv'
  })[type];
}
function metacritic2searchType(type) {
  return ({
    "Album" : "music",
    "TV" : "tv",
    "Movie" : "movie",
    "PC Game" : "pcgame",
    "PS4 Game" : "ps4game",
    "XONE Game" : "onegame",
    "WIIU Game" : "xxxxx",
    "3DS Game" : "xxxx"
  })[type];
}


function metaScore(score, word) {
  var fg,bg,t;
  if(score == null) {
    fg = "black";
    bg = "#ccc";
    t = "tbd";
  } else if(score >= 75) {
    fg = "white";
    bg = "#6c3";
    t = parseInt(score);
  } else if(score < 40) {
    fg = "white";
    bg = "#f00";
    t = parseInt(score);
  } else {
    fg = "white";
    bg = "#fc3";
    t = parseInt(score);
  }
  
 return '<span title="'+(word?word:'')+'" style="display: inline-block; color: '+fg+';background:'+bg+';font-family: Arial,Helvetica,sans-serif;font-size: 17px;font-style: normal;font-weight: bold;height: 2em;width: 2em;line-height: 2em;text-align: center;vertical-align: middle;">'+t+'</span>';
}

function filterUniversalUrl(url) {
  url = url.match(/http.+/)[0].replace(/https?:\/\/(www.)?/,"");
  
  if(url.startsWith("somehost")) {// TODO 
     return url; // Do not remove parameters
  } else {
    return url.split("?")[0].split("&")[0]; // Remove parameters
  }
}

function addToMap(url, metaurl) {
  var data = JSON.parse(GM_getValue("map","{}"));
  
  var url = filterUniversalUrl(url);
  var metaurl = metaurl.replace(/^http:\/\/(www.)?metacritic\.com\//,"");

  data[url] = metaurl;
  
  GM_setValue("map", JSON.stringify(data));
  
  (new Image()).src = "http://123.net23.net/whitelist.php?docurl="+encodeURIComponent(url)+"&metaurl="+encodeURIComponent(metaurl)+"&ref="+encodeURIComponent(randomStringId());
}

function addToBlacklist(url, metaurl) {
  var data = JSON.parse(GM_getValue("black","{}"));
  
  var url = filterUniversalUrl(url);
  var metaurl = metaurl.replace(/^http:\/\/(www.)?metacritic\.com\//,"");

  data[url] = metaurl;
  
  GM_setValue("black", JSON.stringify(data));
  
  (new Image()).src = "http://123.net23.net/blacklist.php?docurl="+encodeURIComponent(url)+"&metaurl="+encodeURIComponent(metaurl)+"&ref="+encodeURIComponent(randomStringId());
}

function isBlacklistedUrl(docurl, metaurl) { 
  docurl = docurl.replace(/https?:\/\/(www.)?/,"");
  
  metaurl = metaurl.replace(/^http:\/\/(www.)?metacritic\.com\//,"");
  metaurl = metaurl.replace(/\/\//g,"/").replace(/\/\//g,"/");; // remove double slash
  
  
  var data = JSON.parse(GM_getValue("black","{}"));
  if(docurl in data) {
    if(data[docurl] == metaurl) {
      return true;
    }
  }
  return false;
}

function isBlacklisted(metaurl) {
  return isBlacklistedUrl("" + document.location.host.replace(/^www\./,"") + document.location.pathname + document.location.search, metaurl);
}



function listenForHotkeys(code, cb) {
  // Call cb() as soon as the code sequence was typed
  var i = 0;
  $(document).bind("keydown.listenForHotkeys",function(ev) {
    if(document.activeElement == document.body) {
      if(ev.key != code[i]) {
        i = 0;
      } else {
        i++;
        if(i == code.length) {
          ev.preventDefault();
          $(document).unbind("keydown.listenForHotkeys");
          cb();
        }
      }
    }
  });
}


function metacritic_hoverInfo(url, cb, errorcb) {
  // Get the metacritic hover info. Requests are cached.
  var handleresponse = function(response, cached) {
    if(response.status == 200 && cb) {
      if(~response.responseText.indexOf('"jsonRedirect"')) { // {"viewer":{},"mixpanelToken":"6e219fd....","mixpanelDistinctId":"255.255.255.255","omnitureDebug":0,"jsonRedirect":"\/movie\/national-lampoons-vacation"}
        var j = JSON.parse(response.responseText);
        current.url = baseURL + j["jsonRedirect"];
        metacritic_hoverInfo(baseURL + j["jsonRedirect"], cb, errorcb);
      } else {
        cb(response.responseText, new Date(response.time));
      }
    } else if(response.status != 200 && errorcb) {
      errorcb(response.responseText, new Date(response.time));
      if(!cached)
        console.log("Show metacritic ratings: Error:"+response.status+"\n"+url);
    }
  };
  
  var cache = JSON.parse(GM_getValue("hovercache","{}"));
  for(var prop in cache) {
    // Delete cached values, that are older than 2 hours
    if((new Date()).getTime() - (new Date(cache[prop].time)).getTime() > 2*60*60*1000) { 
      delete cache[prop];
    }
  }
  
  if(url in cache) {
    handleresponse(cache[url], true);
  } else {
    GM_xmlhttpRequest({
      method: "POST",
      url: url,
      data: "hoverinfo=1",
      headers: {
        "Referer" : url,
        "Content-Type" : "application/x-www-form-urlencoded; charset=UTF-8",
        "Host" : "www.metacritic.com",
        "User-Agent" : "MetacriticUserscript "+navigator.userAgent,
        "X-Requested-With" : "XMLHttpRequest"
      },
      onload: function(response) { 
        response.time = (new Date()).toJSON();
        cache[url] = response;
        
        GM_setValue("hovercache",JSON.stringify(cache));
        handleresponse(response, false);
      }
    });
  }
}
function metacritic_searchResults(url, cb, errorcb) {
  // Get metacritic search results. Requests are cached.
  var handleresponse = function(response, cached) {
    if(response.results.length && cb) {
      cb(response.results, new Date(response.time));
    } else if(response.results.length == 0 && errorcb) {
      errorcb(response.results, new Date(response.time));
    }
  };
  
  var cache = JSON.parse(GM_getValue("searchcache","{}"));
  for(var prop in cache) {
    // Delete cached values, that are older than 2 hours
    if((new Date()).getTime() - (new Date(cache[prop].time)).getTime() > 2*60*60*1000) { 
      delete cache[prop];
    }
  }
  
  if(url in cache) {
    handleresponse(cache[url], true);
  } else {
    GM_xmlhttpRequest({
      method: "GET",
      url: url,
      headers: {
        "Referer" : url,
        "Content-Type" : "application/x-www-form-urlencoded; charset=UTF-8",
        "Host" : "www.metacritic.com",
        "User-Agent" : "MetacriticUserscript "+navigator.userAgent,
      },
      onload: function(response) { 
        
        var results = [];
        if(!~response.responseText.indexOf("No search results found.")) {
          var d = $('<html>').html(response.responseText);
          d.find("ul.search_results.module .result").each(function() {
            results.push(this.innerHTML);
          });
        }

        response = {
          time : (new Date()).toJSON(),
          results : results,
        };
        cache[url] = response;
        GM_setValue("searchcache",JSON.stringify(cache));
        handleresponse(response, false);
      },
      onerror: function(response) {
              alert(response.responseText);
        console.log("Show metacritic ratings: Search error: "+response.status+"\n"+url);
        handleresponse({
          time : (new Date()).toJSON(),
          results : [],
        }, false);
      }
    });
  }
}

function metacritic_showHoverInfo(url) {
  if(!url) {
    return;
  }
  metacritic_hoverInfo(url, 
  // On Success
  function(html, time) {
    $("#mcdiv123").remove();
    var div = $('<div id="mcdiv123"></div>').appendTo(document.body);
    div.css({
      position:"fixed", 
      bottom :0, 
      left: 0,
      minWidth: 300,
      backgroundColor: "#fff",
      border: "2px solid #bbb",
      borderRadius:" 6px",
      boxShadow: "0 0 3px 3px rgba(100, 100, 100, 0.2)",
      color: "#000",
      padding:" 3px",
      zIndex: "5010001",
    });
    
    // Functions for communication between page and iframe
    // Mozilla can access parent.document
    // Chrome can use postMessage()
    var functions = {
      "other" : {
        "parent": function() {},
        "frame" : function sizecorrection() {
          var f = parent.document.getElementById('mciframe123');
          for(var i =0; f.clientHeight < document.body.scrollHeight && i < 100; i++) {
            f.style.width = parseInt(f.style.width)+10+"px";
          }
          if(f.clientHeight < document.body.scrollHeight) {
            f.style.height = parseInt(f.style.height)+15+"px";
            f.style.width = "300px";
            sizecorrection();
          }
        }
      },
      "chrome" : {
        "parent" : function() {
          var f = parent.document.getElementById('mciframe123');
          window.addEventListener("message", function(e){
            if("mcimessage1" in e.data) {
              f.style.width = parseInt(f.style.width)+10+"px";
            } else if("mcimessage2" in e.data) {
              f.style.height = parseInt(f.style.height)+15+"px";
              f.style.width = "300px";
            } else {
              return;
            }
            f.contentWindow.postMessage({
              "mcimessage3" : true,
              "mciframe123_clientHeight" : f.clientHeight,
              "mciframe123_clientWidth" : f.clientWidth,
            },'*');
          });
        },
        "frame" : function() {
          var i = 0;
          window.addEventListener("message", function(e){
            if(!("mcimessage3" in e.data)) return; 
            if(e.data.mciframe123_clientHeight < document.body.scrollHeight && i < 100) {
              parent.postMessage({"mcimessage1":1},'*');
              i++;
            }
            if(i >= 100) {
              parent.postMessage({"mcimessage2":1},'*')
              i = 0;
            } 
          });
          parent.postMessage({"mcimessage1":1},'*');
        }
      }
      
    };
    
    var framesrc = 'data:text/html,';
    framesrc += encodeURIComponent('<!DOCTYPE html>\
    <html lang="en">\
      <head>\
        <meta charset="utf-8">\
        <title>Metacritic info</title>\
        <link rel="stylesheet" href="'+(mybrowser=="chrome"?"data:text/css;base64,":"")+GM_getResourceURL("base.min.css")+'" type="text/css">\
        <link rel="stylesheet" href="'+(mybrowser=="chrome"?"data:text/css;base64,":"")+GM_getResourceURL("global.min.css")+'" type="text/css">\
        <style>body { margin:0px; padding:0px; background:white; }</style>\
        <script>\
        function on_load() {\
          ('+functions[mybrowser].frame.toString()+')();\
        }\
        </script>\
      </head>\
      <body onload="on_load();">\
        <div style="border:0px solid; display:block; position:relative; border-radius:0px; padding:0px; margin:0px; box-shadow:none;" class="hover_div" id="hover_div">\
          <div class="hover_content">'+fixMetacriticURLs(html)+'</div>\
        </div>\
      </body>\
    </html>');    

      
    var frame = $("<iframe></iframe>").appendTo(div);
    frame.attr("id","mciframe123");
    frame.attr("src",framesrc);
    frame.attr("scrolling","auto");
    frame.css({
      width: 300,
      height: 170,
      border: "none"
    });
    
    functions[mybrowser].parent();
       
    var sub = $("<div></div>").appendTo(div);
    $('<time style="color:#b6b6b6; font-size: 11px;" datetime="'+time+'" title="'+time.toLocaleFormat()+'">'+minutesSince(time)+'</time>').appendTo(sub);
    $('<a style="color:#b6b6b6; font-size: 11px;" target="_blank" href="'+url+'" title="Open Metacritic">'+decodeURI(url.replace("http://www.","@"))+'</a>').appendTo(sub);
    $('<span title="Hide me" style="cursor:pointer; float:right; color:#b6b6b6; font-size: 11px;">&#128128;</span>').appendTo(sub).click(function() {
      document.body.removeChild(this.parentNode.parentNode);
    });
    
    $('<span title="This is the correct entry" style="cursor:pointer; float:right; color:green; font-size: 11px;">&check;</span>').data("url", url).appendTo(sub).click(function() {
      var docurl = document.location.href;
      var metaurl = $(this).data("url");
      addToMap(docurl,metaurl);
      alert("Saved to correct list!\n\n"+docurl+"\n"+metaurl);
    });
    $('<span title="This is NOT the correct entry" style="cursor:pointer; float:right; color:crimson; font-size: 11px;">&cross;</span>').data("url", url).appendTo(sub).click(function() {
      if(!confirm("This is NOT the correct entry!\n\nAdd to blacklist?")) return;
      var docurl = document.location.href;
      var metaurl = $(this).data("url");
      addToBlacklist(docurl,metaurl);
      alert("Saved to blacklist!\n\n"+docurl+"\n"+metaurl);
      
      // Open search
      metacritic_searchcontainer(null, current.searchTerm);
      metacritic_search(null, current.searchTerm);
    });
    
    

  },
  // On error i.e. no result on metacritic.com
  function(html, time) {    
  
    // Make search available
    metacritic_waitForHotkeys();
    
    var handleresponse = function(response) {
      var data;
      try {
        data = JSON.parse(response.responseText);
      } catch(e) {
        console.log("Error in JSON: search_term="+current.searchTerm);
        console.log(e);
      }
      if(data && data.autoComplete && data.autoComplete.length) {
        // Remove data with wrong type
        var newdata = [];
        data.autoComplete.forEach(function(result) {
          if(metacritic2searchType(result.refType) == current.type) {
            newdata.push(result);
          }
        });
        data.autoComplete = newdata;
        if(data.autoComplete.length == 0) {
          // No results
          console.log("No results (after filtering by type) for search_term="+current.searchTerm);
        } else if(data.autoComplete.length == 1) {
          // One result, let's show it
          if(!isBlacklisted(baseURL + data.autoComplete[0].url)) {
            metacritic_showHoverInfo(baseURL + data.autoComplete[0].url);
            return;
          }
        } else {
          // More than one result
          console.log("Multiple results for search_term="+current.searchTerm);
          var exactMatches = [];
          data.autoComplete.forEach(function(result,i) { // Try to find the correct result by matching the search term to exactly one movie title
            if(current.searchTerm == result.name) {
              exactMatches.push(result);
            }
          });
          if(exactMatches.length == 1) {
            // Only one exact match, let's show it
            if(!isBlacklisted(baseURL + exactMatches[0].url)) {
              metacritic_showHoverInfo(baseURL + exactMatches[0].url);
              return;
            }
          } 
        } 
      }
      // HERE: multiple results or no result. The user may type "meta" now
    };
    var cache = JSON.parse(GM_getValue("autosearchcache","{}"));
    for(var prop in cache) {
      // Delete cached values, that are older than 2 hours
      if((new Date()).getTime() - (new Date(cache[prop].time)).getTime() > 2*60*60*1000) { 
        delete cache[prop];
      }
    }
    
    current.searchTerm = current.data.join(" ");
    if(current.searchTerm in cache) {
      handleresponse(cache[current.searchTerm], true);
    } else {
      GM_xmlhttpRequest({
        method: "POST",
        url: baseURL_autosearch,
        data: "search_term="+encodeURIComponent(current.searchTerm),
        headers: {
          "Referer" : url,
          "Content-Type" : "application/x-www-form-urlencoded; charset=UTF-8",
          "Host" : "www.metacritic.com",
          "User-Agent" : "MetacriticUserscript Mozilla/5.0 (Android 4.4; Mobile; rv:41.0) Gecko/41.0 Firefox/41.0",
          "X-Requested-With" : "XMLHttpRequest"
        },
        onload: function(response) {
          
          response = {
            time : (new Date()).toJSON(),
            responseText : response.responseText,
          };
          cache[current.searchTerm] = response;
          GM_setValue("autosearchcache",JSON.stringify(cache));
          handleresponse(response, false);
        }
      });
    }
  });
}

function metacritic_waitForHotkeys() {
  listenForHotkeys("meta",metacritic_searchcontainer);
}

function metacritic_searchcontainer(ev, query) {
  if(!query) {
    query = current.data.join(" ");
  }
  $("#mcdiv123").remove();
  var div = $('<div id="mcdiv123"></div>').appendTo(document.body);
  div.css({
    position:"fixed", 
    bottom :0, 
    left: 0,
    minWidth: 300,
    maxHeight: "80%",
    maxWidth: 640,
    overflow:"auto",
    backgroundColor: "#fff",
    border: "2px solid #bbb",
    borderRadius:" 6px",
    boxShadow: "0 0 3px 3px rgba(100, 100, 100, 0.2)",
    color: "#000",
    padding:" 3px",
    zIndex: "5010001",
  });
  var query = $('<input type="text" size="60" id="mcisearchquery">').appendTo(div).focus().val(query).on('keypress', function(e) {
    var code = e.keyCode || e.which;
    if(code == 13) { // Enter key
      metacritic_search.call(this,e);
    }
  });
  $('<button id="mcisearchbutton">').text("Search").appendTo(div).click(metacritic_search);
}


function metacritic_search(ev, query) {
  if(!query) { // Use values from search form
    query = $("#mcisearchquery").val();
  }
  var type = current.type;

  var style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = CSS;
  document.head.appendChild(style);
  
  var div = $("#mcdiv123");
  var loader = $('<div style="width:20px; height:20px;" class="grespinner"></div>').appendTo($("#mcisearchbutton"));
  
  var url = baseURL_search.replace("{type}",encodeURIComponent(type)).replace("{query}",encodeURIComponent(query));
  metacritic_searchResults(url, 
  // On success
  function(results, time) {
    loader.remove();
    
    var accept = function(ev) {
      var a = $(this.parentNode).find("a[href*='metacritic.com']");
      var metaurl = a.attr("href");
      
      var docurl = document.location.href;

      addToMap(docurl,metaurl);
      
      metacritic_showHoverInfo(metaurl);
    };
    var denyAll = function(ev) {
      var urls = [];
      var docurl = document.location.href;
      $("#mcdiv123searchresults").find("div.result a[href*='metacritic.com']").each(function() {
        addToBlacklist(docurl, this.href);
      });
    };
    
    var resultdiv = $("#mcdiv123searchresults").length?$("#mcdiv123searchresults").html(""):$('<div id="mcdiv123searchresults"></div>').css("max-width","95%").appendTo(div);
    results.forEach(function(html) {
      var singleresult = $('<div class="result"></div>').html(fixMetacriticURLs(html)+'<div style="clear:left"></div>').appendTo(resultdiv);
      $('<span title="This is the correct entry" style="cursor:pointer; color:green; font-size: 13px;">&check;</span>').prependTo(singleresult).click(accept);
    });
    var sub = $("<div></div>").appendTo(div);
    $('<time style="color:#b6b6b6; font-size: 11px;" datetime="'+time+'" title="'+time.toLocaleFormat()+'">'+minutesSince(time)+'</time>').appendTo(sub);
    $('<a style="color:#b6b6b6; font-size: 11px;" target="_blank" href="'+url+'" title="Open Metacritic">'+decodeURI(url.replace("http://www.","@"))+'</a>').appendTo(sub);
    $('<span title="Hide me" style="cursor:pointer; float:right; color:#b6b6b6; font-size: 11px;">&#128128;</span>').appendTo(sub).click(function() {
      document.body.removeChild(this.parentNode.parentNode);
    });
    $('<span title="None of the above is the correct item" style="cursor:pointer; float:right; color:crimson; font-size: 11px;">&cross;</span>').appendTo(sub).click(function() {if(confirm("None of the above is the correct item\nConfirm?")) denyAll()});
  },
  // On error i.e. no results
  function(results, time) {
    loader.remove();
    var resultdiv = $("#mcdiv123searchresults").length?$("#mcdiv123searchresults").html(""):$('<div id="mcdiv123searchresults"></div>').appendTo(div);
    resultdiv.html("No search results.");
    
    var sub = $("<div></div>").appendTo(div);
    $('<time style="color:#b6b6b6; font-size: 11px;" datetime="'+time+'" title="'+time.toLocaleFormat()+'">'+minutesSince(time)+'</time>').appendTo(sub);
    $('<a style="color:#b6b6b6; font-size: 11px;" target="_blank" href="'+url+'" title="Open Metacritic">'+decodeURI(url.replace("http://www.","@"))+'</a>').appendTo(sub);
    $('<span title="Hide me" style="cursor:pointer; float:right; color:#b6b6b6; font-size: 11px;">&#128128;</span>').appendTo(sub).click(function() {
      document.body.removeChild(this.parentNode.parentNode);
    });
    
  }
  );
}

var current = {
  url : null,
  type : null,
  data : null, // Array of raw search keys 
  searchTerm : null
};


function showURL(url) {
  if(!isBlacklisted(url)) {
    metacritic_showHoverInfo(url);
  } else {
    console.log(url +" is blacklisted!");
  }
}


var metacritic = {
  "mapped" : function metacritic_mapped(url, type) {
    // url was in the map/whitelist
    current.data = [url]
    current.url = url;
    current.type = type;
    current.searchTerm = url;
    showURL(url);
  },
  "music" : function metacritic_music(artistname, albumname) {
    current.data = [albumname.trim(),artistname.trim()]
    artistname = name2metacritic(artistname);
    albumname = name2metacritic(albumname);
    var url = baseURL_music + albumname + "/" + artistname;
    current.url = url;
    current.type = "music";
    current.searchTerm = albumname + "/" + artistname;
    showURL(url);
  },
  "movie" : function metacritic_movie(moviename) {
    current.data = [moviename.trim()]
    moviename = name2metacritic(moviename);
    var url = baseURL_movie + moviename;
    current.url = url;
    current.type = "movie";
    current.searchTerm = moviename;
    showURL(url);
  },
  "tv" : function metacritic_tv(seriesname) {
    current.data = [seriesname.trim()]
    seriesname = name2metacritic(seriesname);
    var url = baseURL_tv + seriesname;
    current.url = url;
    current.type = "tv";
    current.searchTerm = seriesname;
    showURL(url);
  },
  "pcgame" : function metacritic_pcgame(gamename) {
    current.data = [gamename.trim()]
    gamename = name2metacritic(gamename);
    var url = baseURL_pcgame + gamename;
    current.url = url;
    current.type = "pcgame";
    current.searchTerm = gamename;
    showURL(url);
  },
  "ps4game" : function metacritic_ps4game(gamename) {
    current.data = [gamename.trim()]
    gamename = name2metacritic(gamename);
    var url = baseURL_ps4 + gamename;
    current.url = url;
    current.type = "ps4game";
    current.searchTerm = gamename;
    showURL(url);
  },
  "xonegame" : function metacritic_xonegame(gamename) {
    current.data = [gamename.trim()]
    gamename = name2metacritic(gamename);
    var url = baseURL_xone + gamename;
    current.url = url;
    current.type = "xonegame";
    current.searchTerm = gamename;
    showURL(url);
  }
};


var Always = () => true;
var sites = {
  'bandcamp' : {
    host : ["bandcamp.com"],
    condition : function() {
      return unsafeWindow.TralbumData
    },
    products : [{
      condition : Always,
      type : "music",
      data : () => [unsafeWindow.TralbumData.artist, unsafeWindow.TralbumData.current.title]
    }]
  },
  'itunes' : {
    host : ["itunes.apple.com"],
    condition : Always,
    products : [{
      condition : () => ~document.location.href.indexOf("/album/") ,
      type : "music",
      data : () => [document.querySelector("*[itemprop=byArtist]").textContent, document.querySelector("*[itemprop=name]").textContent] 
    }]
  },
  'googleplay' : {
    host : ["play.google.com"],
    condition : Always,
    products : [
    {
      condition : () => ~document.location.href.indexOf("/album/"),
      type : "music",
      data : () => [document.querySelector("*[itemprop=byArtist] a").textContent, document.querySelector("*[itemprop=name]").textContent]
    },
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
        if(document.querySelector(".title-extra[itemprop=name]")) {
          return [document.querySelector(".title-extra[itemprop=name]").firstChild.textContent.replace(/\"/g,"")];
        } else {
          return document.querySelector("*[itemprop=name]").textContent;
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
      data : () => document.querySelector("*[itemprop=name]").textContent
    }
    ]
  },
  'steam' : {
    host : ["store.steampowered.com"],
    condition : () => document.querySelector("*[itemprop=name]"),
    products : [{
      condition : Always,
      type : "pcgame",
      data : () => document.querySelector("*[itemprop=name]").textContent
    }]
  },
  'tv.com' : {
    host : ["www.tv.com"],
    condition : () => document.querySelector("h1[itemprop=name]"),
    products : [{
      condition : Always,
      type : "tv",
      data : () => document.querySelector("h1[itemprop=name]").textContent
    }]
  },
  'rottentomatoes' : {
    host : ["www.rottentomatoes.com"],
    condition : Always,
    products : [{
      condition : () => document.location.pathname.startsWith("/m/"),
      type : "movie",
      data : () => document.querySelector("h1[itemprop=name]").firstChild.textContent
    },
    {
      condition : () =>  document.location.pathname.startsWith("/tv/") ,
      type : "tv",
      data : () =>  document.querySelector("*[itemprop=partOfSeries] *[itemprop=name]").textContent
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
  'gamespot' : {
    host : ["gamespot.com"],
    condition : () => document.querySelector("[itemprop=device]"),
    products : [
    {
      condition : () => $("[itemprop=device]").text().contains("PC"),
      type : "pcgame",
      data : () => document.querySelector("h1[itemprop=name]").textContent 
    },
    {
      condition : () => $("[itemprop=device]").text().contains("PS4"),
      type : "ps4game",
      data : () => document.querySelector("h1[itemprop=name]").textContent
    },
    {
      condition : () => $("[itemprop=device]").text().contains("XONE"),
      type : "xonegame",
      data : () => document.querySelector("h1[itemprop=name]").textContent
    }
    ]
  },
  'amazon' : {
    host : ["amazon."],
    condition : Always,
    products : [
    {
      condition : function() {
        var music = ["Music","Musique","Musik","Música","Musica","音楽"];
        return music.some(function(s) {
          if(~document.title.indexOf(s)) {
            return true;
          } else {
            return false;
          }
        });
      },
      type : "music",
      data : function() {
        var artist = document.querySelector("#byline .author a").textContent;
        var title = document.getElementById("productTitle").textContent;
        title = title.replace(/\[([^\]]*)\]/g,""); // Remove [brackets] and their content
        return [artist, title];
      }
    },
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
  }
};


function main() {

  var map = false;

  for(var name in sites) {
    var site = sites[name];
    if(site.host.some(function(e) {return ~this.indexOf(e)}, document.location.hostname) && site.condition()) {
      for(var i = 0; i < site.products.length; i++) {
        if(site.products[i].condition()) {
          // Check map for a match
          if(map === false) {
            map = JSON.parse(GM_getValue("map","{}"));
          }
          var docurl = document.location.host.replace(/^www\./,"") + document.location.pathname + document.location.search;
          if(docurl in map) {
            // Found in map, show result
            var metaurl = map[docurl];
            metacritic["mapped"].apply(undefined, [baseURL + metaurl, site.products[i].type]);
            break;
          }
          // Try to retrieve item name from page
          var data;
          try {
            data = site.products[i].data();
          } catch(e) {
            data = false;
            console.log(e);
          }
          if(data !== false) {
            metacritic[site.products[i].type].apply(undefined, Array.isArray(data)?data:[data]);
          }
          break;
        }
      }
      break;
    }
  }
}



main();
var lastLoc = document.location.href;
window.setInterval(function() {
  if(document.location.href != lastLoc) {
    lastLoc = document.location.href;
    $("#mcdiv123").remove();
    window.setTimeout(main,500);
  }
},500);

