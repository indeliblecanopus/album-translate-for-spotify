/**
 * API specific variables
 * 
 --------------------------------------------------------------- */
const API_SPOTIFY_ERROR_PREMIUM = 'PREMIUM_REQUIRED';
const API_SPOTIFY_ERROR_RATE_LIMIT = 'RATE_LIMIT';

const API_SPOTIFY_ALBUMS = 'albums';
const API_SPOTIFY_ARTISTS = 'artists';
const API_SPOTIFY_TRACKS = 'tracks';
const API_SPOTIFY_EPISODES = 'episodes';
const API_SPOTIFY_SEARCH = 'search';

const API_SPOTIFY_PLAYBACK_STATE = 'me/player';
const API_SPOTIFY_PLAYBACK_QUEUE = 'me/player/queue';
const API_SPOTIFY_SKIP_NEXT = 'me/player/next';

/** ------------------------------------------------------------ */


function spotifyGetPlaybackState() {
  let url = API_SPOTIFY_BASE_URL + API_SPOTIFY_PLAYBACK_STATE;

  return sendSpotifyRequest('GET', url);
}


function spotifySkipToNext() {
  let url = API_SPOTIFY_BASE_URL + API_SPOTIFY_SKIP_NEXT;

  return sendSpotifyRequest('POST', url);
}


function spotifyAddTrackToPlaybackQueue(track_id) {
  let url = API_SPOTIFY_BASE_URL + API_SPOTIFY_PLAYBACK_QUEUE;

  const params = {
    'uri': track_id
  }

  return sendSpotifyRequest('POST', url, params);
}


function spotifyGetArtist(artist_id) {
  let url = API_SPOTIFY_BASE_URL + API_SPOTIFY_ARTISTS + '/' + artist_id;

  return sendSpotifyRequest('GET', url);
}


function spotifyGetArtistTracks(artist_id) {

  let album_ids = [];
  let prev_offset = 0;
  let albums;
  do {
    albums = spotifyGetArtistsAlbums(artist_id, prev_offset);

    for (const item of albums.items) {
      album_ids.push(item.id);
    }

    prev_offset += albums.items.length;

  } while (album_ids.length < albums.total);


  let tracks = [];
  const MAX_ALBUM_IDS = 20;
  const MAX_TRACK_LIMIT = 50;
  while (album_ids.length > 0) {

    let albums_several = spotifyGetAlbums(album_ids.splice(0, MAX_ALBUM_IDS)).albums;

    for (const item of albums_several) {
      let album = {
        album_image: item.images[0].url,
        album_name: item.name,
        album_url: item.external_urls.spotify,
        tracks: [],
      };

      for (const track of item.tracks.items) {
        album.tracks.push({
          'name': track.name,
          'id': track.uri
        })
      }

      if (item.total_tracks > MAX_TRACK_LIMIT) {
        let tracks_remainder = spotifyGetAlbumTracks(item.id, item.total_tracks, MAX_TRACK_LIMIT);

        album.tracks = album.tracks.concat(tracks_remainder);
      }

      tracks.push(album);
    }
  }

  return tracks;
}


function spotifyGetArtistsAlbums(artist_id, offset) {
  let url = API_SPOTIFY_BASE_URL + API_SPOTIFY_ARTISTS +
    '/' + artist_id + '/' + API_SPOTIFY_ALBUMS +
    '?limit=50';

  if (offset) {
    url += '&offset=' + offset;
  }

  return sendSpotifyRequest('GET', url);
}


function spotifyGetAlbums(album_ids) {
  let url = API_SPOTIFY_BASE_URL +
    API_SPOTIFY_ALBUMS +
    '?ids=' + album_ids;

  return sendSpotifyRequest('GET', url);
}


function spotifyGetAlbumPhoto(album_id) {
  let url = API_SPOTIFY_BASE_URL +
    API_SPOTIFY_ALBUMS +
    '/' + album_id;

  return sendSpotifyRequest('GET', url);
}


