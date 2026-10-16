/* global URL */
import { parseGpx } from '../gpx.js';
import FileUpload from './file-upload.js';
import RouteInfo from './route-info.js';
import RouteMap from './route-map.js';
import { FITEncoder } from '../fit/encoder.js';

function setName(name) {
  this.route.name = name;
}

function setDuration(duration) {
  const points = this.route.points;
  const [{ time: startTime = Date.now() }, { distance: totalDistance }] = [points[0], points[points.length - 1]];
  for (const point of points) {
    point.time = startTime + Math.round(duration * (point.distance / totalDistance));
  }
  for (const turn of this.route.turns) {
    turn.time = startTime + Math.round(duration * (turn.distance / totalDistance));
  }
}

function onClear() {
  this.gpxFile = this.route = null;
  this.$emit('show-info', true);
}

function onError(errorMessage) {
  this.$emit('error', errorMessage);
}

async function onFileUpload(gpxFile) {
  try {
    this.gpxFile = gpxFile;
    this.route = await parseGpx(gpxFile);
    this.$emit('show-info', false);
  } catch (error) {
    console.error(error);
    this.$emit('error', `Unable to process "${gpxFile.name}"`);
  }
}

// Load GPX files shared from other Android apps ("Share" or "Open with").
async function onSharedFile({ name, data, error }) {
  if (error) {
    this.$emit('error', `Unable to open shared file: ${error}`);
    return;
  }
  const blob = await (await fetch(`data:application/gpx+xml;base64,${data}`)).blob();
  // Clear any open route first, so the map is recreated for the new one.
  this.gpxFile = this.route = null;
  await this.$nextTick();
  await this.onFileUpload(new File([blob], name, { type: 'application/gpx+xml' }));
}

function dismissGadgetbridgeTip() {
  this.showGadgetbridgeTip = false;
  try {
    localStorage.setItem('gadgetbridgeTipDismissed', 'true');
  } catch {
    // Storage not available, the tip will show again next time
  }
}

function gadgetbridgeTipDismissed() {
  try {
    return localStorage.getItem('gadgetbridgeTipDismissed') === 'true';
  } catch {
    return false;
  }
}

const isNativePlatform = () => window.Capacitor?.isNativePlatform?.() ?? false;

async function onFitDownload() {
  const optionalTime = (value) => (this.includeTiming ? value : undefined);

  try {
    const start = this.route.points[0];
    const finish = this.route.points[this.route.points.length - 1];

    const encoder = new FITEncoder();
    encoder.writeFileId({ type: 'course', time_created: Date.now() });
    encoder.writeCourse({ name: this.route.name });
    encoder.writeLap({
      timestamp: optionalTime(start.time),
      total_timer_time: (finish.time - start.time) / 1000,
      start_time: start.time,
      start_position_lat: start.lat,
      start_position_long: start.lon,
      end_position_lat: finish.lat,
      end_position_long: finish.lon,
      total_distance: finish.distance,
      total_ascent: this.route.eleGain,
      total_descent: this.route.eleLoss
    });

    if (this.includeTiming) {
      encoder.writeEvent({
        timestamp: start.time,
        event: 'timer',
        event_type: 'start',
        event_group: 0
      });
    }

    const points = this.route.points;
    if (this.includeTurns) {
      points.push(...this.route.turns);
      const tweakedDistance = ({ distance, turn }) => distance - 50 * (turn !== undefined);
      points.sort((a, b) => tweakedDistance(a) - tweakedDistance(b));
    }

    for (const { lat, lon, distance, time, ele, turn } of points) {
      if (turn === undefined) {
        encoder.writeRecord({
          timestamp: optionalTime(time),
          position_lat: lat,
          position_long: lon,
          distance,
          altitude: ele
        });
      } else {
        encoder.writeCoursePoint({
          timestamp: optionalTime(time),
          position_lat: lat,
          position_long: lon,
          distance,
          type: turn
        });
      }
    }

    if (this.includeTiming) {
      encoder.writeEvent({
        timestamp: finish.time,
        event: 'timer',
        event_type: 'stop_disable_all',
        event_group: 0
      });
    }

    const blob = encoder.blob;
    const fileName = `${this.route.name}.fit`;

    // --- Native (Capacitor) share ---
    if (this.isNative) {
      const { Filesystem, Share } = window.Capacitor.Plugins;

      // Convert blob to base64 using FileReader
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          resolve(dataUrl.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Write file to CACHE directory
      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: 'CACHE',
        recursive: true
      });

      // Get URI for sharing
      const fileUri = await Filesystem.getUri({
        path: fileName,
        directory: 'CACHE'
      });

      // Share the file
      await Share.share({
        title: `Share ${this.route.name}.fit`,
        text: `Check out this route: ${this.route.name}`,
        url: fileUri.uri,
        dialogTitle: 'Share FIT File'
      });

      return;
    }

    // --- Web fallback ---
    const url = URL.createObjectURL(encoder.blob);
    const anchorElement = this.$refs.downloadAnchor;
    anchorElement.download = `${this.route.name}.fit`;
    anchorElement.href = url;
    anchorElement.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);

  } catch (error) {
    // Don't show error for user cancellation
    if (error.message.includes('canceled') || error.message.includes('cancelled') || error.message.includes('dismissed')) {
      return;
    }
    console.error('FIT export error:', error);
    this.$emit('error', `Unable to create FIT: ${error.message}`);
  }
}

const FitRoute = {
  template: '#fit-route-template',
  data: () => ({
    gpxFile: null,
    route: null,
    units: 'km',
    includeTiming: true,
    includeTurns: true,
    isNative: isNativePlatform(),
    // Only shown in the Android app, until dismissed
    showGadgetbridgeTip: isNativePlatform() && !gadgetbridgeTipDismissed()
  }),
  methods: {
    onClear,
    onFileUpload,
    onError,
    onFitDownload,
    onSharedFile,
    dismissGadgetbridgeTip,
    setName,
    setDuration
  },
  components: {
    FileUpload,
    RouteInfo,
    RouteMap
  },
  async mounted() {
    const SharedFile = this.isNative && window.Capacitor.Plugins.SharedFile;
    if (SharedFile) {
      this.sharedFileListener = await SharedFile.addListener('fileReceived', this.onSharedFile);
    }
  },
  unmounted() {
    this.sharedFileListener?.remove();
  }
};

export default FitRoute;
