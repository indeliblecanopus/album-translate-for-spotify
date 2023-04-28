# Album Translate for Spotify


Google Workspace Add-on to help translate Spotify® album track names and search within the artist's discography.


https://user-images.githubusercontent.com/96784214/227575270-1d8b3289-9456-4d52-99d4-f2f5b847a4f2.mp4


**Note**: This is not an official Google or Spotify product.


## Getting Started


These instructions will get you a copy of the project up and running on your Google account for development or personal use.


### Create Apps Script project using `clasp` CLI utility


If you're already familiar with the `clasp` utility and using it, you can skip to the next paragraph.


If you'd like to follow the add-on deployment instructions below, you'll need `clasp` utility installed and authorized to the Google account where you intend to deploy this add-on. You can start with the installation, the instructions of which can be found [here](https://github.com/google/clasp#install). Once you have `clasp` installed, execute the following command to authorize it into
your Google account:


```bash
clasp login
```


Then, create and upload standalone App Script project:

1.  Clone the repo and navigate to the directory.

2.  Create a new project:
       
       ```bash
       clasp create --type standalone --title "Album Translate for Spotify"
       ```

   Note: You can modify the `--title` argument value as you wish.

3.  Push the code:

       ```bash
       clasp push -f
       ````

**Note**: Alternatively, you can manually create Apps Script project and copy file contents from this repo to it.


### Install the add-on


1. Open the script project from your Google Drive.

2. Navigate to `Deploy` menu (**blue button**) in the Apps Script tab, choose `Test deployments`.

3. Click `Install` button (**at bottom-right corner**) and `Done`.


### Create Spotify app and configure credentials


In order to use the add-on you'll need to create an app from Spotify developer [dashboard](https://developer.spotify.com/dashboard). Once you've signed-in/up, click `Create an app` and fill app `Name`/`Description` as preferred.


**Note**: Additionally, you can refer to [official Spotify developer guide](https://developer.spotify.com/documentation/general/guides/authorization/app-settings/)  which comes with a few screenshots and might be more helpful.


After you successfully created the app:

1. Copy `Client ID` and `Client Secret` values.

2. Open the add-on from either Google `Drive`, `Sheets` or `Docs` tab.

3. Optionally, mark the `Playback feature` checkbox.

4. Paste copied values into the corresponding fields and click `Save`.

5. Copy `Redirect URI` value from add-on and add to Spotify app settings. The latter can be
accessed from developer [dashboard](https://developer.spotify.com/dashboard), click `Edit Settings`.
Make sure to save changes.

6. Go back to add-on and click the `Authorize` button and follow the pop-up window.

7. After authorization status message is displayed, you should close the pop-ip window and
refresh the add-on to navigate to its dashboard, and then you're all set.


## Add-on Features - Overview


The add-on currently supports two core functions, which, going forward, we'll refer to as `Translate` and `Search` features.


### Translate Feature


`Translate` feature is supposed to be utilized when users need to translate all track names for a given album and display them in the add-on user GUI. You only need to insert an album URL in the translate field and click the `Translate` button to display results. 


This function utilizes Google Translate service which, so corresponding daily quota limits apply as listed [here](https://developers.google.com/apps-script/guides/services/quotas). Add-on tries to minimize translate calls by concatenating track names per album, however, sometimes this does not yield correct results and the add-on reverts back to translating each track name in the album one by one.    


**Note**: Currently, this feature is set to target only English translation.


### Search Feature


`Search` feature is meant to be utilized when users want to search for a given track name in an artist's discography, which contains some albums listed in non-English language. You will need to provide an artist URL and track name to search for this function, however, it does not display results immediately. The search is run as the background process that ultimately is supposed to store results internally, which later can be displayed by the user with the `Show Results` button.


Consider that, this feature similar to the `Translate` utilizes quota-limited service and uses relatively much more translation calls depending on the size of the artist's discography. In case the `Search` background task fails, the corresponding message will be displayed when you click `Show Results`. Otherwise, all translated and matched track names will be displayed.  


**Note**: Currently, this feature is set to target only English translation. Hence, the track name to search should be specified in English.


### Playback Feature (Optional)


`Playback` feature is optional and users can choose to enable it by marking a corresponding checkbox during the initial add-on authorization process. The feature can be utilized to add multiple tracks to the queue of the active player. You can select tracks from the results of either `Translate` or `Search` features.


**Note**: This feature is limited (by Spotify) to only users with Premium subscription plans.


### Library Feature (Optional)


`Library` feature is optional and users can choose to enable it by marking a corresponding checkbox during the initial add-on authorization process. The feature can be utilized to add multiple tracks to the user's library. You can select tracks from the results of either `Translate` or `Search` features.


## License


This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