function spotifyGetAlbum(album_id, offset) {
  let url = API_SPOTIFY_BASE_URL +
    API_SPOTIFY_ALBUMS +
    '/' + album_id;

  return sendSpotifyRequest('GET', url);
}


function spotifyGetAlbumData(album_id) {
  let album_data = {
    'name': null,
    'url': null,
    'artists': {},
    'photo': null,
    'total_tracks': null,
    'tracks': [],
  };

  let album_info = spotifyGetAlbum(album_id);

  album_data.name = album_info.name;
  album_data.url = album_info.external_urls.spotify;
  album_data.photo = album_info.images[0].url;
  album_data.total_tracks = album_info.total_tracks;
  album_data.artists.as_string = album_info.artists.reduce(
    (accumulator, currentValue) => accumulator + currentValue.name + ', ', '').slice(0, -2);

  album_data.tracks = spotifyGetAlbumTracks(album_id, album_info.total_tracks);

  return album_data;
}


/**
 * Returns all tracks from the given Spotify album 
 *
 * @param {string} album_id The ID of a Spotify album
 * @return {array} tracks Tracks in the given Spotify album
 */
function spotifyGetAlbumTracks(album_id, total_tracks, offset) {
  const url = API_SPOTIFY_BASE_URL + API_SPOTIFY_ALBUMS +
    '/' + album_id + '/' + API_SPOTIFY_TRACKS +
    '?limit=50';

  let prev_offset;
  let url_req;
  if (offset) {
    if (!Number.isInteger(offset)) {
      throw new TypeError('param offset must be integer');
    }

    url_req = url + '&offset=' + offset;
    prev_offset = offset;
  } else {
    url_req = url;
    prev_offset = 0;
  }

  let tracks = [];
  do {
    let ret = sendSpotifyRequest('GET', url_req);

    if (total_tracks) {
      total_tracks -= prev_offset;
    } else {
      total_tracks = ret.total - prev_offset;
    }

    for (const item of ret.items) {
      tracks.push({
        'name': item.name,
        'id': item.uri,
      })
    }

    prev_offset += ret.items.length;
    url_req = url + '&offset=' + prev_offset;

  } while (tracks.length <= total_tracks);

  return tracks;
}


/**
 * Sends request to Spotify Web API.
 *
 * @param {string} method the request method
 * @param {string} url request URL path
 * @param {Object?} request the request payload
 * @return {Object} the response payload
 */
function sendSpotifyRequest(method, url, request) {
  const service = getOAuthService_();
  let payload = request !== undefined ? JSON.stringify(request) : null;
  let options = {
    headers: {
      Authorization: 'Bearer ' + service.getAccessToken(),
      accept: 'application/json'
    },
    method: method,
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: payload
  };

  let response = UrlFetchApp.fetch(url, options);
  let responseStatusCode = response.getResponseCode();
  if (responseStatusCode !== 200 && responseStatusCode !== 201) {
    const json = response.getContentText();

    if (responseStatusCode === 429) {
      const headers = response.getAllHeaders();
      Logger.log('Retry-After: ' + headers['Retry-After'])
      throw new Error('Spotify API rate limit hit!', {
        cause: API_SPOTIFY_ERROR_RATE_LIMIT
      });
    }

    const data = JSON.parse(json);
    const error = data['error'];

    if (error) {
      if (error.reason === API_SPOTIFY_ERROR_PREMIUM) {
        throw new Error('Spotify Premium subscription required for this feature!', {
          cause: API_SPOTIFY_ERROR_PREMIUM
        });
      } else {
        throw new Error(error['message']);
      }
    } else {
      throw new Error('Unknown error occured!');
    }
  }

  const json = response.getContentText();
  if (json.length !== 0) {
    let json_parsed = JSON.parse(json);

    return json_parsed;
  } else {
    throw new Error('Unknown error occured!');
  }
}