const DEBUG = false;
const DEBUG_L2 = false;
const DEBUG_L3 = false;


/**
 * Script Properties and other miscellaneous constants
 * 
 --------------------------------------------------------------- */
const PROPERTY_SPOTIFY_CREDENTIALS = 'SPOTIFY_CREDENTIALS'; // {CLIENT_ID: string, CLIENT_SECRET: string} 
const PROPERTY_SPOTIFY_PLAYBACK_ENABLED = 'SPOTIFY_PLAYBACK_ENABLED';
const PROPERTY_SEARCH_IN_PROGRESS = 'SEARCH_IN_PROGRESS';

const PROPERTY_JOB_QUEUE = 'JOB_QUEUE'; // [ {'trigger_id': string, 'task_status': boolean, 'artist_id': string, 'artist_name': string, 'track_name': string}, ...]
const PROPERTY_SEARCH_RESULTS = 'SEARCH_RESULTS'; // {status: boolean, matched_tracks: Array}

const API_SPOTIFY_BASE_URL = 'https://api.spotify.com/v1/';
const API_SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const API_SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

const API_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2/detect';

const API_SPOTIFY_PAYBACK_SCOPES = 'user-read-playback-state user-modify-playback-state';

const SPOTIFY_LOGO = 'https://raw.githubusercontent.com/indeliblecanopus/album-translate-for-spotify/main/assets/Spotify_Logo.png';
const SPOTIFY_URL_WEB_PLAYER = 'https://open.spotify.com/';

const DELIMITER_SETS = [{
  delimiter_track: 'Ⓚ',
  delimiter_album: 'Ⓠ'
},
{
  delimiter_track: 'ℝ',
  delimiter_album: 'ℚ'
}, {
  delimiter_track: 'Ⓡ',
  delimiter_album: 'Ⓠ'
}
]

const ONE_SECOND = 1000;
const TEN_SECONDS = 10000;
const THIRTY_SECONDS = 30000;
const ONE_MINUTE = 60000;

/** ------------------------------------------------------------ */


function printRedirectURL() {
  Logger.log('https://script.google.com/macros/d/' + ScriptApp.getScriptId() + '/usercallback')
}


function reset() {

  try {
    resetAddOn();
  } catch (e) {
    const notification = CardService.newNotification()
      .setText('Reset failed! ' + e);

    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }

  return configurationCard();
}


function resetAddOn() {
  const START = new Date();

  logout();

  const user_properties = PropertiesService.getUserProperties();
  user_properties.deleteAllProperties();

  ScriptApp.getProjectTriggers().forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });

  Logger.log('[DEBUG] Script reset successfully on ' + START);
}


function onHomePage() {
  try {
    let service = getOAuthService_();

    if (service.hasAccess()) {
      return dashboardCard();
    } else {
      return configurationCard();
    }
  } catch (e) {
    return configurationCard();
  }
}


function refreshCard() {

  const service = getOAuthService_();

  if (service === null || !service.hasAccess || !service.hasAccess()) {
    return configurationCard();
  } else {
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation()
        .updateCard(dashboardCard()))
      .build();
  }
}


function logout() {
  let service = getOAuthService_();
  if (service) {
    service.reset();
  }
}


function getOAuthService_(credentials) {

  if (!credentials) {
    credentials = JSON.parse(PropertiesService.getUserProperties().getProperty(PROPERTY_SPOTIFY_CREDENTIALS));
  }

  if (credentials === null) {
    return credentials;
  }

  const user_properties = PropertiesService.getUserProperties();
  const playback_enable = user_properties.getProperty(PROPERTY_SPOTIFY_PLAYBACK_ENABLED);

  return OAuth2.createService('Spotify')
    .setAuthorizationBaseUrl(API_SPOTIFY_AUTH_URL)
    .setTokenUrl(API_SPOTIFY_TOKEN_URL)

    .setClientId(credentials.CLIENT_ID)
    .setClientSecret(credentials.CLIENT_SECRET)

    .setCallbackFunction('authCallback')

    .setPropertyStore(PropertiesService.getUserProperties())
    .setLock(LockService.getUserLock())

    .setParam('scope', playback_enable ? API_SPOTIFY_PAYBACK_SCOPES : '')
    .setParam('show_dialog', true)
}


