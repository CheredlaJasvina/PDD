import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class AnalyticsScreen extends StatefulWidget {
  final String backendUrl;
  final String email;
  final List<dynamic> inventory;

  const AnalyticsScreen({
    super.key,
    required this.backendUrl,
    required this.email,
    required this.inventory,
  });

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  Map<String, dynamic>? _analytics;
  Map<String, dynamic>? _waste;
  bool _loading = true;
  String _view = 'weekly';
  DateTime _calDate = DateTime.now();

  @override
  void initState() { super.initState(); _fetch(); }

  @override
  void didUpdateWidget(covariant AnalyticsScreen old) {
    super.didUpdateWidget(old);
    if (widget.inventory.length != old.inventory.length) _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _loading = true);
    try {
      final h = {'x-user-email': widget.email};
      final results = await Future.wait([
        http.get(Uri.parse('${widget.backendUrl}/analytics'), headers: h).timeout(const Duration(seconds: 6)),
        http.get(Uri.parse('${widget.backendUrl}/waste-summary'), headers: h).timeout(const Duration(seconds: 6)),
      ]);
      final a = jsonDecode(results[0].body) as Map<String, dynamic>;
      final w = jsonDecode(results[1].body) as Map<String, dynamic>;
      if (mounted) setState(() {
        if (a['success'] == true) _analytics = a;
        if (w['success'] == true) _waste = w;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() {
        _waste = {
          'weeklyWastedCount': 1, 'monthlyWastedCount': 2,
          'weeklyWastedItems': [{'name': 'Leftover Pizza', 'category': 'cooked food'}],
          'monthlyWastedItems': [{'name': 'Leftover Pizza', 'category': 'cooked food'}, {'name': 'Old Milk', 'category': 'packaged food'}],
          'buyAdvice': [{'advice': 'You wasted Leftover Pizza 1 time. Try buying only 1 unit at a time.'}],
          'membersCount': 2,
        };
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: Color(0xFF00E676)));
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text('Analytics & Waste Report', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          IconButton(icon: const Icon(Icons.refresh, color: Color(0xFF00E676)), onPressed: _fetch),
        ]),
        const Text('Track consumption vs wastage and get smart buy-less advice.',
            style: TextStyle(color: Colors.grey, fontSize: 12)),
        const SizedBox(height: 20),
        _buildWaste(),
        const SizedBox(height: 20),
        if (_analytics != null) ...[_buildBarChart(), const SizedBox(height: 20)],
        if (_analytics != null) ...[_buildDonut(), const SizedBox(height: 20)],
        if (_analytics != null) ...[_buildCalendar(), const SizedBox(height: 20)],
        if (_analytics != null) _buildRecs(),
      ]),
    );
  }

  // ── Waste Report ──────────────────────────────────────────────────────────
  Widget _buildWaste() {
    final ws      = _waste;
    final weekCt  = ws?['weeklyWastedCount'] ?? 0;
    final monthCt = ws?['monthlyWastedCount'] ?? 0;
    final members = ws?['membersCount'] ?? 2;
    final items   = (_view == 'weekly' ? (ws?['weeklyWastedItems'] as List?) : (ws?['monthlyWastedItems'] as List?)) ?? [];
    final advice  = (ws?['buyAdvice'] as List?) ?? [];
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFFFF1744).withOpacity(0.03), borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFFF1744).withOpacity(0.2))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text('🗑️ Food Waste Report', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          Row(children: [
            _pill('Week',  _view == 'weekly',  () => setState(() => _view = 'weekly')),
            const SizedBox(width: 6),
            _pill('Month', _view == 'monthly', () => setState(() => _view = 'monthly')),
          ]),
        ]),
        const SizedBox(height: 14),
        Row(children: [
          Expanded(child: _sbox('${_view == "weekly" ? weekCt : monthCt}',
              _view == 'weekly' ? 'WASTED\nTHIS WEEK' : 'WASTED\nTHIS MONTH', const Color(0xFFFF1744))),
          const SizedBox(width: 10),
          Expanded(child: _sbox('$members', 'HOUSEHOLD\nMEMBERS', const Color(0xFF00E676))),
        ]),
        const SizedBox(height: 14),
        if (items.isEmpty)
          _greenBanner('🎉 Zero waste this ${_view == "weekly" ? "week" : "month"}! Outstanding.')
        else ...[
          Text('Items wasted (last ${_view == "weekly" ? "7" : "30"} days):',
              style: const TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          ...items.map((it) => Container(
            margin: const EdgeInsets.only(bottom: 4),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
            decoration: BoxDecoration(color: const Color(0xFFFF1744).withOpacity(0.04), borderRadius: BorderRadius.circular(6)),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('🗑️ ${it["name"]}', style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12)),
              Text(it['category'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 10)),
            ]),
          )),
        ],
        if (advice.isNotEmpty) ...[
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: const Color(0xFFFFEA00).withOpacity(0.04), borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFFEA00).withOpacity(0.15))),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('🛒 Buy Less — for $members member${members > 1 ? "s" : ""}:',
                  style: const TextStyle(color: Color(0xFFFFEA00), fontWeight: FontWeight.bold, fontSize: 12)),
              const SizedBox(height: 8),
              ...advice.map((a) => Padding(
                padding: const EdgeInsets.only(bottom: 5),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('📦 ', style: TextStyle(fontSize: 12)),
                  Expanded(child: Text(a['advice'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 11, height: 1.4))),
                ]),
              )),
            ]),
          ),
        ],
      ]),
    );
  }

  // ── Bar Chart ─────────────────────────────────────────────────────────────
  Widget _buildBarChart() {
    final days     = (_analytics!['weeklyReport']['days'] as List?) ?? ['M','T','W','T','F','S','S'];
    final consumed = (_analytics!['weeklyReport']['consumed'] as List?)?.map((e) => (e as num).toInt()).toList() ?? List.filled(7, 0);
    final wasted   = (_analytics!['weeklyReport']['wasted']   as List?)?.map((e) => (e as num).toInt()).toList() ?? List.filled(7, 0);
    final maxVal   = [...consumed, ...wasted, 1].reduce(math.max).toDouble();
    return _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Weekly Consumption vs Wastage', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
      const SizedBox(height: 16),
      SizedBox(height: 100, child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: List.generate(7, (i) {
          final c = i < consumed.length ? consumed[i] : 0;
          final w = i < wasted.length   ? wasted[i]   : 0;
          return Expanded(child: Column(mainAxisAlignment: MainAxisAlignment.end, children: [
            Row(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
              Container(width: 7, height: (c / maxVal * 72).clamp(2.0, 72.0), color: const Color(0xFF00E676), margin: const EdgeInsets.only(right: 2)),
              Container(width: 7, height: (w / maxVal * 72).clamp(2.0, 72.0), color: const Color(0xFFFF1744)),
            ]),
            const SizedBox(height: 4),
            Text(i < days.length ? days[i].toString() : '', style: const TextStyle(fontSize: 9, color: Colors.grey)),
          ]));
        }),
      )),
      const SizedBox(height: 10),
      const Row(children: [
        Icon(Icons.square, color: Color(0xFF00E676), size: 10), SizedBox(width: 4),
        Text('Consumed', style: TextStyle(fontSize: 10, color: Colors.grey)), SizedBox(width: 16),
        Icon(Icons.square, color: Color(0xFFFF1744), size: 10), SizedBox(width: 4),
        Text('Wasted', style: TextStyle(fontSize: 10, color: Colors.grey)),
      ]),
    ]));
  }

  // ── Donut Chart ───────────────────────────────────────────────────────────
  Widget _buildDonut() {
    final r = _analytics!['nutritionalRatio'] as Map<String, dynamic>? ?? {};
    final hPct  = (r['healthyPercentage'] as num? ?? 70).toDouble();
    final hCt   = r['healthyCount'] ?? 0;
    final jCt   = r['junkCount']    ?? 0;
    final total = (hCt + jCt) as int;
    return _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Healthy Produce vs Packaged Junk', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
      const SizedBox(height: 16),
      Row(children: [
        SizedBox(width: 100, height: 100, child: CustomPaint(
          painter: _DonutPainter(hPct / 100.0),
          child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text('${hPct.round()}%', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF00E676))),
            const Text('HEALTHY', style: TextStyle(fontSize: 8, color: Colors.grey)),
          ])),
        )),
        const SizedBox(width: 20),
        Expanded(child: Column(children: [
          _barRow('Fresh Produce', hCt, total, const Color(0xFF00E676)),
          const SizedBox(height: 8),
          _barRow('Processed & Packaged', jCt, total, const Color(0xFF9C27B0)),
        ])),
      ]),
    ]));
  }

  Widget _barRow(String label, int val, int total, Color color) {
    final pct = total == 0 ? 0.0 : val / total;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
        Text('$val scans', style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.bold)),
      ]),
      const SizedBox(height: 4),
      ClipRRect(borderRadius: BorderRadius.circular(3),
          child: LinearProgressIndicator(value: pct, backgroundColor: Colors.white12, color: color, minHeight: 6)),
    ]);
  }

  // ── Calendar ──────────────────────────────────────────────────────────────
  Widget _buildCalendar() {
    final events  = (_analytics?['calendarEvents'] as List?) ?? [];
    final year    = _calDate.year;
    final month   = _calDate.month;
    final first   = DateTime(year, month, 1);
    final daysIn  = DateTime(year, month + 1, 0).day;
    final offset  = first.weekday % 7;
    final Map<int, Set<String>> eMap = {};
    for (final e in events) {
      try {
        final d = DateTime.parse(e['date'] as String);
        if (d.year == year && d.month == month) {
          eMap.putIfAbsent(d.day, () => {});
          eMap[d.day]!.add(e['type'] as String? ?? 'scan');
        }
      } catch (_) {}
    }
    return _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        const Text('Consumption History Calendar', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        Row(children: [
          IconButton(icon: const Icon(Icons.chevron_left, size: 20),
              onPressed: () => setState(() => _calDate = DateTime(year, month - 1)),
              padding: EdgeInsets.zero, constraints: const BoxConstraints()),
          Text('${_mn(month)} $year', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
          IconButton(icon: const Icon(Icons.chevron_right, size: 20),
              onPressed: () => setState(() => _calDate = DateTime(year, month + 1)),
              padding: EdgeInsets.zero, constraints: const BoxConstraints()),
        ]),
      ]),
      const SizedBox(height: 12),
      Row(children: ['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) =>
        Expanded(child: Center(child: Text(d, style: const TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold))))).toList()),
      const SizedBox(height: 6),
      GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 7, mainAxisSpacing: 3, crossAxisSpacing: 3),
        itemCount: offset + daysIn,
        itemBuilder: (ctx, idx) {
          if (idx < offset) return const SizedBox();
          final day    = idx - offset + 1;
          final today  = day == DateTime.now().day && month == DateTime.now().month && year == DateTime.now().year;
          final dayEv  = eMap[day] ?? {};
          return Container(
            decoration: BoxDecoration(
              color: today ? const Color(0xFF00E676).withOpacity(0.12) : Colors.white.withOpacity(0.03),
              borderRadius: BorderRadius.circular(6),
              border: today ? Border.all(color: const Color(0xFF00E676).withOpacity(0.4)) : null,
            ),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Text('$day', style: TextStyle(fontSize: 10, color: today ? const Color(0xFF00E676) : Colors.white70)),
              if (dayEv.isNotEmpty) ...[
                const SizedBox(height: 2),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: dayEv.take(2).map((type) {
                  final c = type == 'waste' ? const Color(0xFFFF1744) : type == 'consumed' ? const Color(0xFFFFEA00) : const Color(0xFF00E676);
                  return Container(width: 4, height: 4, margin: const EdgeInsets.only(right: 1),
                      decoration: BoxDecoration(color: c, shape: BoxShape.circle));
                }).toList()),
              ],
            ]),
          );
        },
      ),
      const SizedBox(height: 10),
      Row(children: [
        _dot(const Color(0xFF00E676)), const SizedBox(width: 4), const Text('Scanned', style: TextStyle(fontSize: 9, color: Colors.grey)), const SizedBox(width: 10),
        _dot(const Color(0xFFFF1744)), const SizedBox(width: 4), const Text('Wasted',  style: TextStyle(fontSize: 9, color: Colors.grey)), const SizedBox(width: 10),
        _dot(const Color(0xFFFFEA00)), const SizedBox(width: 4), const Text('Consumed',style: TextStyle(fontSize: 9, color: Colors.grey)),
      ]),
    ]));
  }

  // ── Recommendations ───────────────────────────────────────────────────────
  Widget _buildRecs() {
    final recs = (_analytics?['buyingRecommendations'] as List?) ?? [];
    if (recs.isEmpty) return const SizedBox();
    return _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('💡 Smart Buying Recommendations', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
      const SizedBox(height: 10),
      ...recs.map((r) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('• ', style: TextStyle(color: Color(0xFFFFEA00), fontWeight: FontWeight.bold)),
          Expanded(child: Text(r.toString(), style: const TextStyle(color: Colors.grey, fontSize: 12, height: 1.4))),
        ]),
      )),
    ]));
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  Widget _pill(String label, bool active, VoidCallback onTap) =>
    GestureDetector(onTap: onTap, child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: active ? const Color(0xFF00E676).withOpacity(0.15) : Colors.transparent,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: active ? const Color(0xFF00E676) : Colors.white24),
      ),
      child: Text(label, style: TextStyle(fontSize: 11, color: active ? const Color(0xFF00E676) : Colors.grey, fontWeight: FontWeight.bold)),
    ));

  Widget _sbox(String val, String label, Color color) =>
    Container(padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: color.withOpacity(0.06), borderRadius: BorderRadius.circular(10)),
      child: Column(children: [
        Text(val, style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: color)),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 9), textAlign: TextAlign.center),
      ]));

  Widget _greenBanner(String msg) =>
    Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: const Color(0xFF00E676).withOpacity(0.05), borderRadius: BorderRadius.circular(8)),
      child: Row(children: [const Icon(Icons.check_circle_outline, color: Color(0xFF00E676), size: 16), const SizedBox(width: 8),
        Expanded(child: Text(msg, style: const TextStyle(color: Color(0xFF00E676), fontWeight: FontWeight.w600, fontSize: 12)))]));

  Widget _card({required Widget child}) =>
    Container(width: double.infinity, padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.015), borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.06))),
      child: child);

  Widget _dot(Color color) => Container(width: 7, height: 7, decoration: BoxDecoration(color: color, shape: BoxShape.circle));
  String _mn(int m) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1];
}

class _DonutPainter extends CustomPainter {
  final double fraction;
  const _DonutPainter(this.fraction);
  @override
  void paint(Canvas canvas, Size size) {
    final c = Offset(size.width / 2, size.height / 2);
    final r = math.min(size.width, size.height) / 2;
    const sw = 12.0;
    canvas.drawCircle(c, r - sw / 2, Paint()..color = Colors.white12..style = PaintingStyle.stroke..strokeWidth = sw);
    final rect  = Rect.fromCircle(center: c, radius: r - sw / 2);
    final sweep = 2 * math.pi * fraction;
    canvas.drawArc(rect, -math.pi / 2, sweep, false,
        Paint()..color = const Color(0xFF00E676)..style = PaintingStyle.stroke..strokeWidth = sw..strokeCap = StrokeCap.round);
    if (fraction < 1.0)
      canvas.drawArc(rect, -math.pi / 2 + sweep, 2 * math.pi * (1 - fraction), false,
          Paint()..color = const Color(0xFF9C27B0)..style = PaintingStyle.stroke..strokeWidth = sw..strokeCap = StrokeCap.round);
  }
  @override bool shouldRepaint(covariant _DonutPainter old) => old.fraction != fraction;
}
