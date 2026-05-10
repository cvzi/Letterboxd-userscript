// ==UserScript==
// @name        Show Letterboxd rating
// @description Show Letterboxd rating on imdb.com, metacritic.com, rottentomatoes.com, BoxOfficeMojo, Amazon, Google Play, allmovie.com, Wikipedia, themoviedb.org, fandango.com, thetvdb.com, save.tv
// @namespace   cuzi
// @icon        https://a.ltrbxd.com/logos/letterboxd-mac-icon.png
// @updateURL   https://openuserjs.org/meta/cuzi/Show_Letterboxd_rating.meta.js
// @grant       GM_xmlhttpRequest
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM.xmlHttpRequest
// @grant       GM.setValue
// @grant       GM.getValue
// @require     https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @license     GPL-3.0-or-later; https://www.gnu.org/licenses/gpl-3.0.txt
// @version     32
// @connect     letterboxd.com
// @match       https://play.google.com/store/movies/details/*
// @match       https://www.amazon.ca/*
// @match       https://www.amazon.co.jp/*
// @match       https://www.amazon.co.uk/*
// @match       https://smile.amazon.co.uk/*
// @match       https://www.amazon.com.au/*
// @match       https://www.amazon.com.mx/*
// @match       https://www.amazon.com/*
// @match       https://smile.amazon.com/*
// @match       https://www.amazon.de/*
// @match       https://smile.amazon.de/*
// @match       https://www.amazon.es/*
// @match       https://www.amazon.fr/*
// @match       https://www.amazon.in/*
// @match       https://www.amazon.it/*
// @match       https://www.imdb.com/title/*
// @match       https://www.boxofficemojo.com/movies/*
// @match       https://www.boxofficemojo.com/release/*
// @match       https://www.allmovie.com/movie/*
// @match       https://en.wikipedia.org/*
// @match       https://www.fandango.com/*
// @match       https://www.themoviedb.org/movie/*
// @match       https://www.rottentomatoes.com/m/*
// @match       https://rottentomatoes.com/m/*
// @match       https://www.metacritic.com/movie/*
// @match       https://www.nme.com/reviews/movie/*
// @match       https://www.nme.com/reviews/film-reviews/*
// @match       https://itunes.apple.com/*
// @match       https://thetvdb.com/movies/*
// @match       https://rlsbb.ru/*/
// @match       https://www.sho.com/*
// @match       https://www.gog.com/*
// @match       https://psa.wf/*
// @match       https://www.save.tv/*
// @match       https://www.wikiwand.com/*
// @match       https://trakt.tv/*
// @match       http://localhost:7878/*
// ==/UserScript==

/* global GM, $, Image */
/* jshint asi: true, esversion: 8 */

const baseURL = 'https://letterboxd.com'
const baseURLsearch = baseURL + '/s/autocompletefilm?q={query}&limit=20&timestamp={timestamp}'
const baseURLopenTab = baseURL + '/search/{query}/'
const baseURLratingHistogram = baseURL + '/csi{url}rating-histogram/'
const baseURLposter = baseURL + '{film_url}poster/std/150/'

const cacheExpireAfterHours = 4

function minutesSince (time) {
  const seconds = ((new Date()).getTime() - time.getTime()) / 1000
  return seconds > 60 ? parseInt(seconds / 60) + ' min ago' : 'now'
}