function configurationCard(event, saved_credentials = false) {
  Logger.log('entered configurationCard()');

  const info_auth =
    'Add-on needs authorization to a Spotify account!' +
    ' Please specify Client ID and Secret from your Spotify Developer account (app).';

  let builder = CardService.newCardBuilder();
  let section = CardService.newCardSection()
    .setHeader("Authorization Required")
    .addWidget(CardService.newTextParagraph()
      .setText(info_auth));

  const service = getOAuthService_();

  if (service && service.hasAccess && service.hasAccess()) {
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation()
        .updateCard(dashboardCard()))
      .build();

  } else if (saved_credentials) {

    const url_auth = service.getAuthorizationUrl();

    let button_auth = CardService.newTextButton()
      .setText('Authorize')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setDisabled(false)
      .setOpenLink(CardService.newOpenLink()
        .setUrl(url_auth)
        .setOpenAs(CardService.OpenAs.OVERLAY)
        .setOnClose(CardService.OnClose.RELOAD_ADD_ON));

    let button_refresh = CardService.newTextButton()
      .setText('Refresh')
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setDisabled(false)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('refreshCard'));

    section
      .addWidget(CardService.newButtonSet()
        .addButton(button_auth)
        .addButton(button_refresh));

  } else {
    let button_save_cred = CardService.newTextButton()
      .setText('Save')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('saveCredentials'))
      .setDisabled(false);

    let button_refresh = CardService.newTextButton()
      .setText('Refresh')
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setDisabled(false)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('refreshCard'));

    const checkbox_playback = CardService.newSelectionInput()
      .setFieldName('checkbox_playback')
      .setType(CardService.SelectionInputType.CHECK_BOX)
      .addItem('Playback Feature', 'true', false);

    const info_playback =
      '\n\n• If you want to change playback from this add-on mark "Playback Feature" checkbox' +
      '\n\n• Otherwise, you can still use the add-on to translate and search albums/tracks';

    section
      .addWidget(CardService.newTextParagraph()
        .setText(info_playback))
      .addWidget(CardService.newTextInput()
        .setMultiline(true)
        .setTitle('Client ID:')
        .setFieldName('client_id')
        .setValue(''))
      .addWidget(CardService.newTextInput()
        .setMultiline(true)
        .setTitle('Client Secret:')
        .setFieldName('client_secret')
        .setValue(''))
      .addWidget(checkbox_playback)
      .addWidget(CardService.newButtonSet()
        .addButton(button_save_cred)
        .addButton(button_refresh));

  }

  return builder.addSection(section).build();
}


function authCallback(request) {
  Logger.log('entered authCallback()');

  let service = getOAuthService_();
  let authorized;
  try {
    authorized = service.handleCallback(request);
  } catch (e) {
    Logger.log(e.message);
    let html_output = HtmlService.createHtmlOutputFromFile('auth_failure.html');
    const html_output_content = html_output.getContent().replace(
      'Please close this window and try again', e.message);
    try {
      html_output.setContent(html_output_content);
    } catch (e) {
      Logger.log(e.message);
    }
    return html_output;
  }

  if (authorized) {
    return HtmlService.createHtmlOutputFromFile('auth_success.html');
  } else {
    return HtmlService.createHtmlOutputFromFile('auth_failure.html');
  }
}


