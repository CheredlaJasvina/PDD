import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class DashboardScreen extends StatefulWidget {
  final List<dynamic> inventory;
  final Map<String, dynamic> preferences;
  final Function(String, String) onUpdateState;
  final Function(String, {String? status}) onNavigate;
  final String backendUrl;

  const DashboardScreen({
    super.key,
    required this.inventory,
    required this.preferences,
    required this.onUpdateState,
    required this.onNavigate,
    required this.backendUrl,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _waste;
  final Set<String> _dismissed = {};

  @override
  void initState() {
    super.initState();
    _fetchWaste();
  }

  Future<void> _fetchWaste() async {
    try {
      final email = widget.preferences['email'] as String? ?? '';
      final res = await http.get(Uri.parse('${widget.backendUrl}/waste-summary'),
          headers: {'x-user-email': email}).timeout(const Duration(seconds: 6));
      final d = jsonDecode(res.body) as Map<String, dynamic>;
      if (d['success'] == true && mounted) setState(() => _waste = d);
    } catch (_) {}
  }

  int _pct(dynamic item) {
    try {
      final added  = DateTime.parse(item['addedDate']);
      final spoil  = DateTime.parse(item['predictedSpoilageDate']);
      final orig   = (item['originalFreshness'] as num).toDouble();
      final total  = spoil.difference(added).inSeconds;
      final el     = DateTime.now().difference(added).inSeconds;
      if (total <= 0) return 0;
      if (el >= total) return 0;
      return (orig * (1.0 - el / total)).round().clamp(0, 100);
    } catch (_) { return (item['originalFreshness'] as num? ?? 85).toInt(); }
  }

  int _days(dynamic item) {
    try { return DateTime.parse(item['predictedSpoilageDate']).difference(DateTime.now()).inDays.clamp(0, 9999); }
    catch (_) { return 0; }
  }

  List<Map<String, dynamic>> _alerts() {
    final active = widget.inventory.where((i) => i['state'] == 'Tracked').toList();
    final List<Map<String, dynamic>> out = [];
    for (final item in active) {
      final id   = item['_id'] as String;
      if (_dismissed.contains(id)) continue;
      final pct  = _pct(item);
      final days = _days(item);
      final added = DateTime.tryParse(item['addedDate'] as String? ?? '') ?? DateTime.now();
      final since = DateTime.now().difference(added).inDays;
      final name  = item['name'] as String? ?? 'Item';
      final status= item['status'] as String? ?? 'Fresh';
      if (status == 'Spoiled' || pct <= 50 || days <= 0) {
        out.add({'id': id, 'name': name, 'type': 'critical', 'isSpoiled': true,
          'msg': '"$name" is spoiled (freshness $pct%). Avoid consumption!'});
      } else if (since >= 2) {
        out.add({'id': id, 'name': name, 'type': 'critical', 'isSpoiled': false,
          'msg': '"$name" will become spoiled today, use it before!'});
      } else if (days == 1) {
        out.add({'id': id, 'name': name, 'type': 'urgent', 'isSpoiled': false,
          'msg': '"$name" spoils in 1 day — use it today!'});
      } else if (days == 2) {
        out.add({'id': id, 'name': name, 'type': 'warning', 'isSpoiled': false,
          'msg': '"$name" will spoil in 2 days. Plan to use it soon.'});
      }
    }
    return out;
  }

  Color _aborder(String t) => t == 'critical' ? const Color(0xFFFF1744) : t == 'urgent' ? const Color(0xFFFF9100) : const Color(0xFFFFEA00);
  Color _abg(String t)     => _aborder(t).withOpacity(0.06);
  String _aicon(String t)  => t == 'critical' ? '🔴' : t == 'urgent' ? '🟠' : '🟡';

  @override
  Widget build(BuildContext context) {
    final active  = widget.inventory.where((i) => i['state'] == 'Tracked').toList();
    final fresh   = active.where((i) => i['status'] == 'Fresh').length;
    final warn    = active.where((i) => i['status'] == 'Slightly Spoiled').length;
    final spoiled = active.where((i) => i['status'] == 'Spoiled').length;
    final alerts  = _alerts();

    final weekCt   = _waste?['weeklyWastedCount'] ?? 0;
    final monthCt  = _waste?['monthlyWastedCount'] ?? 0;
    final weekItems= (_waste?['weeklyWastedItems'] as List?) ?? [];
    final advice   = (_waste?['buyAdvice'] as List?) ?? [];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

        // ── HEADER ──
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Smart Freshness Dashboard', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
            const SizedBox(height: 2),
            Text('AI-powered shelf-life & wastage prevention',
                style: TextStyle(color: Colors.grey.shade400, fontSize: 11)),
          ])),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF00E676).withOpacity(0.08),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF00E676).withOpacity(0.2)),
            ),
            child: Column(children: [
              Text('${widget.preferences['healthScore'] ?? 100}',
                  style: const TextStyle(color: Color(0xFF00E676), fontWeight: FontWeight.w900, fontSize: 18)),
              const Text('Health\nScore', style: TextStyle(color: Colors.grey, fontSize: 8), textAlign: TextAlign.center),
            ]),
          ),
        ]),
        const SizedBox(height: 4),
        if ((widget.preferences['streakCount'] ?? 0) > 0)
          Text('🔥 Streak: ${widget.preferences['streakCount']} days',
              style: const TextStyle(color: Colors.orange, fontSize: 12, fontWeight: FontWeight.bold)),
        const SizedBox(height: 20),

        // ── SPOILAGE ALERTS ──
        if (alerts.isNotEmpty) ...[
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFFFF1744).withOpacity(0.04),
              borderRadius: BorderRadius.circular(16),
              border: Border(
                left: const BorderSide(color: Color(0xFFFF1744), width: 4),
                top: BorderSide(color: Colors.white.withOpacity(0.06)),
                right: BorderSide(color: Colors.white.withOpacity(0.06)),
                bottom: BorderSide(color: Colors.white.withOpacity(0.06)),
              ),
            ),
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.only(bottom: 20),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('🚨 Active Spoilage Notifications (${alerts.length})',
                  style: const TextStyle(color: Color(0xFFFF1744), fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 6),
              const Text('Mark Used (consumed – no waste) or Not Used (counts toward waste).',
                  style: TextStyle(color: Colors.grey, fontSize: 10, height: 1.4)),
              const SizedBox(height: 12),
              ...alerts.map((a) => _alertRow(a)),
            ]),
          ),
        ],

        // ── METRIC TILES ──
        Row(children: [
          Expanded(child: GestureDetector(onTap: () => widget.onNavigate('inventory', status: 'Fresh'),
            child: _metricTile('FRESH', fresh, const Color(0xFF00E676), 'Optimal storage'))),
          const SizedBox(width: 10),
          Expanded(child: GestureDetector(onTap: () => widget.onNavigate('inventory', status: 'Warning'),
            child: _metricTile('WARNING', warn, const Color(0xFFFFEA00), 'Nearing decay'))),
          const SizedBox(width: 10),
          Expanded(child: GestureDetector(onTap: () => widget.onNavigate('inventory', status: 'Spoiled'),
            child: _metricTile('SPOILED', spoiled, const Color(0xFFFF1744), 'Safety check'))),
        ]),
        const SizedBox(height: 24),

        // ── WASTE REPORT WIDGET ──
        GestureDetector(
          onTap: () => widget.onNavigate('analytics'),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.02),
              borderRadius: BorderRadius.circular(16),
              border: Border(
                left: const BorderSide(color: Color(0xFFFF1744), width: 4),
                top: BorderSide(color: Colors.white.withOpacity(0.06)),
                right: BorderSide(color: Colors.white.withOpacity(0.06)),
                bottom: BorderSide(color: Colors.white.withOpacity(0.06)),
              ),
            ),
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.only(bottom: 20),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('🗑️ Waste Report This Week', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: _statBox('$weekCt', 'WASTED\nTHIS WEEK', const Color(0xFFFF1744))),
                const SizedBox(width: 10),
                Expanded(child: _statBox('$monthCt', 'WASTED\nTHIS MONTH', const Color(0xFFFF9100))),
              ]),
              const SizedBox(height: 12),
              if (weekItems.isEmpty)
                _greenRow('🎉 Zero waste this week! Outstanding.')
              else ...[
                const Text('Items wasted this week:', style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                ...weekItems.take(3).map((it) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text('🗑️ ${it["name"]}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500)),
                    Text(it['category'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 10)),
                  ]),
                )),
              ],
              if (advice.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFEA00).withOpacity(0.04),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFFFEA00).withOpacity(0.15)),
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('📦 Buy-less Advice:', style: TextStyle(color: Color(0xFFFFEA00), fontWeight: FontWeight.bold, fontSize: 11)),
                    const SizedBox(height: 4),
                    ...advice.take(2).map((a) => Text('• ${a["advice"] ?? ""}',
                        style: const TextStyle(color: Colors.grey, fontSize: 10, height: 1.4))),
                  ]),
                ),
              ],
              const SizedBox(height: 10),
              const Text('View Full Waste Report →', style: TextStyle(color: Color(0xFF00E676), fontSize: 11, fontWeight: FontWeight.bold)),
            ]),
          ),
        ),

        // ── INVENTORY LIST ──
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text('Real-Time Inventory Status', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          Row(children: [
            TextButton(onPressed: () => widget.onNavigate('inventory'),
                child: Text('View All (${active.length})', style: const TextStyle(color: Color(0xFF00E676), fontSize: 11))),
            const SizedBox(width: 4),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                minimumSize: Size.zero, textStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
              ),
              onPressed: () => widget.onNavigate('scanner'),
              child: const Text('+ Scan'),
            ),
          ]),
        ]),
        const SizedBox(height: 10),
        if (active.isEmpty)
          Center(child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 32),
            child: Column(children: [
              const Text('Your inventory is currently empty.', style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 12),
              ElevatedButton(onPressed: () => widget.onNavigate('scanner'),
                  child: const Text('Scan your first item')),
            ]),
          ))
        else
          ...active.take(5).map((item) => _inventoryCard(item)),

        // ── WEEKLY SCAN SUMMARY ──
        const SizedBox(height: 20),
        _weeklySummary(active),
      ]),
    );
  }

  Widget _alertRow(Map<String, dynamic> a) {
    final type     = a['type'] as String;
    final id       = a['id'] as String;
    final isSpoiled= a['isSpoiled'] as bool;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: _abg(type), borderRadius: BorderRadius.circular(10),
          border: Border.all(color: _aborder(type).withOpacity(0.4))),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(child: Text('${_aicon(type)} ${a["msg"]}',
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, height: 1.4))),
        const SizedBox(width: 8),
        if (!isSpoiled) Column(children: [
          _smallBtn('✅ Used', const Color(0xFF00E676), Colors.black, () {
            setState(() => _dismissed.add(id));
            widget.onUpdateState(id, 'Used');
          }),
          const SizedBox(height: 4),
          _smallBtn('🗑️ Not Used', const Color(0xFFFF1744).withOpacity(0.1), const Color(0xFFFF1744), () {
            setState(() => _dismissed.add(id));
            widget.onUpdateState(id, 'Wasted');
          }),
        ]) else
          const Text('⚠️ Discard', style: TextStyle(color: Color(0xFFFF1744), fontSize: 10, fontWeight: FontWeight.bold)),
      ]),
    );
  }

  Widget _smallBtn(String label, Color bg, Color fg, VoidCallback onTap) =>
    ElevatedButton(
      style: ElevatedButton.styleFrom(backgroundColor: bg, foregroundColor: fg,
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), minimumSize: Size.zero,
          textStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
          side: bg.opacity < 0.5 ? BorderSide(color: fg.withOpacity(0.5)) : BorderSide.none),
      onPressed: onTap, child: Text(label),
    );

  Widget _metricTile(String label, int count, Color color, String sub) =>
    Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(12),
        border: Border(left: BorderSide(color: color, width: 3),
          top: BorderSide(color: Colors.white.withOpacity(0.05)),
          right: BorderSide(color: Colors.white.withOpacity(0.05)),
          bottom: BorderSide(color: Colors.white.withOpacity(0.05)),
        ),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)),
        const SizedBox(height: 6),
        Text('$count', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: color)),
        const SizedBox(height: 2),
        Text(sub, style: const TextStyle(fontSize: 9, color: Colors.grey)),
      ]),
    );

  Widget _statBox(String val, String label, Color color) =>
    Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: color.withOpacity(0.06), borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withOpacity(0.15))),
      child: Column(children: [
        Text(val, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: color)),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 9), textAlign: TextAlign.center),
      ]),
    );

  Widget _greenRow(String msg) =>
    Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: const Color(0xFF00E676).withOpacity(0.05), borderRadius: BorderRadius.circular(8)),
      child: Row(children: [
        const Icon(Icons.check_circle_outline, color: Color(0xFF00E676), size: 14), const SizedBox(width: 6),
        Expanded(child: Text(msg, style: const TextStyle(color: Color(0xFF00E676), fontSize: 11, fontWeight: FontWeight.bold))),
      ]),
    );

  Widget _inventoryCard(dynamic item) {
    final pct  = _pct(item);
    final days = _days(item);
    final statusColor = pct > 70 ? const Color(0xFF00E676) : pct > 30 ? const Color(0xFFFFEA00) : const Color(0xFFFF1744);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.05))),
      child: Column(children: [
        Row(children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(item['imageUrl'] as String? ?? '',
              width: 48, height: 48, fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                width: 48, height: 48,
                decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.fastfood, color: Color(0xFF00E676)),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(item['name'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            Text('${item["category"]} • ${item["isCooked"] == true ? "Cooked" : "Raw"} • ${item["nutrition"]?["calories"] ?? 0} kcal',
                style: const TextStyle(color: Colors.grey, fontSize: 10)),
          ])),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: statusColor.withOpacity(0.3))),
              child: Text('${item["status"]} ($pct%)',
                  style: TextStyle(color: statusColor, fontSize: 9, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 4),
            Text('${days}d left', style: TextStyle(color: statusColor.withOpacity(0.7), fontSize: 10)),
          ]),
        ]),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(3),
          child: LinearProgressIndicator(value: pct / 100.0, backgroundColor: Colors.white12,
              color: statusColor, minHeight: 5),
        ),
      ]),
    );
  }

  Widget _weeklySummary(List active) {
    const healthyCats = ['fruits', 'vegetables', 'non-veg'];
    final hCount = active.where((i) => healthyCats.contains(i['category'])).length;
    final pCount = active.length - hCount;
    final hPct   = active.isEmpty ? 0 : (hCount / active.length * 100).round();
    final String label;
    final Color  labelColor;
    if (hPct >= 70) { label = '⭐ Outstanding'; labelColor = const Color(0xFF00E676); }
    else if (hPct >= 50) { label = '👍 Good Balance'; labelColor = const Color(0xFFFFEA00); }
    else { label = '⚠️ Too Much Processed'; labelColor = const Color(0xFFFF1744); }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.05))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Weekly Scan Summary', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 12),
        Row(children: [
          Text(label, style: TextStyle(color: labelColor, fontWeight: FontWeight.bold, fontSize: 12)),
          const Spacer(),
          Text('$hCount healthy / $pCount processed', style: const TextStyle(color: Colors.grey, fontSize: 11)),
        ]),
        const SizedBox(height: 10),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: SizedBox(height: 8, child: Row(children: active.isEmpty
            ? [Expanded(child: Container(color: Colors.white12))]
            : [
                if (hCount > 0) Expanded(flex: hCount, child: Container(color: const Color(0xFF00E676))),
                if (pCount > 0) Expanded(flex: pCount, child: Container(color: const Color(0xFF9C27B0))),
              ],
          )),
        ),
        const SizedBox(height: 8),
        Row(children: [
          _dot(const Color(0xFF00E676)), const SizedBox(width: 4),
          Text('Healthy ($hPct%)', style: const TextStyle(fontSize: 10, color: Colors.grey)),
          const SizedBox(width: 14),
          _dot(const Color(0xFF9C27B0)), const SizedBox(width: 4),
          Text('Processed (${100 - hPct}%)', style: const TextStyle(fontSize: 10, color: Colors.grey)),
        ]),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: () => widget.onNavigate('analytics'),
          child: const Text('Open Detailed Analytics →', style: TextStyle(color: Color(0xFF00E676), fontSize: 11, fontWeight: FontWeight.bold)),
        ),
      ]),
    );
  }

  Widget _dot(Color color) => Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle));
}
