import 'package:flutter_test/flutter_test.dart';
import 'package:speakids/main.dart';
import 'package:flutter/material.dart';

void main() {
  testWidgets('Flutter shell preserves theme and Android platform view', (
    tester,
  ) async {
    await tester.pumpWidget(const SpeaKids());
    expect(find.byType(StudentBook), findsOneWidget);
    expect(find.byType(AndroidView), findsOneWidget);
    final scaffold = tester.widget<Scaffold>(find.byType(Scaffold));
    expect(scaffold.backgroundColor, const Color(0xFFE1D4FB));
    final view = tester.widget<AndroidView>(find.byType(AndroidView));
    expect(view.creationParams, contains('pronunciationUrl'));
  });
}