function dashboardCard(event, background_task_running = PropertiesService.getUserProperties().getProperty(PROPERTY_SEARCH_IN_PROGRESS)) {
  Logger.log('entered dashboardCard()');

  const service = getOAuthService_();
  if (!service || !service.hasAccess || !service.hasAccess()) {
    return configurationCard();
  }

  let builder = CardService.newCardBuilder();

  builder.addSection(CardService.newCardSection()
    .addWidget(CardService.newTextInput()
      .setMultiline(true)
      .setTitle('Insert Spotify Album URL:')
      .setFieldName('album_url')
      .setValue(''))
    .addWidget(CardService.newButtonSet()
      .addButton(CardService.newTextButton()
        .setText('Translate')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setOnClickAction(CardService.newAction()
          .setFunctionName('tranlateAlbumTracks'))
        .setDisabled(false)))
    .addWidget(CardService.newTextInput()
      .setMultiline(true)
      .setTitle('Insert Spotify Artist URL:')
      .setFieldName('artist_url')
      .setValue(''))
    .addWidget(CardService.newTextInput()
      .setMultiline(true)
      .setTitle('Insert Track Name:')
      .setFieldName('track_name')
      .setValue(''))
    .addWidget(CardService.newButtonSet()
      .addButton(CardService.newTextButton()
        .setText('Search')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setOnClickAction(CardService.newAction()
          .setFunctionName('scheduleSearchTracks'))
        .setDisabled(background_task_running ? true : false))
      .addButton(CardService.newTextButton()
        .setText('Show Results')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setOnClickAction(CardService.newAction()
          .setFunctionName('showSearchResults'))
        .setDisabled(!background_task_running ? true : false)))

  );


  const footer = CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
      .setText("Go to Dashboard")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('dashboardCard')));

  builder.setFixedFooter(footer);

  return builder.build();
}


function tranlateAlbumTracks(event) {
  Logger.log('entered tranlateAlbumTracks() func');

  const service = getOAuthService_();
  if (!service || !service.hasAccess || !service.hasAccess()) {
    return configurationCard();
  }

  if (!event.formInputs.album_url) {
    const notification = CardService.newNotification()
      .setText('[ERROR] Album URL empty!');

    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }

  const album_url = event.formInputs.album_url[0];
  const key = 'https://open.spotify.com/album/';
  const index = album_url.indexOf(key);
  if (index === -1) {
    const notification = CardService.newNotification()
      .setText('[ERROR] Please specify valid Spotify album URL!');

    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }

  const query_index = album_url.indexOf('?si');
  let album_id;
  if (query_index !== -1) {
    album_id = album_url.substring(index + key.length, query_index);
  } else {
    album_id = album_url.substring(index + key.length, album_url.length);
  }

  let album_data;
  try {
    album_data = spotifyGetAlbumData(album_id);

  } catch (e) {
    let notification;
    if (e.message.includes('invalid id')) {
      notification = CardService.newNotification()
        .setText('[ERROR] Invalid Album URL!');
    } else {
      notification = CardService.newNotification()
        .setText('[ERROR] ' + e.message);
    }


    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }

  let translate_flag = false;
  for (const del_set of DELIMITER_SETS) {
    let tracks_as_string = '';

    for (const item of album_data.tracks) {
      tracks_as_string += (item.name + del_set.delimiter_track);
    }

    const album_as_text = album_data.name + del_set.delimiter_album + tracks_as_string;
    const translation = LanguageApp.translate(album_as_text, '', 'en');

    let translation_split = translation.split(del_set.delimiter_album);
    if (translation_split.length < 2) {
      continue;
    }

    album_data['translation'] = translation_split[0];
    let tracks_translated = translation_split[1].split(del_set.delimiter_track);
    tracks_translated.pop();

    if (album_data.tracks.length !== tracks_translated.length) {
      continue;
    }

    tracks_translated.forEach((track, track_index) => {
      album_data.tracks[track_index].translation = track.trim();
    })

    const artist_translation = LanguageApp.translate(album_data.artists.as_string, '', 'en').trim();
    DEBUG_L3 && Logger.log('[DEBUG] artist_translation: ' + artist_translation);
    if (artist_translation !== album_data.artists.as_string) {
      album_data.artists['translation'] = artist_translation;
    } else {
      album_data.artists['translation'] = null;
    }

    translate_flag = true;
    DEBUG_L3 && Logger.log('[DEBUG] ALBUM name: ' + album_data.translation);
    DEBUG_L3 && Logger.log('[DEBUG] delimiter set used: ' + Object.values(del_set));
    break;
  }

  if (translate_flag) {
    return albumCard(album_data);
  } else {
    // Translate album name and tracks one by one 
    album_data['translation'] = LanguageApp.translate(album_data.name, '', 'en').trim();
    DEBUG_L3 && Logger.log('[DEBUG] ALBUM name: ' + album_data.translation);
    DEBUG_L3 && Logger.log('[DEBUG] One by one translation');

    const artist_translation = LanguageApp.translate(album_data.artists.as_string, '', 'en').trim();
    DEBUG_L3 && Logger.log('[DEBUG] artist_translation: ' + artist_translation);
    if (artist_translation !== album_data.artists.as_string) {
      album_data.artists['translation'] = artist_translation;
    }

    album_data.tracks.forEach((track, track_index) => {
      album_data.tracks[track_index].translation = LanguageApp.translate(track.name, '', 'en').trim();
      if (track_index % 10 === 0) {
        Utilities.sleep(1000);
      }
    });

    return albumCard(album_data);
  }

}


