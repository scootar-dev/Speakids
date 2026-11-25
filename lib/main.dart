import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SpeaKids());
}

class SpeaKids extends StatelessWidget {
  const SpeaKids({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'SpeaKids',
      debugShowCheckedModeBanner: false,
      home: StudentBook(),
    );
  }
}

class StudentBook extends StatefulWidget {
  const StudentBook({super.key});

  @override
  State<StudentBook> createState() => _StudentBookState();
}

class _StudentBookState extends State<StudentBook> {
  static const platform = MethodChannel('id.speakids/navigation');
  bool handlingBack = false;

  Future<void> handleBack(bool popped, Object? result) async {
    if (popped || handlingBack) return;
    handlingBack = true;
    try {
      final handled = await platform.invokeMethod<bool>('back') ?? false;
      if (!handled && mounted) await SystemNavigator.pop();
    } finally {
      handlingBack = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope<Object?>(
      canPop: false,
      onPopInvokedWithResult: handleBack,
      child: const Scaffold(
        backgroundColor: Color(0xFFE1D4FB),
        body: SafeArea(
          child: AndroidView(
            viewType: 'id.speakids/book',
            creationParams: {
              'pronunciationUrl': String.fromEnvironment(
                'PRONUNCIATION_API_URL',
              ),
            },
            creationParamsCodec: StandardMessageCodec(),
          ),
        ),
      ),
    );
  }
}
