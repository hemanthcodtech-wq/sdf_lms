import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Downloads a file directly into mobile device storage WITHOUT triggering the share sheet.
 * @param {string} downloadUrl 
 * @param {string} fileName 
 * @param {string} mimeType 
 * @returns {Promise<boolean>}
 */
export const downloadFileToDeviceStorage = async (downloadUrl, fileName, mimeType = 'application/pdf') => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  try {
    const localUri = `${FileSystem.documentDirectory}${fileName}`;
    const downloadRes = await FileSystem.downloadAsync(downloadUrl, localUri);

    if (downloadRes.status !== 200) {
      throw new Error(`Download failed with status code ${downloadRes.status}`);
    }

    // On Android, use StorageAccessFramework so the user can save directly into their Downloads/Device folder
    if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
      try {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const base64Data = await FileSystem.readAsStringAsync(downloadRes.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const createdFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            mimeType
          );
          await FileSystem.writeAsStringAsync(createdFileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          Alert.alert(
            '✅ Download Successful',
            `File has been saved directly to your device storage:\n\n${fileName}`,
            [{ text: 'OK' }]
          );
          return true;
        }
      } catch (safErr) {
        console.warn('SAF error, file saved in app documents:', safErr);
      }
    }

    // Default notification for saved file
    Alert.alert(
      '✅ Download Successful',
      `File has been saved to your device:\n\n${fileName}`,
      [{ text: 'OK' }]
    );
    return true;
  } catch (err) {
    console.error('downloadFileToDeviceStorage error:', err);
    Alert.alert(
      'Download Notice',
      'Could not complete download. Please check your internet connection and try again.'
    );
    return false;
  }
};

/**
 * Downloads a file and opens the native Share sheet (WhatsApp, Gmail, Drive, etc.).
 * @param {string} downloadUrl 
 * @param {string} fileName 
 * @param {string} mimeType 
 * @param {string} dialogTitle 
 * @returns {Promise<boolean>}
 */
export const shareFile = async (downloadUrl, fileName, mimeType = 'application/pdf', dialogTitle = 'Share Document') => {
  try {
    const localUri = `${FileSystem.documentDirectory}${fileName}`;
    const downloadRes = await FileSystem.downloadAsync(downloadUrl, localUri);

    if (downloadRes.status === 200) {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadRes.uri, {
          mimeType,
          dialogTitle,
          UTI: mimeType === 'application/pdf' ? 'com.adobe.pdf' : undefined,
        });
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('shareFile error:', err);
    Alert.alert('Notice', 'Unable to open share sheet right now.');
    return false;
  }
};