function albumCard(album_data) {
  Logger.log('entered albumCard() func');



  let image = CardService.newImage()
    .setAltText(album_data.name)
    .setOpenLink(CardService.newOpenLink()
      .setUrl(album_data.url))
    .setImageUrl(album_data.photo);

  let builder = CardService.newCardBuilder();

  let checkbox_tracks = generateCheckboxList('checkbox_tracks', 'Tracks', album_data.tracks, false);

  const playback_enabled = PropertiesService.getUserProperties().getProperty(PROPERTY_SPOTIFY_PLAYBACK_ENABLED) ? false : true;
  let button_set_playback = CardService.newButtonSet()
    .addButton(CardService.newTextButton()
      .setText('Play Selected')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('addTracksToQueue')
        .setParameters({
          'album_data': JSON.stringify(album_data),
          'play_now': 'true'
        }))
      .setDisabled(playback_enabled))
    .addButton(CardService.newTextButton()
      .setText('Add to Queue')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('addTracksToQueue')
        .setParameters({
          'album_data': JSON.stringify(album_data),
          'play_now': ''
        }))
      .setDisabled(playback_enabled));


  let image_spotify_logo = CardService.newImage()
    .setOpenLink(CardService.newOpenLink()
      .setUrl(SPOTIFY_URL_WEB_PLAYER))
    .setImageUrl(SPOTIFY_LOGO);

  builder
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText('Information displayed below is provided by '))
      .addWidget(image_spotify_logo))
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText(album_data.name + '\n' + album_data.translation))
      .addWidget(image)
      .addWidget(CardService.newTextParagraph().setText(album_data.artists.translation ? album_data.artists.translation : album_data.artists.as_string))
      .addWidget(checkbox_tracks)
      .addWidget(button_set_playback)
    );


  const footer = CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
      .setText("Go to Dashboard")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('goToDashboard')));


  builder.setFixedFooter(footer);

  return builder.build();
}


function goToDashboard() {
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation()
      .updateCard(dashboardCard()))
    .build();
}


