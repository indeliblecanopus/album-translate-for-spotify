# Album Translate for Spotify

Google Workspace Add-on to help translate Spotify® album track names and search within artist's discography.


https://user-images.githubusercontent.com/96784214/227575270-1d8b3289-9456-4d52-99d4-f2f5b847a4f2.mp4


**Note**: This is not an official Google or Spotify product.

## Getting Started

These instructions will get you a copy of the project up and running on your Google account for development or personal use.

### Create Apps Script project using `clasp` CLI utility

If you're already familiar with the `clasp` utility and using it, you can skip to the next paragraph.

If you'd like to follow the add-on [deployment instructions below](#deploy-apps-script-project), you'll need `clasp` utility installed and authorized to the Google account where you intend to deploy this add-on. You can start with theinstallation, the instructions of which can be found [here](https://github.com/google/clasp#install). Once you have `clasp` installed, execute the following command to authorize it into
your Google account:

```bash
clasp login
```

Then, create and upload standalone App Script project:

1.  Clone the repo and navigate to the directory.

2.  Create a new project:

        clasp create --type standalone --title "Album Translate for Spotify"

    Note: You can modify `--title` argument value as you wish. 

3.  Push the code:

        clasp push -f

**Note**: Alternatively, you can manully create Apps Script project and copy file contents from this repo to it.

### Install the add-on

1. Open the script project from your Google Drive.

2. Navigate to `Deploy` menu (**blue button**) in the Apps Script tab, choose `Test deployments`.

3. Click `Install` button (**at bottom-right corner**) and `Done`.

### Create Spotify app and configure credentials

In order to use the add-on you'll need to create an app from Spotify developer [dashboard](https://developer.spotify.com/dashboard). Once you've signed-in/up, click `Create an app` and fill app `Name`/`Description` as preferred. 

**Note**: Additionally, you can refer to [official Spotify developer guide](https://developer.spotify.com/documentation/general/guides/authorization/app-settings/)  which comes with few screenshots and might be more helpful.

After you successfully created the app:
1. Copy `Client ID` and `Client Secret` values. 

2. Open the add-on from either Google `Drive`, `Sheets` or `Docs` tab.

3. Optionally, mark the `Playback feature` checkbox.

4. Paste copied values into the corresponding fields and click `Save`.

5. Copy `Redirect URI` value from add-on and add to Spotify app settings. The latter can be 
accessed from developer [dashboard](https://developer.spotify.com/dashboard), click `Edit Setttings`.
Make sure to save changes.

6. Go back to add-on and click `Authorize` button and follow pop-up window.

7. After authorization status message is displayed, you should close the pop-ip window and
refresh the add-on to navigate to its dashboard, and then you're all set. 

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
