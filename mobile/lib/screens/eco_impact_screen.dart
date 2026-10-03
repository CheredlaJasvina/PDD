import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class EcoImpactScreen extends StatefulWidget {
  final String backendUrl;
  final String email;

  const EcoImpactScreen({
    super.key,
    required this.backendUrl,
    required this.email,
  });

  @override
  State<EcoImpactScreen> createState() => _EcoImpactScreenState();
}

class _EcoImpactScreenState extends State<EcoImpactScreen> {
  Map<String, dynamic>? _metrics;
  bool _loading = true;

  static const _fallback = [
    {'title': 'CO2 Savior 🌿',     'desc': 'Save 5 kg of CO2 by not wasting food.',      'unlocked': false},
    {'title': 'Zero Waste Hero 💎', 'desc': 'Complete a full week with zero food waste.', 'unlocked': false},
    {'title': 'Green Shopper 🛒',   'desc': 'Follow buy-less advice for 2 weeks.',        'unlocked': false},
  ];

  @override
  void initState() { super.initState(); _fetch(); }

  Future<void> _fetch() async {
    setState(() => _loading = true);
    try {
      final res = await http.get(Uri.parse('${widget.backendUrl}/eco'),
          headers: {'x-user-email': widget.email}).timeout(const Duration(seconds: 6));
      final d = jsonDecode(res.body) as Map<String, dynamic>;
      if (mounted && d['success'] == true) setState(() { _metrics = d; _loading = false; });
      else if (mounted) setState(() => _loading = false);
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: Color(0xFF00E676)));
    final milestones  = (_metrics?['ecoMilestones'] as List?) ?? _fallback;
    final co2         = (_metrics?['co2SavedKg']   as num?)?.toDouble() ?? 0.0;
    final money       = (_metrics?['moneySaved']   as num?)?.toDouble() ?? 0.0;
    final foodLevel   = _metrics?['foodHealthLevel'] as String? ?? 'Moderate';
    final comparison  = _metrics?['comparisonStats'] as Map<String, dynamic>?;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('🌿 Eco & Carbon Tracker', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const Text('Track your environmental impact from food choices.', style: TextStyle(color: Colors.grey, fontSize: 12)),
        const SizedBox(height: 20),

        // CO2 + Money stats
        Row(children: [
          Expanded(child: _statCard('🌱', 'CO2 Saved', '${co2.toStringAsFixed(1)} kg', const Color(0xFF00E676))),
          const SizedBox(width: 12),
          Expanded(child: _statCard('💰', 'Money Saved', '₹${money.toStringAsFixed(0)}', const Color(0xFFFFEA00))),
        ]),
        const SizedBox(height: 16),

        // Food health level
        _glass(Row(children: [
          const Text('🍽️', style: TextStyle(fontSize: 28)),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Food Health Level', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: const Color(0xFF00E676).withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
              child: Text(foodLevel, style: const TextStyle(color: Color(0xFF00E676), fontWeight: FontWeight.bold, fontSize: 12)),
            ),
          ])),
        ])),
        const SizedBox(height: 16),

        // Community comparison
        if (comparison != null) ...[
          _glass(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('📊 Community Comparison', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Community avg waste', style: TextStyle(color: Colors.grey, fontSize: 11)),
                Text('${comparison["communityAvgKg"] ?? 0} kg/week',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFFFF1744))),
              ])),
              const SizedBox(width: 16),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Your saving vs avg', style: TextStyle(color: Colors.grey, fontSize: 11)),
                Text('${comparison["userSavingPct"] ?? 0}% better',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF00E676))),
              ])),
            ]),
          ])),
          const SizedBox(height: 16),
        ],

        // Milestones
        _glass(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('🏆 Eco-Impact Milestones', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 12),
          ...milestones.map((m) {
            final unlocked = m['unlocked'] as bool? ?? false;
            return Opacity(
              opacity: unlocked ? 1.0 : 0.45,
              child: Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: unlocked ? const Color(0xFF00E676).withOpacity(0.06) : Colors.white.withOpacity(0.02),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: unlocked ? const Color(0xFF00E676).withOpacity(0.2) : Colors.white12),
                ),
                child: Row(children: [
                  Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(
                      color: unlocked ? const Color(0xFF00E676).withOpacity(0.15) : Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(child: Text(unlocked ? '🔓' : '🔒', style: const TextStyle(fontSize: 18))),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(m['title'] as String? ?? '',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13,
                            color: unlocked ? const Color(0xFF00E676) : Colors.white70)),
                    const SizedBox(height: 3),
                    Text(m['desc'] as String? ?? '', style: const TextStyle(color: Colors.grey, fontSize: 11, height: 1.3)),
                  ])),
                ]),
              ),
            );
          }),
        ])),
        const SizedBox(height: 16),

        // Green pass card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Color(0xFF1B4332), Color(0xFF0B1E14)], begin: Alignment.topLeft, end: Alignment.bottomRight),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF00E676).withOpacity(0.3)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('🌿 FreshRadar Green Pass', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF00E676))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: const Color(0xFF00E676).withOpacity(0.2), borderRadius: BorderRadius.circular(6)),
                child: const Text('ACTIVE', style: TextStyle(color: Color(0xFF00E676), fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1)),
              ),
            ]),
            const SizedBox(height: 12),
            const Text('Waste Rating: EXCELLENT (A+)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white)),
            const SizedBox(height: 4),
            Text('CO2 Offset: ${co2.toStringAsFixed(1)} kg saved this month',
                style: const TextStyle(color: Colors.white70, fontSize: 12)),
            const SizedBox(height: 8),
            const Text('You are in the top 12% of FreshRadar users for sustainability.',
                style: TextStyle(color: Colors.grey, fontSize: 11, height: 1.4)),
          ]),
        ),
      ]),
    );
  }

  Widget _statCard(String emoji, String label, String value, Color color) =>
    _glass(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(emoji, style: const TextStyle(fontSize: 26)),
      const SizedBox(height: 8),
      Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: color)),
      Text(label, style: const TextStyle(color: Colors.grey, fontSize: 11)),
    ]));

  Widget _glass(Widget child) => Container(
    width: double.infinity, padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.06))),
    child: child,
  );
}
