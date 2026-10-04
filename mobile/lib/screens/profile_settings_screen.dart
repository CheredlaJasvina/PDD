import 'package:flutter/material.dart';

class ProfileSettingsScreen extends StatefulWidget {
  final Map<String, dynamic> preferences;
  final Function(Map<String, dynamic>) onUpdatePreferences;
  final String theme;
  final Function(String) onThemeChange;

  const ProfileSettingsScreen({
    super.key,
    required this.preferences,
    required this.onUpdatePreferences,
    required this.theme,
    required this.onThemeChange,
  });

  @override
  State<ProfileSettingsScreen> createState() => _ProfileSettingsScreenState();
}

class _ProfileSettingsScreenState extends State<ProfileSettingsScreen> {
  final _nameCtrl = TextEditingController();

  static const _dietOptions = [
    {'key': 'vegetarian',  'label': 'Vegetarian 🥦'},
    {'key': 'vegan',       'label': 'Vegan 🌱'},
    {'key': 'gluten-free', 'label': 'Gluten-Free 🌾'},
    {'key': 'dairy-free',  'label': 'Dairy-Free 🥛'},
    {'key': 'keto',        'label': 'Keto 🥩'},
    {'key': 'jain',        'label': 'Jain 🧅'},
  ];

  static const _themes = [
    {'id': 'emerald-aurora', 'label': '🟢 Emerald Aurora'},
    {'id': 'neon-cyberpunk', 'label': '⚡ Neon Cyberpunk'},
    {'id': 'ocean-breeze',   'label': '🔵 Ocean Breeze'},
    {'id': 'sunset-glow',    'label': '🟠 Sunset Glow'},
    {'id': 'sakura-blossom', 'label': '🌸 Sakura Blossom'},
    {'id': 'light',          'label': '☀️ Light Mode'},
  ];

  static const _badges = [
    {'id': 'Fresh Starter',    'label': 'Fresh Starter 🚀',    'desc': 'Scanned your first item'},
    {'id': 'Waste Warrior',    'label': 'Waste Warrior 🛡️',   'desc': 'Zero waste for 1 week'},
    {'id': 'Streak Seeker',    'label': 'Streak Seeker ⚡',    'desc': '5-day tracking streak'},
    {'id': 'Consistency King', 'label': 'Consistency King 👑', 'desc': '7-day tracking streak'},
  ];

  @override
  void initState() {
    super.initState();
    _nameCtrl.text = widget.preferences['name'] as String? ?? '';
  }

  @override
  void dispose() { _nameCtrl.dispose(); super.dispose(); }

  void _toggleDiet(String key) {
    final List<String> cur = List<String>.from((widget.preferences['dietaryPreferences'] as List?)?.cast<String>() ?? []);
    if (cur.contains(key)) cur.remove(key); else cur.add(key);
    widget.onUpdatePreferences({'dietaryPreferences': cur});
  }

