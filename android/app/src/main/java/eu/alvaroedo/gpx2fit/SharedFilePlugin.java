package io.alvaroedo.gpx2fit;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.util.Log;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Receives GPX files shared from other apps ("Share" or "Open with") and passes them
 * to the web app through the "fileReceived" event, as { name, data } with data in base64,
 * or { error } if the file couldn't be read.
 */
@CapacitorPlugin(name = "SharedFile")
public class SharedFilePlugin extends Plugin {

    private static final String TAG = "SharedFilePlugin";
    private static final String EVENT = "fileReceived";
    private static final int MAX_SIZE = 50 * 1024 * 1024;

    // Called by Capacitor both for the intent that started the app and for later ones.
    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);

        Uri uri = getUri(intent);
        if (uri == null) {
            return;
        }

        // Don't process the same file again if the activity is recreated.
        if (intent == getActivity().getIntent()) {
            getActivity().setIntent(new Intent());
        }

        getBridge().execute(() -> {
            JSObject result = new JSObject();
            try {
                result.put("name", getDisplayName(uri));
                result.put("data", Base64.encodeToString(readBytes(uri), Base64.NO_WRAP));
            } catch (Exception e) {
                Log.e(TAG, "Failed to read shared file " + uri, e);
                result.put("error", e.getMessage());
            }
            // Retained until the web app adds its listener, so files that start the app aren't lost.
            notifyListeners(EVENT, result, true);
        });
    }

    private Uri getUri(Intent intent) {
        if (intent == null) {
            return null;
        }
        if (Intent.ACTION_VIEW.equals(intent.getAction())) {
            return intent.getData();
        }
        if (Intent.ACTION_SEND.equals(intent.getAction())) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                return intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri.class);
            }
            return intent.getParcelableExtra(Intent.EXTRA_STREAM);
        }
        return null;
    }

    private String getDisplayName(Uri uri) {
        try (Cursor cursor = getContext().getContentResolver()
                .query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null)) {
            if (cursor != null && cursor.moveToFirst() && !cursor.isNull(0)) {
                return cursor.getString(0);
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not get name of " + uri, e);
        }
        String segment = uri.getLastPathSegment();
        return segment != null ? segment : "shared.gpx";
    }

    private byte[] readBytes(Uri uri) throws IOException {
        try (InputStream input = getContext().getContentResolver().openInputStream(uri)) {
            if (input == null) {
                throw new IOException("Could not open file");
            }
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] buffer = new byte[64 * 1024];
            int read;
            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
                if (output.size() > MAX_SIZE) {
                    throw new IOException("File is too large");
                }
            }
            return output.toByteArray();
        }
    }
}
