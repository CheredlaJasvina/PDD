import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('Dashboard loads smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const FoodFreshnessApp());

    // Verify that the app logo/header text compiles and loads
    expect(find.textContaining('FreshnessAI'), findsWidgets);
  });
}
