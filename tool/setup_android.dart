// Run from the project root. Generate the Android runner matching the installed SDK.
import 'dart:io';

Future<void> main() async {
  if (!File('tool/android_template/MainActivity.kt').existsSync()) {
    stderr.writeln('Jalankan perintah dari folder SpeaKids.');
    exitCode = 1;
    return;
  }
  if (Directory('android').existsSync()) {
    stdout.writeln('Folder android sudah ada. Setup dilewati.');
    return;
  }
  final temporary = await Directory.systemTemp.createTemp('speakids_setup_');
  try {
    final runner = Directory('${temporary.path}/speakids');
    final result = await Process.run(
      Platform.isWindows ? 'flutter.bat' : 'flutter',
      ['create', '--no-pub', '--platforms=android', '--org', 'id.speakids',
       '--project-name', 'speakids', runner.path],
      runInShell: Platform.isWindows,
    );
    if (result.exitCode != 0) throw StateError('${result.stdout}\n${result.stderr}');
    final android = Directory('${runner.path}/android');
    final main = Directory('${android.path}/app/src/main');
    final activity = File('${main.path}/kotlin/id/speakids/speakids/MainActivity.kt');
    if (!activity.existsSync()) throw StateError('Templat Kotlin tidak ditemukan.');
    await File('tool/android_template/MainActivity.kt').copy(activity.path);
    final manifest = File('${main.path}/AndroidManifest.xml');
    var xml = await manifest.readAsString();
    xml = xml.replaceFirst('<application', '''
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-feature android:name="android.hardware.microphone" android:required="false" />
    <application''').replaceFirst('android:label="speakids"', 'android:label="SpeaKids"');
    const query = '<intent><action android:name="android.speech.RecognitionService" /></intent>';
    xml = xml.contains('<queries>')
        ? xml.replaceFirst('<queries>', '<queries>$query')
        : xml.replaceFirst('</manifest>', '<queries>$query</queries></manifest>');
    await manifest.writeAsString(xml);
    for (final suffix in ['.kts', '']) {
      final gradle = File('${android.path}/app/build.gradle$suffix');
      if (await gradle.exists()) {
        final contents = await gradle.readAsString();
        await gradle.writeAsString(contents.replaceAll('flutter.minSdkVersion',
            suffix.isEmpty ? 'Math.max(flutter.minSdkVersion, 23)' : 'maxOf(flutter.minSdkVersion, 23)'));
      }
    }
    // Copy through a sibling directory so interrupted setup does not leave a
    // half-written Android project at the normal entry point.
    final staging = await Directory('android_staging_${DateTime.now().microsecondsSinceEpoch}').create();
    try {
      await for (final entity in android.list(recursive: true)) {
        final relative = entity.path.substring(android.path.length + 1);
        final output = '${staging.path}/$relative';
        if (entity is Directory) {
          await Directory(output).create(recursive: true);
        } else if (entity is File) {
          await File(output).parent.create(recursive: true);
          await entity.copy(output);
        }
      }
      await staging.rename('android');
    } finally {
      if (await staging.exists()) await staging.delete(recursive: true);
    }
    stdout.writeln('Android siap. Jalankan flutter pub get, lalu flutter run.');
  } finally {
    await temporary.delete(recursive: true);
  }
}