function fixLetterboxdURLs (html) {
  return html.replace(/<a /g, '<a target="_blank" ').replace(/href="\//g, 'href="' + baseURL + '/').replace(/src="\//g, 'src="' + baseURL + '/')
}

function filterUniversalUrl (url) {
  try {
    url = url.match(/http.+/)[0]
  } catch (e) { }

  try {
    url = url.replace(/https?:\/\/(www.)?/, '')
  } catch (e) { }

  if (url.startsWith('imdb.com/') && url.match(/(imdb\.com\/\w+\/\w+\/)/)) {
    // Remove movie subpage from imdb url
    return url.match(/(imdb\.com\/\w+\/\w+\/)/)[1]
  } else if (url.startsWith('boxofficemojo.com/') && url.indexOf('id=') !== -1) {
    // Keep the important id= on
    try {
      const parts = url.split('?')
      const page = parts[0] + '?'
      const idparam = parts[1].match(/(id=.+?)(\.|&)/)[1]
      return page + idparam
    } catch (e) {
      return url
    }
  } else {
    // Default: Remove parameters
    return url.split('?')[0].split('&')[0]
  }
}

const parseLDJSONCache = {}
function parseLDJSON (keys, condition) {
  if (document.querySelector('script[type="application/ld+json"]')) {
    const xmlEntitiesElement = document.createElement('div')
    const xmlEntitiesPattern = /&(?:#x[a-f0-9]+|#[0-9]+|[a-z0-9]+);?/ig
    const xmlEntities = function (s) {
      s = s.replace(xmlEntitiesPattern, (m) => {
        xmlEntitiesElement.innerHTML = m
        return xmlEntitiesElement.textContent
      })
      return s
    }
    const decodeXmlEntities = function (jsonObj) {
      // Traverse through object, decoding all strings
      if (jsonObj !== null && typeof jsonObj === 'object') {
        Object.entries(jsonObj).forEach(([key, value]) => {
          // key is either an array index or object key
          jsonObj[key] = decodeXmlEntities(value)
        })
      } else if (typeof jsonObj === 'string') {
        return xmlEntities(jsonObj)
      }
      return jsonObj
    }

    const data = []
    const scripts = document.querySelectorAll('script[type="application/ld+json"]')
    for (let i = 0; i < scripts.length; i++) {
      let jsonld
      if (scripts[i].innerText in parseLDJSONCache) {
        jsonld = parseLDJSONCache[scripts[i].innerText]
      } else {
        let text
        try {
          text = scripts[i].innerText
          text = text.replace(/^\/\*.*\*\//gm, '') // Replace comment lines
          jsonld = JSON.parse(text)
          parseLDJSONCache[scripts[i].innerText] = jsonld
        } catch (e) {
          parseLDJSONCache[scripts[i].innerText] = null
          console.warn(e, text)
          continue
        }
      }
      if (jsonld) {
        if (Array.isArray(jsonld)) {
          data.push(...jsonld)
        } else {
          data.push(jsonld)
        }
      }
    }
    for (let i = 0; i < data.length; i++) {
      try {
        if (data[i] && data[i] && (typeof condition !== 'function' || condition(data[i]))) {
          if (Array.isArray(keys)) {
            const r = []
            for (let j = 0; j < keys.length; j++) {
              r.push(data[i][keys[j]])
            }
            return decodeXmlEntities(r)
          } else if (keys) {
            return decodeXmlEntities(data[i][keys])
          } else if (typeof condition === 'function') {
            return decodeXmlEntities(data[i]) // Return whole object
          }
        }
      } catch (e) {
        continue
      }
    }
    return decodeXmlEntities(data)
  }
  return null
}

async function addToWhiteList (letterboxdUrl) {
  const whitelist = JSON.parse(await GM.getValue('whitelist', '{}'))
  const docUrl = filterUniversalUrl(document.location.href)
  whitelist[docUrl] = letterboxdUrl
  await GM.setValue('whitelist', JSON.stringify(whitelist))
}

async function removeFromWhiteList () {
  const whitelist = JSON.parse(await GM.getValue('whitelist', '{}'))
  const docUrl = filterUniversalUrl(document.location.href)
  if (docUrl in whitelist) {
    delete whitelist[docUrl]
    await GM.setValue('whitelist', JSON.stringify(whitelist))
  }
}

const current = {
  type: null,
  query: null,
  year: null
}

async function searchMovie (query, type, year, forceList) {
  // Load data from letterboxd search API or from cache

  current.type = type
  current.query = query
  current.year = year

  let whitelist = JSON.parse(await GM.getValue('whitelist', '{}'))

  if (forceList) {
    whitelist = {}
  }

  const docUrl = filterUniversalUrl(document.location.href)
  if (docUrl in whitelist) {
    return loadMovieRating({ url: whitelist[docUrl] })
  }

  const url = baseURLsearch.replace('{query}', encodeURIComponent(query)).replace('{timestamp}', encodeURIComponent(Date.now()))

  const cache = JSON.parse(await GM.getValue('cache', '{}'))

  // Delete cached values, that are expired
  for (const prop in cache) {
    if ((new Date()).getTime() - (new Date(cache[prop].time)).getTime() > cacheExpireAfterHours * 60 * 60 * 1000) {
      delete cache[prop]
    }
  }

  // Check cache or request new content
  if (url in cache) {
    // Use cached response
    handleSearchResponse(cache[url], forceList)
  } else {
    GM.xmlHttpRequest({
      method: 'GET',
      url,
      onload: function (response) {
        // Save to chache

        response.time = (new Date()).toJSON()

        // Chrome fix: Otherwise JSON.stringify(cache) omits responseText
        const newobj = {}
        for (const key in response) {
          newobj[key] = response[key]
        }
        newobj.responseText = response.responseText

        cache[url] = newobj

        GM.setValue('cache', JSON.stringify(cache))

        handleSearchResponse(response, forceList)
      },
      onerror: function (response) {
        console.log('ShowLetterboxd: GM.xmlHttpRequest Error: ' + response.status + '\nURL: ' + url + '\nResponse:\n' + response.responseText)
      }
    })
  }
}

function handleSearchResponse (response, forceList) {
  // Handle GM.xmlHttpRequest response

  const result = JSON.parse(response.responseText)

  if (forceList && (result.result === false || !result.data || !result.data.length)) {
    window.alert('Letterboxd userscript\n\nNo results for ' + current.query)
  } else if (result.result === false || !result.data || !result.data.length) {
    console.log('ShowLetterboxd: No results for ' + current.query)
  } else if (!forceList && result.data.length === 1) {
    loadMovieRating(result.data[0])
  } else {
    // Sort results by closest match
    function matchQuality (title, year, originalTitle) {
      if (title === current.query && year === current.year) {
        return 105 + year
      }
      if (originalTitle && originalTitle === current.query && year === current.year) {
        return 104 + year
      }
      if (title === current.query && current.year) {
        return 103 - Math.abs(year - current.year)
      }
      if (originalTitle && originalTitle === current.query && current.year) {
        return 102 - Math.abs(year - current.year)
      }
      if (title.replace(/\(.+\)/, '').trim() === current.query && current.year) {
        return 101 - Math.abs(year - current.year)
      }
      if (originalTitle && originalTitle.replace(/\(.+\)/, '').trim() === current.query && current.year) {
        return 100 - Math.abs(year - current.year)
      }
      if (title === current.query) {
        return 12
      }
      if (originalTitle && originalTitle === current.query) {
        return 11
      }
      if (title.replace(/\(.+\)/, '').trim() === current.query) {
        return 10
      }
      if (originalTitle && originalTitle.replace(/\(.+\)/, '').trim() === current.query) {
        return 9
      }
      if (title.startsWith(current.query)) {
        return 8
      }
      if (originalTitle && originalTitle.startsWith(current.query)) {
        return 7
      }
      if (current.query.indexOf(title) !== -1) {
        return 6
      }
      if (originalTitle && current.query.indexOf(originalTitle) !== -1) {
        return 5
      }
      if (title.indexOf(current.query) !== -1) {
        return 4
      }
      if (originalTitle && originalTitle.indexOf(current.query) !== -1) {
        return 3
      }
      if (current.query.toLowerCase().indexOf(title.toLowerCase()) !== -1) {
        return 2
      }
      if (title.toLowerCase().indexOf(current.query.toLowerCase()) !== -1) {
        return 1
      }
      return 0
    }

    result.data.sort(function (a, b) {
      if (!Object.prototype.hasOwnProperty.call(a, 'matchQuality')) {
        a.matchQuality = matchQuality(a.name, a.releaseYear, a.originalName)
      }
      if (!Object.prototype.hasOwnProperty.call(b, 'matchQuality')) {
        b.matchQuality = matchQuality(b.name, b.releaseYear, b.originalName)
      }

      return b.matchQuality - a.matchQuality
    })

    if (!forceList && result.data.length > 1 && result.data[0].matchQuality > 100 && result.data[1].matchQuality < result.data[0].matchQuality) {
      loadMovieRating(result.data[0])
    } else {
      showMovieList(result.data, new Date(response.time))
    }
  }
}

function showMovieList (arr, time) {
  // Show a small box in the right lower corner
  $('#mcdiv321letterboxd').remove()
  const div = $('<div id="mcdiv321letterboxd"></div>').appendTo(document.body)
  div.css({
    position: 'fixed',
    bottom: 0,
    right: 0,
    minWidth: 100,
    maxHeight: '80%',
    overflow: 'auto',
    backgroundColor: '#fff',
    border: '2px solid #bbb',
    borderRadius: ' 6px',
    boxShadow: '0 0 3px 3px rgba(100, 100, 100, 0.2)',
    color: '#000',
    padding: ' 3px',
    zIndex: '5010001',
    fontFamily: 'Helvetica,Arial,sans-serif'
  })

  const imgFrame = function imgFrameFct (filmUrl, scale) {
    if (!filmUrl) {
      return
    }

    console.log('ShowLetterboxd: Film url', filmUrl)
    const url = baseURLposter.replace('{film_url}', filmUrl)
    console.log('ShowLetterboxd: Poster url', url)

    const id = 'iframeimg' + Math.random()
    const mWidth = 180.0 * scale - 45.0
    const mHeight = 180.0 * scale - 25
    const html = '<div id="' + id + '" style="vertical-align: middle;padding: 0px;border: none;display: inline-block;width: 43px;height: 50px;background: #666;border: 10px solid #777;"></div> '

    const setImage = function (imageUrl) {
      const img = new Image()
      img.src = imageUrl
      img.style.maxWidth = mWidth + 'px'
      img.style.maxHeight = mHeight + 'px'
      document.getElementById(id).parentNode.replaceChild(img, document.getElementById(id))
    }

    // Check session first
    const cachedImage = window.sessionStorage.getItem('letterboxd_poster_' + filmUrl)
    if (cachedImage) {
      console.log('ShowLetterboxd: Found cached image for', filmUrl)
      return `<img src="${cachedImage}" style="max-width:${mWidth}px; max-height:${mHeight}px;">`
    }
    GM.xmlHttpRequest({
      method: 'GET',
      url,
      onload: function (response) {
        let posterJSON = {}
        try {
          posterJSON = JSON.parse(response.responseText)
          // No image
        } catch (e) {
          console.log('ShowLetterboxd: Error parsing Poster JSON', e)
          console.log('ShowLetterboxd: Poster response text:', response.responseText)
        }
        if ('url' in posterJSON && posterJSON.url) {
          setImage(posterJSON.url)

          // Store filmUrl => image in session storage
          window.sessionStorage.setItem('letterboxd_poster_' + filmUrl, posterJSON.url)
        } else {
          console.log('ShowLetterboxd: No poster URL found in JSON for', filmUrl)
        }
      }
    })
    return html
  }

  // First result

  console.log('ShowLetterboxd: First result', arr[0])
  const first = $('<div style="position:relative"><a style="font-size:small; color:#136CB2; " href="' + baseURL + arr[0].url + '">' + imgFrame(arr[0].url, 0.75) + '<div style="max-width:350px;display:inline-block">' + arr[0].name + (arr[0].originalTitle ? ' [' + arr[0].originalTitle + ']' : '') + (arr[0].releaseYear ? ' (' + arr[0].releaseYear + ')' : '') + '</div></a></div>').click(selectMovie).appendTo(div)
  first[0].dataset.movie = JSON.stringify(arr[0])

  // Shall the following results be collapsed by default?
  let more = null
  if ((arr.length > 1 && arr[0].matchQuality > 10) || arr.length > 10) {
    $('<span style="color:gray;font-size: x-small">More results...</span>').appendTo(div).click(function () { more.css('display', 'block'); this.parentNode.removeChild(this) })
    more = $('<div style="display:none"></div>').appendTo(div)
  } else {
    more = $('<div></div>').appendTo(div)
  }

  // More results
  for (let i = 1; i < arr.length; i++) {
    const entry = $('<div style="position:relative"><a style="font-size:small; color:#136CB2; " href="' + baseURL + arr[i].url + '">' + imgFrame(arr[i].url, 0.5) + '<div style="max-width:350px;display:inline-block">' + arr[i].name + (arr[i].originalTitle ? ' [' + arr[i].originalTitle + ']' : '') + (arr[0].releaseYear ? ' (' + arr[0].releaseYear + ')' : '') + '</div></a></div>').click(selectMovie).appendTo(more)
    entry[0].dataset.movie = JSON.stringify(arr[i])
  }

  // Footer
  const sub = $('<div></div>').appendTo(div)
  $('<time style="color:#789; font-size: 11px;" datetime="' + time + '" title="' + time.toLocaleTimeString() + ' ' + time.toLocaleDateString() + '">' + minutesSince(time) + '</time>').appendTo(sub)
  $('<a style="color:#789; font-size: 11px;" target="_blank" href="' + baseURLopenTab.replace('{query}', encodeURIComponent(current.query)) + '" title="Open Letterboxd">@letterboxd.com</a>').appendTo(sub)
  $('<span title="Hide me" style="cursor:pointer; float:right; color:#789; font-size: 11px; padding-left:5px;padding-top:3px">&#10062;</span>').appendTo(sub).click(function () {
    document.body.removeChild(this.parentNode.parentNode)
  })
}

function selectMovie (ev) {
  ev.preventDefault()
  $('#mcdiv321letterboxd').html('Loading...')

  const data = JSON.parse(this.dataset.movie)

  loadMovieRating(data)

  addToWhiteList(data.url)
}

async function loadMovieRating (data) {
  // Load page from letterboxd

  if ('name' in data) {
    current.query = data.name
  }
  if ('releaseYear' in data) {
    current.year = data.releaseYear
  }

  const url = baseURLratingHistogram.replace('{url}', data.url)

  const cache = JSON.parse(await GM.getValue('cache', '{}'))

  // Delete cached values, that are expired
  for (const prop in cache) {
    if ((new Date()).getTime() - (new Date(cache[prop].time)).getTime() > cacheExpireAfterHours * 60 * 60 * 1000) {
      delete cache[prop]
    }
  }

  // Check cache or request new content
  if (url in cache) {
    // Use cached response
    showMovieRating(cache[url], data.url, data)
  } else {
    GM.xmlHttpRequest({
      method: 'GET',
      url,
      onload: function (response) {
        // Save to chache
        response.time = (new Date()).toJSON()

        // Chrome fix: Otherwise JSON.stringify(cache) omits responseText
        const newobj = {}
        for (const key in response) {
          newobj[key] = response[key]
        }
        newobj.responseText = response.responseText

        cache[url] = newobj

        GM.setValue('cache', JSON.stringify(cache))

        showMovieRating(newobj, data.url, data)
      },
      onerror: function (response) {
        console.log('ShowLetterboxd: GM.xmlHttpRequest Error: ' + response.status + '\nURL: ' + url + '\nResponse:\n' + response.responseText)
      }
    })
  }
}

function showMovieRating (response, letterboxdUrl, otherData) {
  // Show a small box in the right lower corner
  const time = new Date(response.time)

  $('#mcdiv321letterboxd').remove()

  const div = $('<div id="mcdiv321letterboxd"></div>').appendTo(document.body)
  div.css({
    position: 'fixed',
    bottom: 0,
    right: 0,
    width: 230,
    minHeight: 44,
    color: '#789',
    padding: ' 3px',
    zIndex: '5010001',
    fontFamily: 'Helvetica,Arial,sans-serif'
  })

  const CSS = `<style>



/*
Reset
*/
#mcdiv321letterboxd div, #mcdiv321letterboxd span, #mcdiv321letterboxd applet, #mcdiv321letterboxd object, #mcdiv321letterboxd iframe, #mcdiv321letterboxd h1, #mcdiv321letterboxd h2, #mcdiv321letterboxd h3, #mcdiv321letterboxd h4, #mcdiv321letterboxd h5, #mcdiv321letterboxd h6, #mcdiv321letterboxd p, #mcdiv321letterboxd blockquote, #mcdiv321letterboxd pre, #mcdiv321letterboxd a, #mcdiv321letterboxd abbr, #mcdiv321letterboxd acronym, #mcdiv321letterboxd address, #mcdiv321letterboxd big, #mcdiv321letterboxd cite, #mcdiv321letterboxd code, #mcdiv321letterboxd del, #mcdiv321letterboxd dfn, #mcdiv321letterboxd em, #mcdiv321letterboxd font, #mcdiv321letterboxd img, #mcdiv321letterboxd ins, #mcdiv321letterboxd kbd, #mcdiv321letterboxd q, #mcdiv321letterboxd s, #mcdiv321letterboxd samp, #mcdiv321letterboxd small, #mcdiv321letterboxd strike, #mcdiv321letterboxd strong, #mcdiv321letterboxd sub, #mcdiv321letterboxd sup, #mcdiv321letterboxd tt, #mcdiv321letterboxd var, #mcdiv321letterboxd dl, #mcdiv321letterboxd dt, #mcdiv321letterboxd dd, #mcdiv321letterboxd ol, #mcdiv321letterboxd ul, #mcdiv321letterboxd li, #mcdiv321letterboxd fieldset, #mcdiv321letterboxd form, #mcdiv321letterboxd label, #mcdiv321letterboxd legend, #mcdiv321letterboxd table, #mcdiv321letterboxd caption, #mcdiv321letterboxd tbody, #mcdiv321letterboxd tfoot, #mcdiv321letterboxd thead, #mcdiv321letterboxd tr, #mcdiv321letterboxd th, #mcdiv321letterboxd td, #mcdiv321letterboxd article, #mcdiv321letterboxd aside, #mcdiv321letterboxd canvas, #mcdiv321letterboxd details, #mcdiv321letterboxd figcaption, #mcdiv321letterboxd figure, #mcdiv321letterboxd footer, #mcdiv321letterboxd header, #mcdiv321letterboxd hgroup, #mcdiv321letterboxd menu, #mcdiv321letterboxd nav, #mcdiv321letterboxd section, #mcdiv321letterboxd summary, #mcdiv321letterboxd time, #mcdiv321letterboxd mark, #mcdiv321letterboxd audio, #mcdiv321letterboxd video {
 margin: 0;
 padding: 0;
 border: 0;
 outline: 0;
 font-weight: inherit;
 font-style: inherit;
 font-size: 100%;
 font-family: inherit;
 vertical-align: baseline;
}


#mcdiv321letterboxd .mcdiv321footer {
    display:none;
}

#mcdiv321letterboxd:hover .mcdiv321footer {
    display:block;
    background-color:transparent !important;
}

#mcdiv321letterboxd {
    border:none;
    border-radius: 0px;
    background-color:transparent;
    transition:bottom 0.7s, background-color 0.5s, height 0.5s;
}

#mcdiv321letterboxd:hover {
    border-radius: 4px;
    background-color:rgb(44, 52, 64)
}


#mcdiv321letterboxd{--border-width-thin:max(1px, .0625rem);--border-radius-xsmall:0.125rem;--border-radius-small:.25rem --theme-heading-content-color:#fff;--theme-fill-color:#456;--theme-fill-color-rgb:68,85,102;--theme-fill-hover-color:#789;--theme-fill-hover-color-rgb:119,136,153;--theme-fill-active-color:#345;--theme-fill-active-color-rgb:51,68,85;--theme-surface-color:#283038;--theme-surface-color-rgb:40,48,56;--theme-background-color:#14181C;--theme-background-color-rgb:20,24,28;--theme-control-highlight-color-alpha:0.1;--theme-control-highlight-color:rgba(var(--theme-control-highlight-color-rgb), var(--theme-control-highlight-color-alpha));--theme-control-highlight-color-rgb:255,255,255;--theme-control-shadow-color:rgba(var(--theme-control-shadow-color-rgb), .25);--theme-control-shadow-color-rgb:0,0,0;--theme-like-icon-color:#FF9933;--theme-like-icon-color-rgb:255,153,51;--theme-rating-icon-color:#00C030;--theme-rating-icon-color-rgb:0,192,48}.rating-histogram{--_base-width-unitless:14.375;--aspect-ratio:calc(160 / 44);--_star-height-fixed-unitless:0.5625;--star-height-fixed:calc(1rem * var(--_star-height-fixed-unitless));--star-height-fluid:calc(100cqw * (var(--_star-height-fixed-unitless) / var(--_base-width-unitless)));--star-height:max(.4375rem, var(--star-height-fluid));--_average-rating-font-size-fixed-unitless:1.25;--average-rating-font-size-fixed:calc(1rem * var(--_average-rating-font-size-fixed-unitless));--average-rating-font-size-fluid:calc(100cqw * (var(--_average-rating-font-size-fixed-unitless) / var(--_base-width-unitless)));--average-rating-font-size:max(var(--average-rating-font-size-fixed), var(--average-rating-font-size-fluid));--bar-border-radius:var(--border-radius-xsmall);container-type:inline-size}.rating-histogram .stars{fill:var(--theme-rating-icon-color);width:auto;height:var(--star-height)}.rating-histogram .chart{display:flex;container-type:inline-size;container-name:chart;min-height:2.75rem}.rating-histogram .chart *{display:flex;flex:1}.rating-histogram .chart .barcolumn{color:var(--theme-fill-color)}.rating-histogram .chart .barcolumn:-moz-any-link{-moz-transition-property:color;transition-property:color;transition-duration:var(--transition-duration, var(--timing-duration-out));transition-timing-function:var(--easing-default)}.rating-histogram .chart .barcolumn:any-link{transition-property:color;transition-duration:var(--transition-duration, var(--timing-duration-out));transition-timing-function:var(--easing-default)}@media(hover:hover)and (pointer:fine){.rating-histogram .chart .barcolumn:-moz-any-link:hover{--transition-duration:var(--timing-duration-in);color:var(--theme-fill-hover-color)}.rating-histogram .chart .barcolumn:any-link:hover{--transition-duration:var(--timing-duration-in);color:var(--theme-fill-hover-color)}}.rating-histogram .chart .barcolumn:-moz-any-link:focus{--transition-duration:var(--timing-duration-in);color:var(--theme-fill-hover-color)}.rating-histogram .chart .barcolumn:any-link:focus{--transition-duration:var(--timing-duration-in);color:var(--theme-fill-hover-color)}.rating-histogram .chart .barcolumn:-moz-any-link:focus-visible{z-index:1;outline:var(--focus-outline)}.rating-histogram .chart .barcolumn:any-link:focus-visible{z-index:1;outline:var(--focus-outline)}.rating-histogram .chart .barcolumn:-moz-any-link:active{--transition-duration:0;color:var(--theme-fill-active-color)}.rating-histogram .chart .barcolumn:any-link:active{--transition-duration:0;color:var(--theme-fill-active-color)}.rating-histogram .chart .barcolumn > .bar{align-self:end;height:max(var(--value, 0) * 100%,max(1px,.0625rem));container-type:size}.rating-histogram .chart .barcolumn > .bar > .fill{background-color:currentColor}@container (height > max(1px,.0625rem)){.rating-histogram .chart .barcolumn > .bar > .fill{--border-radius:min(100cqh - max(1px, .0625rem), var(--bar-border-radius));border-top-right-radius:var(--border-radius);border-top-left-radius:var(--border-radius)}}.rating-histogram .chart > .plot{gap:var(--border-width-thin)}@container chart (width >= 10rem){.rating-histogram .chart > .plot{aspect-ratio:var(--aspect-ratio)}}.rating-histogram .averagerating{font-family:var(--font-stack-graphik);font-size:var(--average-rating-font-size);font-weight:300;text-box-trim:trim-both;text-box-edge:cap alphabetic}.rating-histogram .averagerating:-moz-any-link{-moz-transition-property:color;transition-property:color;transition-duration:var(--transition-duration, var(--timing-duration-out));transition-timing-function:var(--easing-default);color:var(--theme-metadata-high-contrast-content-color)}.rating-histogram .averagerating:any-link{transition-property:color;transition-duration:var(--transition-duration, var(--timing-duration-out));transition-timing-function:var(--easing-default);color:var(--theme-metadata-high-contrast-content-color)}@media(hover:hover)and (pointer:fine){.rating-histogram .averagerating:-moz-any-link:hover{--transition-duration:var(--timing-duration-in);color:var(--theme-body-link-hover-content-color)}.rating-histogram .averagerating:any-link:hover{--transition-duration:var(--timing-duration-in);color:var(--theme-body-link-hover-content-color)}}.rating-histogram .averagerating:-moz-any-link:focus{--transition-duration:var(--timing-duration-in);color:var(--theme-body-link-hover-content-color)}.rating-histogram .averagerating:any-link:focus{--transition-duration:var(--timing-duration-in);color:var(--theme-body-link-hover-content-color)}.rating-histogram .averagerating:-moz-any-link:focus-visible{outline:var(--focus-outline)}.rating-histogram .averagerating:any-link:focus-visible{outline:var(--focus-outline)}.rating-histogram .averagerating:-moz-any-link:active{--transition-duration:0;color:var(--theme-body-link-active-content-color)}.rating-histogram .averagerating:any-link:active{--transition-duration:0;color:var(--theme-body-link-active-content-color)}.rating-histogram > .layout{display:grid;align-items:end;grid-template-areas:"stars-start chart average" "stars-start chart stars-end";grid-template-columns:[rating-start] auto 1fr auto;grid-template-rows:[rating-start] 1fr [average-end] auto [rating-end]}.rating-histogram > .layout > .stars.-start{grid-area:stars-start}.rating-histogram > .layout > .stars.-end{grid-area:stars-end}.rating-histogram > .layout > .chart{grid-area:chart}.rating-histogram > .layout > .averagerating{grid-area:average;align-self:start;justify-self:center}.rating-histogram > .layout:has( > .averagerating),.rating-histogram > .layout:has( > .stars){-moz-column-gap:max(var(--spacing-dense-large),calc(100cqw * (var(--_column-gap-unitless) / var(--_base-width-unitless))));column-gap:max(var(--spacing-dense-large),calc(100cqw * (var(--_column-gap-unitless) / var(--_base-width-unitless))))}.rating-histogram > .layout:has( > .averagerating){--_column-gap-unitless:var(--spacing-dense-large-unitless)}.rating-histogram > .layout:has( > .stars){--_column-gap-unitless:var(--spacing-dense-medium-unitless)}.rating-histogram > .layout:not(:has( > .stars)) > .chart{grid-column-start:rating-start}.rating-histogram > .layout:not(:has( > .stars)) > .averagerating{align-self:end;grid-row-end:rating-end}.rating-histogram.-compact{--aspect-ratio:calc(120 / 22)}.rating-histogram.-compact .chart{min-height:1.375rem}@container chart (width >= 7.5rem){.rating-histogram.-compact .chart > .plot{aspect-ratio:var(--aspect-ratio)}}._sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}


</style>`

  $(CSS).appendTo(div)
  const section = $(fixLetterboxdURLs(response.responseText)).appendTo(div)

  section.find('h2').remove()

  let identName = current.query
  let identYear = current.year ? ' (' + current.year + ')' : ''
  let identOriginalName = ''
  let identDirector = ''
  if (otherData) {
    if ('name' in otherData && otherData.name) {
      identName = otherData.name
    }
    if ('year' in otherData && otherData.year) {
      identYear = ' (' + otherData.year + ')'
    }
    if ('originalName' in otherData && otherData.originalName) {
      identOriginalName = ' "' + otherData.originalName + '"'
    }
    if ('directors' in otherData) {
      identDirector = []
      for (let i = 0; i < otherData.directors.length; i++) {
        if ('name' in otherData.directors[i]) {
          identDirector.push(otherData.directors[i].name)
        }
      }
      if (identDirector) {
        identDirector = '<br><span style="font-size:10px">Dir. ' + identDirector.join(', ') + '</span>'
      } else {
        identDirector = ''
      }
    }
  }

  // Footer
  const sub = $('<div class="mcdiv321footer"></div>').appendTo(div)
  $('<span style="color:#789; font-size: 11px">' + identName + identOriginalName + identYear + identDirector + '</span>').appendTo(sub)
  $('<br>').appendTo(sub)
  $('<time style="color:#789; font-size: 11px;" datetime="' + time + '" title="' + time.toLocaleTimeString() + ' ' + time.toLocaleDateString() + '">' + minutesSince(time) + '</time>').appendTo(sub)
  $('<a style="color:#789; font-size: 11px;" target="_blank" href="' + baseURL + letterboxdUrl + '" title="Open Letterboxd">@letterboxd.com</a>').appendTo(sub)
  $('<span title="Hide me" style="cursor:pointer; float:right; color:#789; font-size: 11px">&#10062;</span>').appendTo(sub).click(function () {
    document.getElementById('mcdiv321letterboxd').remove()
  })
  $('<span title="Wrong movie!" style="cursor:pointer; float:right; color:#789; font-size: 11px">&#128581;</span>').appendTo(sub).click(function () {
    removeFromWhiteList()
    searchMovie(current.query, current.type, current.year, true)
  })
  $('<span style="clear:right">').appendTo(sub)
}

const Always = () => true
const sites = {
  googleplay: {
    host: ['play.google.com'],
    condition: Always,
    products: [
      {
        condition: () => ~document.location.href.indexOf('/movies/details/'),
        type: 'movie',
        data: () => document.querySelector('*[itemprop=name]').textContent
      }
    ]
  },
  imdb: {
    host: ['imdb.com'],
    condition: () => !~document.location.pathname.indexOf('/mediaviewer') && !~document.location.pathname.indexOf('/mediaindex') && !~document.location.pathname.indexOf('/videoplayer'),
    products: [
      {
        condition: function () {
          const e = document.querySelector("meta[property='og:type']")
          if (e && e.content === 'video.movie') {
            return true
          } else if (document.querySelector('[data-testid="hero__pageTitle"]') && !document.querySelector('[data-testid="hero-subnav-bar-left-block"] a[href*="episodes/"]')) {
            return true
          }
          return false
        },
        type: 'movie',
        data: function () {
          let year = null
          if (document.querySelector('script[type="application/ld+json"]')) {
            const ld = parseLDJSON(['name', 'alternateName', 'datePublished'])
            if (ld.length > 2) {
              year = parseInt(ld[2].match(/\d{4}/)[0])
            }
            if (ld.length > 1 && ld[1]) {
              console.debug('ShowLetterboxd: Movie ld+json alternateName', ld[1], year)
              return [ld[1], year]
            }
            console.debug('ShowLetterboxd: Movie ld+json name', ld[0], year)
            return [ld[0], year]
          } else {
            const m = document.title.match(/(.+?)\s+(\((\d+)\))? - /)
            console.debug('ShowLetterboxd: Movie <title>', [m[1], m[3]])
            return [m[1], parseInt(m[3])]
          }
        }
      }
    ]
  },
  metacritic: {
    host: ['www.metacritic.com'],
    condition: () => document.querySelector("meta[property='og:type']"),
    products: [{
      condition: () => document.querySelector("meta[property='og:type']").content === 'video.movie',
      type: 'movie',
      data: function () {
        let year = null
        if (document.querySelector('.release_year')) {
          year = parseInt(document.querySelector('.release_year').firstChild.textContent)
        } else if (document.querySelector('.release_data .data')) {
          year = document.querySelector('.release_data .data').textContent.match(/(\d{4})/)[1]
        }

        return [document.querySelector("meta[property='og:title']").content, year]
      }
    }]
  },
  amazon: {
    host: ['amazon.'],
    condition: Always,
    products: [{
      condition: () => document.querySelector('[data-automation-id=title]'),
      type: 'movie',
      data: () => document.querySelector('[data-automation-id=title]').textContent.trim().replace(/\[.{1,8}\]/, '')
    },
    {
      condition: () => document.querySelector('#watchNowContainer a[href*="/gp/video/"]'),
      type: 'movie',
      data: () => document.getElementById('productTitle').textContent.trim()
    }]
  },
  BoxOfficeMojo: {
    host: ['boxofficemojo.com'],
    condition: () => Always,
    products: [
      {
        condition: () => document.location.pathname.startsWith('/release/'),
        type: 'movie',
        data: function () {
          let year = null
          const cells = document.querySelectorAll('#body .mojo-summary-values .a-section span')
          for (let i = 0; i < cells.length; i++) {
            if (~cells[i].innerText.indexOf('Release Date')) {
              year = parseInt(cells[i].nextElementSibling.textContent.match(/\d{4}/)[0])
              break
            }
          }
          return [document.querySelector('meta[name=title]').content, year]
        }
      },
      {
        condition: () => ~document.location.search.indexOf('id=') && document.querySelector('#body table:nth-child(2) tr:first-child b'),
        type: 'movie',
        data: function () {
          let year = null
          try {
            const tds = document.querySelectorAll('#body table:nth-child(2) tr:first-child table table table td')
            for (let i = 0; i < tds.length; i++) {
              if (~tds[i].innerText.indexOf('Release Date')) {
                year = parseInt(tds[i].innerText.match(/\d{4}/)[0])
                break
              }
            }
          } catch (e) { }
          return [document.querySelector('#body table:nth-child(2) tr:first-child b').firstChild.textContent, year]
        }
      }]
  },
  AllMovie: {
    host: ['allmovie.com'],
    condition: () => document.querySelector('h2.movie-title'),
    products: [{
      condition: () => document.querySelector('h2.movie-title'),
      type: 'movie',
      data: () => document.querySelector('h2.movie-title').firstChild.textContent.trim()
    }]
  },
  'en.wikipedia': {
    host: ['en.wikipedia.org'],
    condition: Always,
    products: [{
      condition: function () {
        if (!document.querySelector('.infobox .summary')) {
          return false
        }
        const r = /\d\d\d\d films/
        return $('#catlinks a').filter((i, e) => e.firstChild.textContent.match(r)).length
      },
      type: 'movie',
      data: () => document.querySelector('.infobox .summary').firstChild.textContent
    }]
  },
  fandango: {
    host: ['fandango.com'],
    condition: () => document.querySelector("meta[property='og:title']"),
    products: [{
      condition: Always,
      type: 'movie',
      data: () => document.querySelector("meta[property='og:title']").content.match(/(.+?)\s+\(\d{4}\)/)[1].trim()
    }]
  },
  themoviedb: {
    host: ['themoviedb.org'],
    condition: () => document.querySelector("meta[property='og:type']"),
    products: [{
      condition: () => document.querySelector("meta[property='og:type']").content === 'movie' ||
        document.querySelector("meta[property='og:type']").content === 'video.movie',
      type: 'movie',
      data: function () {
        let year = null
        try {
          year = parseInt(document.querySelector('.release_date').innerText.match(/\d{4}/)[0])
        } catch (e) {}

        return [document.querySelector("meta[property='og:title']").content, year]
      }
    }]
  },
  rottentomatoes: {
    host: ['rottentomatoes.com'],
    condition: Always,
    products: [{
      condition: () => document.location.pathname.startsWith('/m/'),
      type: 'movie',
      data: () => parseLDJSON('name', (j) => (j['@type'] === 'Movie'))
    }]
  },
  nme: {
    host: ['nme.com'],
    condition: () => document.location.pathname.startsWith('/reviews/'),
    products: [{
      condition: () => document.querySelector('.tdb-breadcrumbs a[href*="/reviews/film-reviews"]'),
      type: 'movie',
      data: function () {
        let year = null
        try {
          year = parseInt(document.querySelector('*[itemprop=datePublished]').content.match(/\d{4}/)[0])
        } catch (e) {}

        try {
          return [document.title.match(/[‘'](.+?)[’']/)[1], year]
        } catch (e) {
          try {
            return [document.querySelector('h1.tdb-title-text').textContent.match(/[‘'](.+?)[’']/)[1], year]
          } catch (e) {
            return [document.querySelector('h1').textContent.match(/:\s*(.+)/)[1].trim(), year]
          }
        }
      }
    }]
  },
  TheTVDB: {
    host: ['thetvdb.com'],
    condition: Always,
    products: [{
      condition: () => document.location.pathname.startsWith('/movies/'),
      type: 'movie',
      data: () => document.getElementById('series_title').firstChild.textContent.trim()
    }]
  },
  itunes: {
    host: ['itunes.apple.com'],
    condition: Always,
    products: [{
      condition: () => ~document.location.href.indexOf('/movie/'),
      type: 'movie',
      data: () => parseLDJSON('name', (j) => (j['@type'] === 'Movie'))
    }]
  },
  RlsBB: {
    host: ['rlsbb.ru'],
    condition: () => document.querySelectorAll('.post').length === 1,
    products: [
      {
        condition: () => document.querySelector('#post-wrapper .entry-meta a[href*="/category/movies/"]'),
        type: 'movie',
        data: () => document.querySelector('h1.entry-title').textContent.match(/(.+?)\s+\d{4}/)[1].trim()
      }]
  },
  showtime: {
    host: ['sho.com'],
    condition: Always,
    products: [
      {
        condition: () => parseLDJSON('@type') === 'Movie',
        type: 'movie',
        data: () => parseLDJSON('name', (j) => (j['@type'] === 'Movie'))
      }]
  },
  gog: {
    host: ['www.gog.com'],
    condition: () => document.querySelector('.productcard-basics__title'),
    products: [{
      condition: () => document.location.pathname.split('/').length > 2 && (
        document.location.pathname.split('/')[1] === 'movie' ||
        document.location.pathname.split('/')[2] === 'movie'),
      type: 'movie',
      data: () => document.querySelector('.productcard-basics__title').textContent
    }]
  },
  psapm: {
    host: ['psa.wf'],
    condition: Always,
    products: [
      {
        condition: () => document.location.pathname.startsWith('/movie/'),
        type: 'movie',
        data: function () {
          const title = document.querySelector('h1').textContent.trim()
          const m = title.match(/(.+)\((\d+)\)$/)
          if (m) {
            return [m[1].trim(), parseInt(m[2])]
          } else {
            return title
          }
        }
      }]
  },
  'save.tv': {
    host: ['save.tv'],
    condition: () => document.location.pathname.startsWith('/STV/M/obj/archive/'),
    products: [
      {
        condition: () => document.location.pathname.startsWith('/STV/M/obj/archive/'),
        type: 'movie',
        data: function () {
          let title = null
          if (document.querySelector("span[data-bind='text:OrigTitle']")) {
            title = document.querySelector("span[data-bind='text:OrigTitle']").textContent
          } else {
            title = document.querySelector("h2[data-bind='text:Title']").textContent
          }
          let year = null
          if (document.querySelector("span[data-bind='text:ProductionYear']")) {
            year = parseInt(document.querySelector("span[data-bind='text:ProductionYear']").textContent)
          }
          return [title, year]
        }
      }
    ]
  },
  wikiwand: {
    host: ['www.wikiwand.com'],
    condition: Always,
    products: [{
      condition: function () {
        const title = document.querySelector('h1').textContent.toLowerCase()
        const subtitle = document.querySelector('h2[class*="subtitle"]') ? document.querySelector('h2[class*="subtitle"]').textContent.toLowerCase() : ''
        if (title.indexOf('film') === -1 && !subtitle) {
          return false
        }
        return title.indexOf('film') !== -1 ||
          subtitle.indexOf('film') !== -1 ||
          subtitle.indexOf('movie') !== -1
      },
      type: 'movie',
      data: () => document.querySelector('h1').textContent.replace(/\((\d{4} )?film\)/i, '').trim()
    }]
  },
  trakt: {
    host: ['trakt.tv'],
    condition: Always,
    products: [
      {
        condition: () => document.location.pathname.startsWith('/movies/'),
        type: 'movie',
        data: function () {
          const title = Array.from(document.querySelector('.summary h1').childNodes).filter(node => node.nodeType === node.TEXT_NODE).map(node => node.textContent).join(' ').trim()
          const year = document.querySelector('.summary h1 .year').textContent
          return [title, year]
        }
      }
    ]
  },
  radarr: {
    host: ['*'],
    condition: () => document.location.pathname.startsWith('/movie/'),
    products: [{
      condition: () => document.querySelector('[class*="MovieDetails-title"] span'),
      type: 'movie',
      data: () => {
        let year = null
        if (document.querySelector('[class*="MovieDetails-yea"] span')) {
          year = document.querySelector('[class*="MovieDetails-yea"] span').textContent.trim()
        }
        return [document.querySelector('[class*="MovieDetails-title"] span').textContent.trim(), year]
      }
    }]
  }

}

function main () {
  let dataFound = false
  for (const name in sites) {
    const site = sites[name]
    if (site.host.some(function (e) { return ~this.indexOf(e) || e === '*' }, document.location.hostname) && site.condition()) {
      for (let i = 0; i < site.products.length; i++) {
        if (site.products[i].condition()) {
          // Try to retrieve item name from page
          let data
          try {
            data = site.products[i].data()
          } catch (e) {
            data = false
            console.error(`ShowLetterboxd: Error in data() of site='${name}', type='${site.products[i].type}'`)
            console.error(e)
          }
          if (data) {
            if (Array.isArray(data)) {
              if (data[1]) {
                searchMovie(data[0].trim(), site.products[i].type, parseInt(data[1]))
              } else {
                searchMovie(data.trim(), site.products[i].type)
              }
            } else {
              searchMovie(data.trim(), site.products[i].type)
            }
            dataFound = true
          }
          break
        }
      }
      break
    }
  }
  return dataFound
}

async function adaptForRottentomatoesScript () {
  // Move this container above the rottentomatoes container and if the meta container is on the right side above both
  const letterC = document.getElementById('mcdiv321letterboxd')
  const metaC = document.getElementById('mcdiv123')
  const rottenC = document.getElementById('mcdiv321rotten')

  if (!letterC || (!metaC && !rottenC)) {
    return
  }
  const letterBounds = letterC.getBoundingClientRect()

  let bottom = 0
  if (metaC) {
    const metaBounds = metaC.getBoundingClientRect()
    if (Math.abs(metaBounds.right - letterBounds.right) < 20 && metaBounds.top > 20) {
      bottom += metaBounds.height
    }
  }
  if (rottenC) {
    const rottenBounds = rottenC.getBoundingClientRect()
    if (Math.abs(rottenBounds.right - letterBounds.right) < 20 && rottenBounds.top > 20) {
      bottom += rottenBounds.height
    }
  }

  if (bottom > 0) {
    letterC.style.bottom = bottom + 'px'
  }
}

(function () {
  const firstRunResult = main()
  let lastLoc = document.location.href
  let lastContent = document.body.innerText
  let lastCounter = 0
  function newpage () {
    if (lastContent === document.body.innerText && lastCounter < 15) {
      window.setTimeout(newpage, 500)
      lastCounter++
    } else {
      lastContent = document.body.innerText
      lastCounter = 0
      const re = main()
      if (!re) { // No page matched or no data found
        window.setTimeout(newpage, 1000)
      }
    }
  }
  window.setInterval(function () {
    adaptForRottentomatoesScript()
    if (document.location.href !== lastLoc) {
      lastLoc = document.location.href
      $('#mcdiv321letterboxd').remove()

      window.setTimeout(newpage, 1000)
    }
  }, 500)

  if (!firstRunResult) {
    // Initial run had no match, let's try again there may be new content
    window.setTimeout(main, 2000)
  }
})()