function scheduleSearchTracks(event) {
  Logger.log('entered tranlateAlbumTracks() func');

  const service = getOAuthService_();
  if (!service || !service.hasAccess || !service.hasAccess()) {
    return configurationCard();
  }

  const user_properties = PropertiesService.getUserProperties();
  const search_in_progress = user_properties.getProperty(PROPERTY_SEARCH_IN_PROGRESS);
  if (search_in_progress) {
    const notification = CardService.newNotification()
      .setText('[ALERT] Background task is running! Can\'t schedule another search now');

    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }

  if (!event.formInputs.artist_url) {
    const notification = CardService.newNotification()
      .setText('[ERROR] Artist URL empty!');

    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }

  const artist_url = event.formInputs.artist_url[0];
  const key = 'https://open.spotify.com/artist/';
  const index = artist_url.indexOf(key);
  if (index === -1) {
    const notification = CardService.newNotification()
      .setText('[ERROR] Please specify valid Spotify artist URL!');

    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }

  if (!event.formInputs.track_name) {
    const notification = CardService.newNotification()
      .setText('[ERROR] Track name empty!');

    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }

  const track_name = event.formInputs.track_name[0].trim();
  Logger.log('track_name: ' + track_name);
  if (track_name.length < 2) {
    const notification = CardService.newNotification()
      .setText('[ERROR] Please specify valid track name!');

    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }

  const query_index = artist_url.indexOf('?si');
  let artist_id;
  if (query_index !== -1) {
    artist_id = artist_url.substring(index + key.length, query_index);
  } else {
    artist_id = artist_url.substring(index + key.length, artist_url.length);
  }

  let artist_name;
  try {
    artist_name = spotifyGetArtist(artist_id)?.name;
  } catch (e) {
    const notification = CardService.newNotification()
      .setText('[ERROR] Failed to retrieve artist!\n' + e.message);

    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }


  let job_queue = JSON.parse(user_properties.getProperty(PROPERTY_JOB_QUEUE));

  let trigger;
  try {
    trigger = ScriptApp.newTrigger('searchTracks')
      .timeBased()
      .after(ONE_SECOND)
      .create();

  } catch (e) {
    const notification = CardService.newNotification()
      .setText('[ERROR] Background task is running! Can\'t schedule another search now');

    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }

  const trigger_id = trigger.getUniqueId();

  const new_job = {
    'trigger_id': trigger_id,
    'task_status': false,
    'artist_id': artist_id,
    'artist_name': artist_name,
    'track_name': track_name
  };

  job_queue.push(new_job);
  user_properties.setProperty(PROPERTY_JOB_QUEUE, JSON.stringify(job_queue));
  user_properties.setProperty(PROPERTY_SEARCH_IN_PROGRESS, true);

  Logger.log('Scheduled trigger: ' + trigger_id);

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setText('Search started successfully'))
    .setNavigation(CardService.newNavigation()
      .updateCard(dashboardCard({}, true)))
    .build();
}


function searchTracks() {

  const user_properties = PropertiesService.getUserProperties();
  let job_queue = JSON.parse(user_properties.getProperty(PROPERTY_JOB_QUEUE));

  let job;
  if (job_queue !== null) {
    job = job_queue.shift();
  }
  user_properties.setProperty(PROPERTY_JOB_QUEUE, JSON.stringify(job_queue));

  if (job === undefined) {
    Logger.log('[ERROR] No jobs in the queue! Exiting ...');
    return;
  }

  const artist_name = job.artist_name;
  let tracks = spotifyGetArtistTracks(job.artist_id);
  const track_name = job.track_name.toLowerCase();

  let tracks_matched = [];
  let translate_flag = false;
  let album_index = 0;
  for (const album of tracks) {
    let tracks_as_string = album.tracks.reduce((accumulator, currentValue) => accumulator + currentValue.name + ',', '');

    let album_tracks_matched = {
      'album_url': album.album_url,
      'album_image': album.album_image,
      'album_name': album.album_name,
      'tracks': []
    };

    for (const del_set of DELIMITER_SETS) {
      if (album_index % 6 === 0) {
        Utilities.sleep(1000);
      }

      tracks_as_string = tracks_as_string.replaceAll(',', del_set.delimiter_track)

      const translation = LanguageApp.translate(tracks_as_string, '', 'en');

      let tracks_translated = translation.split(del_set.delimiter_track);
      tracks_translated.pop();

      if (album.tracks.length !== tracks_translated.length) {
        continue;
      }

      tracks_translated.forEach((track, track_index) => {
        const track_trimmed = track.trim();

        if (track_trimmed.toLowerCase().includes(track_name)) {
          album_tracks_matched.tracks.push({
            'name': album.tracks[track_index].name,
            'translation': track_trimmed,
            'track_index': track_index + 1,
            'id': album.tracks[track_index].id,
          });
        }
      })


      translate_flag = true;
      DEBUG_L3 && Logger.log('[DEBUG] delimiter set used: ' + Object.values(del_set));
      break;
    }

    if (album_tracks_matched.tracks.length > 0) {
      tracks_matched.push(album_tracks_matched);
    }

    album_index += 1;
  }

  if (translate_flag) {

    user_properties.setProperty(PROPERTY_SEARCH_RESULTS, JSON.stringify({
      'status': true,
      'artist_name': artist_name,
      'tracks_matched': tracks_matched,
      'track_name': job.track_name
    }));

  } else {
    user_properties.setProperty(PROPERTY_SEARCH_RESULTS, JSON.stringify({
      'status': false,
      'track_name': job.track_name
    }));
  }

  user_properties.setProperty(PROPERTY_SEARCH_IN_PROGRESS, '');
}


