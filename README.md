# GPX2FIT Converter

Forked from [Nick Holloway / fit-route](https://gitlab.com/nwholloway/fit-route), this is an Android app that aims to solve the problem of converting a GPX file to a FIT file for Garmin devices like the Garmin fenix. Then it uses the Android Web Share API to share the FIT file to other apps like [Gadgetbridge](https://gadgetbridge.org/), to send it to a device, completely offline and without the invasive Garmin Connect, that requires internet to send local files to your watch via bluetooth.

It can also be run as a regular website, like the original project, and just let the user download the FIT file.

## DISCLAIMER - Read before using, please

This is a **personal project** to solve a problem: Garmin Connect requires internet service (?!?!) to sync GPX files stored locally in your Android phone to your Garmin fenix watch using bluetooth, which is a problem if you're in the middle of nowhere.

I am doing this as a hobby, I have **absolutely zero experience** developing JavaScript or Android apps and this is literally the first time I'm doing it. I'm providing this with <ins>**ABSOLUTELY ZERO WARRANTY**</ins>, just in case anyone can benefit from it, just as I benefitted from the project I forked to achieve this app. Half of my modifications are vibe coded using AI, so know what you are facing.

If there are any issues I could try to solve them whenever I have free time, but note that **I'm not doing this as a business or getting anything from it**.

## Development

First, download the dependencies for a 100% offline use of the Android app:

```
$ ./setup-offline.sh
```

Start a local server:

```console
$ npm install
$ npm start
```

The application will be served up on http://localhost:8080/. If you want it exposed in another IP or port, export the variables `C9_IP` or `C9_PORT`.

To sync the app with the android project (created using Capacitor):

```console
$ npx cap sync android
```

Then you can open the `android` folder as a project in Android studio and do all the magic.

## Notes

Documentation of the FIT file format is contained in the FIT SDK  
([download](https://www.thisisant.com/resources/fit/)), and this implementation  
does the bare minimum required.

The mapping uses [CARTO](https://github.com/CartoDB/basemap-styles) raster tiles,  
which are free for up to 75,000 mapviews per month for non-commercial use.

## Third Party Libraries

- [Vue.js](https://vuejs.org/)
- [Bootstrap](https://getbootstrap.com/)
- [Leaflet](https://leafletjs.com/)
- [Font Awesome](https://fontawesome.com/)