  @override
  Widget build(BuildContext context) {
    final List<String> prefs    = List<String>.from((widget.preferences['dietaryPreferences'] as List?)?.cast<String>() ?? []);
    final List<String> badges   = List<String>.from((widget.preferences['unlockedBadges'] as List?)?.cast<String>() ?? []);
    final healthScore  = widget.preferences['healthScore'] ?? 100;
    final streakCount  = widget.preferences['streakCount'] ?? 1;
    final membersCount = (widget.preferences['membersCount'] ?? 2) as int;
    final notif        = widget.preferences['notificationPref'] as Map? ?? {};
    final advDays      = (notif['advanceNoticeDays'] as num? ?? 2).toInt();
    final emailAlerts  = notif['emailAlerts'] as bool? ?? true;
    final inAppAlerts  = notif['inAppAlerts']  as bool? ?? true;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Dietary Profile & Settings', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 20),

        // ── HEALTH SCORE ──
        _card(Column(children: [
          const Text('Food Health Dashboard', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 10),
          Text('$healthScore', style: const TextStyle(fontSize: 56, fontWeight: FontWeight.w900, color: Color(0xFF00E676))),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(color: const Color(0xFF00E676).withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
            child: const Text('Level 3 Fresh Explorer', style: TextStyle(color: Color(0xFF00E676), fontSize: 11, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(height: 10),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            _chip('⚡ $streakCount Scans', const Color(0xFFFFEA00)),
            const SizedBox(width: 10),
            _chip('🏆 ${badges.length} Badges', const Color(0xFF00E676)),
          ]),
        ])),
        const SizedBox(height: 16),

        // ── PROFILE NAME ──
        _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Display Profile Name', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 10),
          TextField(
            controller: _nameCtrl,
            decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person_outline, size: 18), border: OutlineInputBorder()),
          ),
          const SizedBox(height: 10),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black, minimumSize: const Size(double.infinity, 44)),
            onPressed: () {
              widget.onUpdatePreferences({'name': _nameCtrl.text.trim()});
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile name updated')));
            },
            child: const Text('Update Profile', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ])),
        const SizedBox(height: 16),

        // ── DIETARY PREFS ──
        _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Dietary Constraints', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 8, crossAxisSpacing: 8, childAspectRatio: 3.2,
            children: _dietOptions.map((o) {
              final active = prefs.contains(o['key']);
              return GestureDetector(
                onTap: () => _toggleDiet(o['key']!),
                child: Container(
                  decoration: BoxDecoration(
                    color: active ? const Color(0xFF00E676).withOpacity(0.12) : Colors.white.withOpacity(0.03),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: active ? const Color(0xFF00E676) : Colors.white.withOpacity(0.1)),
                  ),
                  child: Center(child: Text(o['label']!, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold,
                      color: active ? const Color(0xFF00E676) : Colors.white70))),
                ),
              );
            }).toList(),
          ),
        ])),
        const SizedBox(height: 16),

        // ── NOTIFICATIONS ──
        _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Expiry Notifications Setup', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 12),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('👨‍👩‍👧 Household Members', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              Text('Used for recipe qty & buy-less advice.', style: TextStyle(color: Colors.grey, fontSize: 10)),
            ])),
            _stepper(membersCount, 1, 20, (v) => widget.onUpdatePreferences({'membersCount': v})),
          ]),
          const Divider(color: Colors.white12, height: 24),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('⏰ Advance Warning Notice', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              Text('Days before spoilage to notify.', style: TextStyle(color: Colors.grey, fontSize: 10)),
            ])),
            _stepper(advDays, 1, 7, (v) {
              final n = Map<String, dynamic>.from(notif);
              n['advanceNoticeDays'] = v;
              widget.onUpdatePreferences({'notificationPref': n});
            }),
          ]),
          const Divider(color: Colors.white12, height: 24),
          SwitchListTile(
            title: const Text('🔔 In-App Browser Alerts', style: TextStyle(fontSize: 13)),
            subtitle: const Text('Show alerts inside the app', style: TextStyle(color: Colors.grey, fontSize: 10)),
            value: inAppAlerts, activeColor: const Color(0xFF00E676), contentPadding: EdgeInsets.zero,
            onChanged: (v) {
              final n = Map<String, dynamic>.from(notif);
              n['inAppAlerts'] = v;
              widget.onUpdatePreferences({'notificationPref': n});
            },
          ),
          SwitchListTile(
            title: const Text('📧 Email Spoilage Alerts', style: TextStyle(fontSize: 13)),
            subtitle: const Text('Send spoilage warnings to email', style: TextStyle(color: Colors.grey, fontSize: 10)),
            value: emailAlerts, activeColor: const Color(0xFF00E676), contentPadding: EdgeInsets.zero,
            onChanged: (v) {
              final n = Map<String, dynamic>.from(notif);
              n['emailAlerts'] = v;
              widget.onUpdatePreferences({'notificationPref': n});
            },
          ),
        ])),
        const SizedBox(height: 16),

        // ── THEMES ──
        _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('App Theme & Aesthetics', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 12),
          ...List.generate((_themes.length / 2).ceil(), (row) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(children: List.generate(2, (col) {
              final idx = row * 2 + col;
              if (idx >= _themes.length) return const Expanded(child: SizedBox());
              final t      = _themes[idx];
              final active = widget.theme == t['id'];
              return Expanded(child: Padding(
                padding: EdgeInsets.only(right: col == 0 ? 6 : 0),
                child: GestureDetector(
                  onTap: () => widget.onThemeChange(t['id']!),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
                    decoration: BoxDecoration(
                      color: active ? const Color(0xFF00E676).withOpacity(0.12) : Colors.white.withOpacity(0.03),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: active ? const Color(0xFF00E676) : Colors.white.withOpacity(0.1)),
                    ),
                    child: Text(t['label']!, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold,
                        color: active ? const Color(0xFF00E676) : Colors.white70), textAlign: TextAlign.center),
                  ),
                ),
              ));
            })),
          )),
        ])),
        const SizedBox(height: 16),

        // ── BADGES ──
        _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Unlockable Achievements', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 12),
          ..._badges.map((b) {
            final unlocked = badges.contains(b['id']);
            return Opacity(
              opacity: unlocked ? 1.0 : 0.4,
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: unlocked ? const Color(0xFF00E676).withOpacity(0.06) : Colors.white.withOpacity(0.02),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: unlocked ? const Color(0xFF00E676).withOpacity(0.2) : Colors.white12),
                ),
                child: Row(children: [
                  Text(unlocked ? '🏅' : '🔒', style: const TextStyle(fontSize: 22)),
                  const SizedBox(width: 12),
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(b['label']!, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13,
                        color: unlocked ? const Color(0xFF00E676) : Colors.white70)),
                    Text(b['desc']!, style: const TextStyle(color: Colors.grey, fontSize: 10)),
                  ]),
                ]),
              ),
            );
          }),
        ])),
      ]),
    );
  }

  Widget _card(Widget child) => Container(
    width: double.infinity, padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.06))),
    child: child,
  );

  Widget _chip(String label, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
    decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withOpacity(0.2))),
    child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
  );

  Widget _stepper(int value, int min, int max, Function(int) onChange) => Row(mainAxisSize: MainAxisSize.min, children: [
    IconButton(icon: const Icon(Icons.remove_circle_outline, color: Color(0xFF00E676), size: 20),
        onPressed: value > min ? () => onChange(value - 1) : null, padding: EdgeInsets.zero, constraints: const BoxConstraints()),
    Padding(padding: const EdgeInsets.symmetric(horizontal: 8),
        child: Text('$value', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF00E676)))),
    IconButton(icon: const Icon(Icons.add_circle_outline, color: Color(0xFF00E676), size: 20),
        onPressed: value < max ? () => onChange(value + 1) : null, padding: EdgeInsets.zero, constraints: const BoxConstraints()),
  ]);
}