function showSearchResults(event) {
  const user_properties = PropertiesService.getUserProperties();
  let search_results = JSON.parse(user_properties.getProperty(PROPERTY_SEARCH_RESULTS));
  user_properties.deleteProperty(PROPERTY_SEARCH_RESULTS);

  if (PropertiesService.getUserProperties().getProperty(PROPERTY_SEARCH_IN_PROGRESS)) {
    const notification = CardService.newNotification()
      .setText('Search in progress! Try again later');

    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }

  if (!search_results) {
    const notification = CardService.newNotification()
      .setText('No search results found! Please try a new search query');

    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }

  if (!search_results?.status) {
    const notification = CardService.newNotification()
      .setText('Search failed! Please try a new search query');

    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }


  if (search_results.status) {

    if (search_results.tracks_matched.length > 0) {
      return trackCard(search_results);

    } else {
      const notification = CardService.newNotification()
        .setText('No matching tracks found with name: "' + search_results.track_name + '"');

      return CardService.newActionResponseBuilder()
        .setNotification(notification)
        .build();
    }
  } else {
    const notification = CardService.newNotification()
      .setText('Search/Translation part failed!');

    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }

}


function trackCard(track_data) {
  let builder = CardService.newCardBuilder();

  let section_tracks = generateCheckboxListAlbum(track_data.tracks_matched);

  const playback_enabled = PropertiesService.getUserProperties().getProperty(PROPERTY_SPOTIFY_PLAYBACK_ENABLED) ? false : true;
  let button_set_playback = CardService.newButtonSet()
    .addButton(CardService.newTextButton()
      .setText('Play Selected')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('addTracksToQueue')
        .setParameters({
          'track_data': JSON.stringify(track_data.tracks_matched),
          'card_type': 'search',
          'play_now': 'true'
        }))
      .setDisabled(playback_enabled))
    .addButton(CardService.newTextButton()
      .setText('Add to Queue')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('addTracksToQueue')
        .setParameters({
          'track_data': JSON.stringify(track_data.tracks_matched),
          'card_type': 'search',
          'play_now': ''
        }))
      .setDisabled(playback_enabled));


  let artist_paragraph;
  const artist_translation = LanguageApp.translate(track_data.artist_name, '', 'en').trim();
  if (artist_translation === track_data.artist_name) {
    artist_paragraph = CardService.newTextParagraph().setText(track_data.artist_name);
  } else {
    artist_paragraph = CardService.newTextParagraph().setText(track_data.artist_name + '\n' + artist_translation);

  }

  let image_spotify_logo = CardService.newImage()
    .setOpenLink(CardService.newOpenLink()
      .setUrl(SPOTIFY_URL_WEB_PLAYER))
    .setImageUrl(SPOTIFY_LOGO);

  builder
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText('Information displayed below is provided by '))
      .addWidget(image_spotify_logo))
    .addSection(CardService.newCardSection()
      .addWidget(artist_paragraph))
    .addSection(section_tracks)
    .addSection(CardService.newCardSection()
      .addWidget(button_set_playback));

  const footer = CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
      .setText("Go to Dashboard")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('dashboardCard')));


  builder.setFixedFooter(footer);

  return builder.build();
}


function addTracksToQueue(event) {
  Logger.log('entered addTracksToQueue() func');

  const service = getOAuthService_();
  if (!service || !service.hasAccess || !service.hasAccess()) {
    return configurationCard();
  }

  if (event.parameters.card_type === 'search') {

    Logger.log(event.parameters.track_data.toString());
    Logger.log(JSON.stringify(event.formInputs));

    if (!event.formInputs || Object.entries(event.formInputs).length === 0) {
      const notification = CardService.newNotification()
        .setText('[ERROR] No tracks selected!');

      return CardService.newActionResponseBuilder()
        .setNotification(notification)
        .build();
    }

    for (const key in event.formInputs) {
      if (Object.hasOwnProperty.call(event.formInputs, key)) {
        for (const track_id of event.formInputs[key]) {
          try {
            spotifyAddTrackToPlaybackQueue(track_id)
          } catch (e) {

            const notification = CardService.newNotification()
              .setText('[ERROR] ' + e.message);

            return CardService.newActionResponseBuilder()
              .setNotification(notification)
              .build();
          }
        }
      }
    }

  } else {

    if (!event.formInputs.checkbox_tracks) {
      const notification = CardService.newNotification()
        .setText('[ERROR] No tracks selected!');

      return CardService.newActionResponseBuilder()
        .setNotification(notification)
        .build();
    }

    DEBUG_L3 && Logger.log(event.formInputs.checkbox_tracks);

    for (const track_id of event.formInputs.checkbox_tracks) {
      try {
        spotifyAddTrackToPlaybackQueue(track_id)
      } catch (e) {

        const notification = CardService.newNotification()
          .setText('[ERROR] ' + e.message);

        return CardService.newActionResponseBuilder()
          .setNotification(notification)
          .build();
      }
    }
  }


  if (event.parameters.play_now) {
    try {
      spotifySkipToNext();
    } catch (e) {

      const notification = CardService.newNotification()
        .setText('[ERROR] ' + e.message);

      return CardService.newActionResponseBuilder()
        .setNotification(notification)
        .build();
    }
  }

  return albumCard(JSON.parse(event.parameters.album_data));
}


function saveCredentials(event) {
  Logger.log('entered saveCredentials() func');

  if (!event.formInputs.client_id || !event.formInputs.client_secret) {
    const notification = CardService.newNotification()
      .setText('[ERROR] The Client ID and Client Secret fields empty!');

    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }

  const user_properties = PropertiesService.getUserProperties();

  const credentials = {
    'CLIENT_ID': event.formInputs.client_id[0],
    'CLIENT_SECRET': event.formInputs.client_secret[0]
  };

  if (event.formInputs.checkbox_playback && event.formInputs.checkbox_playback[0] === 'true') {
    user_properties.setProperty(PROPERTY_SPOTIFY_PLAYBACK_ENABLED, 'true');
  } else {
    user_properties.setProperty(PROPERTY_SPOTIFY_PLAYBACK_ENABLED, '');
  }

  user_properties.setProperty(PROPERTY_SPOTIFY_CREDENTIALS, JSON.stringify(credentials));
  user_properties.setProperty(PROPERTY_JOB_QUEUE, JSON.stringify([]));

  return configurationCard({}, true);
}


function generateCheckboxListAlbum(album_data) {

  let section = CardService.newCardSection();

  for (const item of album_data) {

    let image = CardService.newImage()
      .setAltText(item.album_name)
      .setOpenLink(CardService.newOpenLink()
        .setUrl(item.album_url))
      .setImageUrl(item.album_image);

    section.addWidget(image);

    let selection_input = CardService.newSelectionInput()
      .setTitle(item.album_name)
      .setFieldName(item.album_name)
      .setType(CardService.SelectionInputType.CHECK_BOX);

    item.tracks.forEach((track, index) => {
      selection_input.addItem(track.track_index + '. ' + track.translation, track.id, false);
    })

    section.addWidget(selection_input);
  }

  return section;
}


function generateCheckboxList(field_name, field_title, list_of_items, default_value) {

  let selection_input = CardService.newSelectionInput()
    .setTitle(field_title)
    .setFieldName(field_name)
    .setType(CardService.SelectionInputType.CHECK_BOX);

  list_of_items.forEach((item, item_index) => {
    selection_input.addItem((item_index + 1) + '. ' + item.translation, item.id, default_value);
  })

  return selection_input;
}
