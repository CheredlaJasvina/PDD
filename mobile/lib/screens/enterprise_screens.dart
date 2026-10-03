import 'package:flutter/material.dart';

/// EnterpriseScreen renders one of 30+ tool panels based on [screenId].
class EnterpriseScreen extends StatefulWidget {
  final String screenId;
  final String screenName;
  final List<dynamic> inventory;
  final Map<String, dynamic> preferences;
  final Function(Map<String, dynamic>) onUpdatePreferences;
  final String theme;
  final Function(String) onThemeChange;
  final Function(String, String)? onUpdateState;
  final VoidCallback onNavigateBack;

  const EnterpriseScreen({
    super.key,
    required this.screenId,
    required this.screenName,
    required this.inventory,
    required this.preferences,
    required this.onUpdatePreferences,
    required this.theme,
    required this.onThemeChange,
    this.onUpdateState,
    required this.onNavigateBack,
  });

  @override
  State<EnterpriseScreen> createState() => _EnterpriseScreenState();
}

class _EnterpriseScreenState extends State<EnterpriseScreen> {
  // shared state
  List<Map<String, dynamic>> _history = [];
  int _portionServings = 2;
  final List<String> _checkedItems = [];
  String _gourmetLevel = 'Home Cook';
  String _gourmetMsg = '';
  List<String> _wishlist = ['Fresh Bananas', 'Organic Greek Yogurt'];
  final _wishCtrl = TextEditingController();
  String _leftoverSearch = '';
  List<Map<String, dynamic>> _leftoverRecipes = [];
  final _leftoverCtrl = TextEditingController();
  double _spiceLevel = 5.0;
  bool _spiceAuto = false;
  String _spiceItem = '';
  List<String> _allergens = [];
  double _savingsGoal = 2000;
  List<Map<String, dynamic>> _challenges = [
    {'id': 1, 'title': 'Zero Waste Hero',  'desc': 'Finish Gala Apples before Friday', 'done': false},
    {'id': 2, 'title': 'Healthy Habit',    'desc': 'Scan 3 fresh items in a week',     'done': true},
    {'id': 3, 'title': 'Community Share',  'desc': 'Claim 1 donation item',            'done': false},
  ];
  List<Map<String, dynamic>> _ledger = [
    {'id': 1, 'member': 'Dr. Priskilla', 'item': 'Organic Broccoli', 'cost': 120},
    {'id': 2, 'member': 'C. Jasvina',    'item': 'Fresh Gala Apples','cost': 250},
    {'id': 3, 'member': 'Angel Rani',    'item': 'Milk Carton',      'cost': 80},
  ];
  final _expCtrl = TextEditingController();
  int _expCost = 100;
  double _splitAmt = 600;
  int _splitPpl = 3;
  List<Map<String, dynamic>> _rules = [
    {'text': 'Label all containers with purchase date.',     'active': true},
    {'text': 'Move warning items to the top shelf.',         'active': true},
    {'text': 'Verify safety advisories before eating.',      'active': false},
  ];
  bool _isVol = false;
  Map<String, String> _meals = {
    'Monday': 'Apple Oats', 'Wednesday': 'Leftover Pasta Stew', 'Friday': 'Broccoli Cheese Bake'};
  String _newMealDay = 'Tuesday';
  final _mealCtrl = TextEditingController();
  int _advDays = 2;
  double _wasteWeight = 0.5;
  final _donateCtrl = TextEditingController();
  String _donateQty = '1 kg';

  @override
  void initState() {
    super.initState();
    if (widget.inventory.isNotEmpty) {
      _history = widget.inventory.map<Map<String, dynamic>>((i) => {
        'date':   (i['addedDate'] as String? ?? '').split('T').first,
        'item':   i['name'] ?? 'Item',
        'method': (i['imageUrl'] as String?)?.isNotEmpty == true ? 'Visual Laser Scan' : 'Manual Entry',
        'status': 'Success',
      }).toList();
    } else {
      _history = [
        {'date': '2026-08-22', 'item': 'Gala Apples',         'method': 'Visual Laser Scan',  'status': 'Success'},
        {'date': '2026-08-20', 'item': 'Organic Whole Milk',  'method': 'Manual Entry Lookup','status': 'Success'},
        {'date': '2026-08-19', 'item': 'Spaghetti Bolognese', 'method': 'Receipt OCR Scan',   'status': 'Success'},
      ];
    }
    final spiceItems = widget.inventory.where((i) => i['spiceLevel'] != null && (i['spiceLevel'] as num) > 0).toList();
    if (spiceItems.isNotEmpty) {
      double tot = 0;
      for (final s in spiceItems) tot += (s['spiceLevel'] as num).toDouble();
      _spiceLevel = tot / spiceItems.length;
      _spiceAuto  = true;
      _spiceItem  = spiceItems.first['name'] as String? ?? '';
    }
    _allergens = List<String>.from((widget.preferences['dietaryPreferences'] as List?)?.cast<String>() ?? []);
    _advDays   = (widget.preferences['notificationPref']?['advanceNoticeDays'] as num? ?? 2).toInt();
  }

  @override
  void dispose() {
    _wishCtrl.dispose(); _leftoverCtrl.dispose(); _expCtrl.dispose();
    _mealCtrl.dispose(); _donateCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Panel header
        Container(
          padding: const EdgeInsets.all(14),
          decoration: _glass(),
          child: Row(children: [
            Container(width: 36, height: 36,
                decoration: BoxDecoration(color: const Color(0xFF00E676).withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
                child: const Center(child: Text('💡', style: TextStyle(fontSize: 18)))),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(widget.screenName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              Text('FreshRadar Enterprise · ${widget.screenId}', style: const TextStyle(color: Colors.grey, fontSize: 10)),
            ])),
          ]),
        ),
        const SizedBox(height: 16),
        _buildPanel(),
      ]),
    );
  }

  Widget _buildPanel() {
    switch (widget.screenId) {
      case 'alerts':             return _alerts();
      case 'history':            return _history_();
      case 'recipes-portions':   return _portions();
      case 'recipes-gourmet':    return _gourmet();
      case 'recipes-leftovers':  return _leftovers();
      case 'recipes-spice':      return _spice();
      case 'recipes-allergens':  return _allergenPanel();
      case 'eco-savings':        return _ecoSavings();
      case 'eco-standings':      return _leaderboard();
      case 'eco-donation':       return _donation();
      case 'eco-waste':          return _bioWaste();
      case 'eco-scorecard':      return _scorecard();
      case 'eco-challenges':     return _challengesPanel();
      case 'coop-ledger':        return _ledgerPanel();
      case 'coop-pantry':        return _pantryLog();
      case 'coop-planner':       return _shopCalendar();
      case 'coop-splitter':      return _splitter();
      case 'coop-rules':         return _rulesPanel();
      case 'coop-wishlist':      return _wishlistPanel();
      case 'community-maps':     return _mapsPanel();
      case 'community-claims':   return _claimsPanel();
      case 'community-catalogs': return _catalogsPanel();
      case 'community-standings':return _neighStandings();
      case 'community-dispatch': return _volunteer();
      case 'community-events':   return _events();
      case 'adv-temp':           return _tempAdvisory();
      case 'adv-poisoning':      return _poisoning();
      case 'adv-meal':           return _mealPlanner();
      case 'adv-nutrition':      return _nutrition();
      case 'adv-preservatives':  return _preservatives();
      case 'adv-preservation':   return _dehydration();
      case 'settings-notice':    return _noticeSettings();
      case 'settings-theme':     return _themePanel();
      case 'settings-alerts':    return _alertToggles();
      case 'settings-email':     return _emailConfig();
      case 'settings-badges':    return _badgesGallery();
      default:                   return _mockPanel();
    }
  }

  // ── PANELS ────────────────────────────────────────────────────────────────

  Widget _alerts() {
    final active = widget.inventory.where((item) {
      final s   = item['status'] as String? ?? '';
      final d   = DateTime.tryParse(item['predictedSpoilageDate'] as String? ?? '');
      final days = d?.difference(DateTime.now()).inDays ?? 999;
      return s == 'Spoiled' || days <= 2;
    }).toList();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _panelTitle('🚨 Active Spoilage Notifications (${active.length})'),
      const Text('Real-time warnings based on dynamic decay rates.', style: TextStyle(color: Colors.grey, fontSize: 11)),
      const SizedBox(height: 12),
      if (active.isEmpty) _greenBanner('✅ Pantry fully optimised — zero warnings.')
      else ...active.map((item) {
        final name  = item['name'] as String? ?? 'Item';
        final days  = DateTime.tryParse(item['predictedSpoilageDate'] as String? ?? '')?.difference(DateTime.now()).inDays ?? 0;
        final type  = item['status'] == 'Spoiled' ? 'critical' : days <= 1 ? 'urgent' : 'warning';
        final msg   = type == 'critical' ? '"$name" is spoiled. Avoid consumption!'
            : type == 'urgent' ? '"$name" spoils in 1 day — use today!'
            : '"$name" spoils in 2 days. Plan to use soon.';
        final c = type == 'critical' ? const Color(0xFFFF1744) : type == 'urgent' ? const Color(0xFFFF9100) : const Color(0xFFFFEA00);
        return Container(
          margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: c.withOpacity(0.05), borderRadius: BorderRadius.circular(10),
              border: Border.all(color: c.withOpacity(0.4))),
          child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(msg, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, height: 1.4)),
              Text('Priority: ${type.toUpperCase()}', style: TextStyle(color: c, fontSize: 10)),
            ])),
            if (type != 'critical') ...[
              const SizedBox(width: 8),
              Column(children: [
                _sBtn('✅ Used', const Color(0xFF00E676), Colors.black, () => widget.onUpdateState?.call(item['_id'] as String, 'Used')),
                const SizedBox(height: 4),
                _sBtn('🗑️ Wasted', const Color(0xFFFF1744).withOpacity(0.1), const Color(0xFFFF1744), () => widget.onUpdateState?.call(item['_id'] as String, 'Wasted')),
              ]),
            ] else const Text('⚠️ Discard', style: TextStyle(color: Color(0xFFFF1744), fontSize: 10, fontWeight: FontWeight.bold)),
          ]),
        );
      }),
    ]);
  }

  Widget _history_() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      _panelTitle('📅 Recent Pantry Events'),
      TextButton(onPressed: () => setState(() => _history = []),
          child: const Text('Clear', style: TextStyle(color: Colors.redAccent, fontSize: 12))),
    ]),
    if (_history.isEmpty) const Text('No events logged.', style: TextStyle(color: Colors.grey))
    else ..._history.map((h) => Container(
      margin: const EdgeInsets.only(bottom: 6), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withOpacity(0.06))),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(h['item'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          Text(h['method'] as String, style: const TextStyle(color: Colors.grey, fontSize: 10)),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(h['date'] as String, style: const TextStyle(fontSize: 11)),
          Text(h['status'] as String, style: const TextStyle(color: Color(0xFF00E676), fontSize: 10)),
        ]),
      ]),
    )),
  ]);

  Widget _portions() {
    final items = widget.inventory.isNotEmpty ? widget.inventory : [
      {'name': 'Gala Apples'}, {'name': 'Milk Base'}, {'name': 'Broccoli'}];
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _panelTitle('⚖️ Cooking Portion Scaler'),
      Row(children: [
        const Text('Servings:'), const SizedBox(width: 8),
        ...[2,4,6,8].map((n) => Padding(padding: const EdgeInsets.only(right: 6),
          child: GestureDetector(onTap: () => setState(() => _portionServings = n),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: _portionServings == n ? const Color(0xFF00E676).withOpacity(0.15) : Colors.transparent,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: _portionServings == n ? const Color(0xFF00E676) : Colors.white24),
              ),
              child: Text('$n', style: TextStyle(color: _portionServings == n ? const Color(0xFF00E676) : Colors.grey, fontWeight: FontWeight.bold, fontSize: 12)),
            ),
          ),
        )),
        const Spacer(),
        _stepper(_portionServings, 1, 20, (v) => setState(() => _portionServings = v)),
      ]),
      const SizedBox(height: 14),
      ...items.take(6).map((item) {
        final name     = item['name'] as String? ?? 'Item';
        final scaled   = _portionServings.toStringAsFixed(0);
        final checked  = _checkedItems.contains(name);
        return Container(
          margin: const EdgeInsets.only(bottom: 6), padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.white.withOpacity(0.06))),
          child: Row(children: [
            Checkbox(value: checked, activeColor: const Color(0xFF00E676),
                onChanged: (v) => setState(() { if (v!) _checkedItems.add(name); else _checkedItems.remove(name); })),
            Expanded(child: Text(name, style: TextStyle(fontSize: 13,
                decoration: checked ? TextDecoration.lineThrough : null))),
            Text('$scaled units', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF00E676), fontSize: 12)),
          ]),
        );
      }),
    ]);
  }

  Widget _gourmet() {
    final subs = {
      'Home Cook':  [{'o':'Ordinary Cheddar','r':'Sharp Cheddar'},{'o':'Standard Apple','r':'Apple Honey Drizzle'},{'o':'White Rice','r':'Jasmine Rice'},{'o':'Standard Milk','r':'Organic Milk'}],
      'Bistro Chef':[{'o':'Ordinary Cheddar','r':'Aged Gouda'},{'o':'Standard Apple','r':'Caramel Glaze'},{'o':'White Rice','r':'Basmati Pilaf'},{'o':'Standard Milk','r':'Almond Milk'}],
      'Pro Master': [{'o':'Ordinary Cheddar','r':'Truffle Pecorino'},{'o':'Standard Apple','r':'Sun-Dried Apple Chips'},{'o':'White Rice','r':'Saffron Risotto'},{'o':'Standard Milk','r':'Macadamia Milk'}],
    };
    final list = subs[_gourmetLevel] ?? [];
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _panelTitle('🧑‍🍳 Gourmet Substitution Guide'),
      const Text('Upgrade simple ingredients to professional chef alternatives.', style: TextStyle(color: Colors.grey, fontSize: 11)),
      const SizedBox(height: 12),
      Row(children: ['Home Cook','Bistro Chef','Pro Master'].map((lvl) => Expanded(child: Padding(
        padding: const EdgeInsets.only(right: 4),
        child: GestureDetector(onTap: () => setState(() => _gourmetLevel = lvl),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: _gourmetLevel == lvl ? const Color(0xFF00E676).withOpacity(0.15) : Colors.transparent,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: _gourmetLevel == lvl ? const Color(0xFF00E676) : Colors.white24),
            ),
            child: Text(lvl, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold,
                color: _gourmetLevel == lvl ? const Color(0xFF00E676) : Colors.white60), textAlign: TextAlign.center),
          )),
      ))).toList()),
      if (_gourmetMsg.isNotEmpty) ...[const SizedBox(height: 8), _greenBanner(_gourmetMsg)],
      const SizedBox(height: 12),
      ...list.map((s) => GestureDetector(
        onTap: () {
          if (!_wishlist.contains(s['r'])) {
            setState(() { _wishlist.add(s['r']!); _gourmetMsg = '✨ ${s["r"]} added to wishlist!'; });
            Future.delayed(const Duration(seconds: 3), () { if (mounted) setState(() => _gourmetMsg = ''); });
          }
        },
        child: Container(
          margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.white.withOpacity(0.06))),
          child: Row(children: [
            Expanded(child: Text(s['o']!, style: const TextStyle(color: Colors.grey, fontSize: 12))),
            const Text(' → ', style: TextStyle(color: Colors.white54)),
            Text(s['r']!, style: const TextStyle(color: Color(0xFF00E676), fontWeight: FontWeight.bold, fontSize: 12)),
          ]),
        ),
      )),
    ]);
  }

  Widget _leftovers() {
    final templates = <String, List<Map<String, dynamic>>>{
      'rice':    [{'title':'Fried Rice','desc':'Day-old rice in soy sauce.','time':'15 mins','diet':'Vegetarian'},
                  {'title':'Rice Pudding','desc':'Creamy coconut milk dessert.','time':'25 mins','diet':'Vegan'}],
      'milk':    [{'title':'White Sauce Pasta','desc':'Silky béchamel sauce.','time':'20 mins','diet':'Vegetarian'},
                  {'title':'Homemade Paneer','desc':'Curdle with lemon juice.','time':'30 mins','diet':'Vegetarian'}],
      'bread':   [{'title':'French Toast','desc':'Dipped in egg-milk batter.','time':'10 mins','diet':'Vegetarian'},
                  {'title':'Bread Pizza','desc':'Toasted with sauce and cheese.','time':'15 mins','diet':'Vegetarian'}],
      'pasta':   [{'title':'Pasta Frittata','desc':'Pasta bound with eggs.','time':'20 mins','diet':'Vegetarian'},
                  {'title':'Cold Pasta Salad','desc':'Chilled with olives and feta.','time':'10 mins','diet':'Vegetarian'}],
      'chicken': [{'title':'Chicken Fried Rice','desc':'Shredded chicken with rice.','time':'15 mins','diet':'Non-Veg'},
                  {'title':'Chicken Quesadilla','desc':'Chicken in a flour tortilla.','time':'10 mins','diet':'Non-Veg'}],
      'potato':  [{'title':'Potato Hash','desc':'Pan-fried with paprika.','time':'15 mins','diet':'Vegan'},
                  {'title':'Potato Soup','desc':'Mashed into velvety soup.','time':'25 mins','diet':'Vegetarian'}],
      'egg':     [{'title':'Shakshuka','desc':'Eggs in spiced tomato sauce.','time':'20 mins','diet':'Vegetarian'},
                  {'title':'Spanish Omelette','desc':'Thick egg and potato tortilla.','time':'30 mins','diet':'Vegetarian'}],
      'tomato':  [{'title':'Tomato Soup','desc':'Roasted and blended.','time':'35 mins','diet':'Vegetarian'},
                  {'title':'Bruschetta','desc':'Diced tomatoes on toast.','time':'10 mins','diet':'Vegan'}],
    };
    void doSearch() {
      final q = _leftoverSearch.toLowerCase().trim();
      if (q.isEmpty) return;
      List<Map<String, dynamic>> found = [];
      for (final k in templates.keys) {
        if (q.contains(k) || k.contains(q)) { found = templates[k]!; break; }
      }
      if (found.isEmpty) found = [
        {'title': 'Quick Stir-Fry', 'desc': 'Toss everything in a hot wok.', 'time': '15 mins', 'diet': 'Vegan'},
        {'title': 'Hearty Soup',    'desc': 'Simmer leftovers into soup.',   'time': '25 mins', 'diet': 'Vegetarian'},
      ];
      setState(() => _leftoverRecipes = found);
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _panelTitle('♻️ Leftovers Re-purposer'),
      const Text('Enter ingredients to get recipe ideas.', style: TextStyle(color: Colors.grey, fontSize: 11)),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: TextField(controller: _leftoverCtrl, onChanged: (v) => setState(() => _leftoverSearch = v),
            onSubmitted: (_) => doSearch(),
            decoration: const InputDecoration(labelText: 'e.g. rice, chicken, tomato', border: OutlineInputBorder(), isDense: true))),
        const SizedBox(width: 8),
        ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black),
            onPressed: doSearch, child: const Text('Search')),
      ]),
      const SizedBox(height: 10),
      Wrap(spacing: 6, runSpacing: 6, children: ['rice','milk','bread','pasta','chicken','potato'].map((s) =>
        GestureDetector(onTap: () { _leftoverCtrl.text = s; setState(() => _leftoverSearch = s); doSearch(); },
          child: Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: const Color(0xFF00E676).withOpacity(0.08), borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF00E676).withOpacity(0.2))),
              child: Text(s, style: const TextStyle(fontSize: 11, color: Color(0xFF00E676)))))).toList()),
      const SizedBox(height: 14),
      ..._leftoverRecipes.map((r) => Container(
        margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.06))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(r['title'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 4),
          Text(r['desc'] as String, style: const TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(height: 8),
          Row(children: [
            _tag('⏱ ${r["time"]}', Colors.grey),
            const SizedBox(width: 8),
            _tag(r['diet'] as String, r['diet'] == 'Non-Veg' ? const Color(0xFFFF1744) : r['diet'] == 'Vegan' ? const Color(0xFF00E676) : const Color(0xFF00BCD4)),
          ]),
        ]),
      )),
    ]);
  }

  Widget _spice() {
    String emoji() {
      if (_spiceLevel <= 2) return '🌿 None'; if (_spiceLevel <= 4) return '🌶️ Mild';
      if (_spiceLevel <= 6) return '🌶️🌶️ Medium'; if (_spiceLevel <= 8) return '🌶️🌶️🌶️ Hot';
      return '🔥 Vindaloo';
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _panelTitle('🌶️ Spice Level Customizer'),
      if (_spiceAuto) ...[_greenBanner('💡 Auto-detected from inventory (e.g. $_spiceItem).'), const SizedBox(height: 10)],
      Center(child: Text(emoji(), style: const TextStyle(fontSize: 32))),
      const SizedBox(height: 8),
      Text('Intensity: ${_spiceLevel.toInt()}/10', style: const TextStyle(color: Colors.grey, fontSize: 13)),
      Slider(value: _spiceLevel, min: 1, max: 10, divisions: 9, activeColor: const Color(0xFF00E676),
          onChanged: (v) => setState(() => _spiceLevel = v)),
      Row(mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [['None',1.0],['Mild',2.5],['Medium',5.0],['Hot',7.5],['Vindaloo',10.0]].map((e) {
          final lbl = e[0] as String; final val = e[1] as double;
          final active = (_spiceLevel - val).abs() < 1.5;
          return GestureDetector(onTap: () => setState(() => _spiceLevel = val),
            child: Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: active ? const Color(0xFF00E676).withOpacity(0.15) : Colors.transparent,
                  borderRadius: BorderRadius.circular(6), border: Border.all(color: active ? const Color(0xFF00E676) : Colors.white24)),
              child: Text(lbl, style: TextStyle(fontSize: 10, color: active ? const Color(0xFF00E676) : Colors.grey))));
        }).toList()),
    ]);
  }

  Widget _allergenPanel() {
    const opts = ['Peanuts','Gluten','Dairy','Soy','Shellfish','Egg'];
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _panelTitle('🥜 Allergen Safe-List'),
      const Text('Toggle allergens to filter incompatible recipes.', style: TextStyle(color: Colors.grey, fontSize: 11)),
      const SizedBox(height: 12),
      ...opts.map((a) {
        final k = a.toLowerCase(); final active = _allergens.contains(k);
        return CheckboxListTile(title: Text(a, style: const TextStyle(fontSize: 13)),
          value: active, activeColor: const Color(0xFF00E676), contentPadding: EdgeInsets.zero,
          onChanged: (v) => setState(() {
            if (v!) { _allergens.add(k); } else { _allergens.remove(k); }
            final p = List<String>.from((widget.preferences['dietaryPreferences'] as List?)?.cast<String>() ?? []);
            if (v) { if (!p.contains(k)) p.add(k); } else p.remove(k);
            widget.onUpdatePreferences({'dietaryPreferences': p});
          }));
      }),
    ]);
  }

  Widget _ecoSavings() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _panelTitle('💰 Financial Savings Meter'),
    const SizedBox(height: 14),
    Row(children: [
      Expanded(child: _sbox('₹250', 'SAVED THIS\nWEEK', const Color(0xFF00E676))),
      const SizedBox(width: 12),
      Expanded(child: _sbox('₹${_savingsGoal.toInt()}', 'MONTHLY\nGOAL', const Color(0xFFFFEA00))),
    ]),
    const SizedBox(height: 20),
    const Text('Set monthly savings goal:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
    Slider(value: _savingsGoal, min: 500, max: 5000, divisions: 9, activeColor: const Color(0xFF00E676),
        onChanged: (v) => setState(() => _savingsGoal = v)),
    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      const Text('₹500', style: TextStyle(color: Colors.grey, fontSize: 10)),
      Text('Goal: ₹${_savingsGoal.toInt()}', style: const TextStyle(color: Color(0xFF00E676), fontWeight: FontWeight.bold)),
      const Text('₹5000', style: TextStyle(color: Colors.grey, fontSize: 10)),
    ]),
    const SizedBox(height: 12),
    ClipRRect(borderRadius: BorderRadius.circular(4),
        child: LinearProgressIndicator(value: (250 / _savingsGoal).clamp(0.0, 1.0), backgroundColor: Colors.white12,
            color: const Color(0xFF00E676), minHeight: 10)),
  ]);

  Widget _leaderboard() {
    final board = [
      {'rank': 1, 'name': 'Dr. Priskilla', 'score': '96 XP', 'you': false},
      {'rank': 2, 'name': 'C. Jasvina',    'score': '88 XP', 'you': false},
      {'rank': 3, 'name': 'Angel Rani',    'score': '72 XP', 'you': false},
      {'rank': 4, 'name': widget.preferences['name'] ?? 'You',
        'score': '${widget.preferences['healthScore'] ?? 100} XP', 'you': true},
    ];
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _panelTitle('🏆 Eco Standings Leaderboard'),
      const SizedBox(height: 12),
      ...board.map((e) => Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: e['you'] == true ? const Color(0xFF00E676).withOpacity(0.08) : Colors.white.withOpacity(0.02),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: e['you'] == true ? const Color(0xFF00E676).withOpacity(0.3) : Colors.white.withOpacity(0.06)),
        ),
        child: Row(children: [
          Text('#${e["rank"]}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16,
              color: e['you'] == true ? const Color(0xFF00E676) : Colors.grey)),
          const SizedBox(width: 14),
          Expanded(child: Text(e['name'] as String, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13,
              color: e['you'] == true ? const Color(0xFF00E676) : Colors.white))),
          Text(e['score'] as String, style: TextStyle(fontWeight: FontWeight.bold,
              color: e['you'] == true ? const Color(0xFF00E676) : Colors.grey)),
        ]),
      )),
    ]);
  }

  Widget _donation() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _panelTitle('🎁 Food Donation Registry'),
    const Text('Register surplus food to the neighbourhood sharing market.', style: TextStyle(color: Colors.grey, fontSize: 11)),
    const SizedBox(height: 14),
    TextField(controller: _donateCtrl, decoration: const InputDecoration(labelText: 'Food item name', border: OutlineInputBorder())),
    const SizedBox(height: 10),
    DropdownButtonFormField<String>(
      value: _donateQty, dropdownColor: const Color(0xFF13151B),
      decoration: const InputDecoration(labelText: 'Quantity', border: OutlineInputBorder()),
      items: ['0.5 kg','1 kg','2 kg','5 kg','1 bag'].map((q) => DropdownMenuItem(value: q, child: Text(q))).toList(),
      onChanged: (v) => setState(() => _donateQty = v!),
    ),
    const SizedBox(height: 14),
    ElevatedButton(
      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black,
          minimumSize: const Size(double.infinity, 48)),
      onPressed: () {
        if (_donateCtrl.text.isEmpty) return;
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Registered $_donateQty of ${_donateCtrl.text} to market!')));
        _donateCtrl.clear();
      },
      child: const Text('Register Surplus Item', style: TextStyle(fontWeight: FontWeight.bold)),
    ),
  ]);

  Widget _bioWaste() {
    final biogas = (_wasteWeight * 0.15).toStringAsFixed(2);
    final phone  = (_wasteWeight * 12).toStringAsFixed(0);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _panelTitle('🪱 Bio-waste Biogas Optimizer'),
      const Text('Estimate biogas from your organic waste.', style: TextStyle(color: Colors.grey, fontSize: 11)),
      const SizedBox(height: 14),
      Text('Waste Weight: ${_wasteWeight.toStringAsFixed(1)} kg', style: const TextStyle(fontWeight: FontWeight.bold)),
      Slider(value: _wasteWeight, min: 0.1, max: 5.0, divisions: 49, activeColor: const Color(0xFF00E676),
          onChanged: (v) => setState(() => _wasteWeight = v)),
      const SizedBox(height: 14),
      Row(children: [
        Expanded(child: _sbox('$biogas m³', 'BIOGAS\nPRODUCED', const Color(0xFF00E676))),
        const SizedBox(width: 12),
        Expanded(child: _sbox('$phone hrs', 'PHONE\nCHARGING', const Color(0xFFFFEA00))),
      ]),
    ]);
  }

  Widget _scorecard() => _glass2(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      const Text('🌿 FreshRadar Green Pass', style: TextStyle(color: Color(0xFF00E676), fontWeight: FontWeight.bold, fontSize: 13)),
      Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(color: const Color(0xFF00E676).withOpacity(0.2), borderRadius: BorderRadius.circular(6)),
          child: const Text('ACTIVE', style: TextStyle(color: Color(0xFF00E676), fontSize: 9, fontWeight: FontWeight.bold))),
    ]),
    const SizedBox(height: 12),
    Text(widget.preferences['name'] as String? ?? 'User',
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white)),
    const SizedBox(height: 4),
    const Text('Waste Rating: EXCELLENT (A+)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white)),
    const SizedBox(height: 4),
    const Text('CO2 Offset: 24.8 kg saved this month', style: TextStyle(color: Colors.white70, fontSize: 12)),
    const SizedBox(height: 8),
    const Text('You are in the top 12% of FreshRadar users for sustainability.',
        style: TextStyle(color: Colors.grey, fontSize: 11, height: 1.4)),
  ]));

  Widget _challengesPanel() {
    final first = widget.inventory.isNotEmpty ? widget.inventory.first['name'] as String? ?? 'Gala Apples' : 'Gala Apples';
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _panelTitle('🏅 Weekly Zero-Waste Challenges'),
      const SizedBox(height: 12),
      ..._challenges.asMap().entries.map((e) {
        final c = e.value;
        final desc = c['id'] == 1 ? 'Finish $first before Friday decay' : c['desc'] as String;
        return Container(
          margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: c['done'] == true ? const Color(0xFF00E676).withOpacity(0.06) : Colors.white.withOpacity(0.02),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: c['done'] == true ? const Color(0xFF00E676).withOpacity(0.2) : Colors.white12),
          ),
          child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(c['title'] as String, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13,
                  color: c['done'] == true ? const Color(0xFF00E676) : Colors.white)),
              const SizedBox(height: 3),
              Text(desc, style: const TextStyle(color: Colors.grey, fontSize: 11)),
            ])),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: c['done'] == true ? Colors.white10 : const Color(0xFF00E676),
                foregroundColor: c['done'] == true ? Colors.grey : Colors.black,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6), minimumSize: Size.zero),
              onPressed: () => setState(() => _challenges[e.key]['done'] = !(c['done'] as bool)),
              child: Text(c['done'] == true ? 'Undo' : 'Done ✅', style: const TextStyle(fontSize: 11)),
            ),
          ]),
        );
      }),
    ]);
  }

  Widget _ledgerPanel() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _panelTitle('📒 Co-op Expense Ledger'),
    Row(children: [
      Expanded(child: TextField(controller: _expCtrl, decoration: const InputDecoration(labelText: 'Item', border: OutlineInputBorder(), isDense: true))),
      const SizedBox(width: 8),
      SizedBox(width: 80, child: TextField(keyboardType: TextInputType.number,
          onChanged: (v) => setState(() => _expCost = int.tryParse(v) ?? 100),
          decoration: const InputDecoration(labelText: '₹', border: OutlineInputBorder(), isDense: true))),
      const SizedBox(width: 8),
      ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black),
          onPressed: () {
            if (_expCtrl.text.isEmpty) return;
            setState(() { _ledger.add({'id': DateTime.now().millisecondsSinceEpoch, 'member': widget.preferences['name'] ?? 'You', 'item': _expCtrl.text, 'cost': _expCost}); _expCtrl.clear(); });
          }, child: const Text('Add')),
    ]),
    const SizedBox(height: 12),
    ..._ledger.map((e) => Container(
      margin: const EdgeInsets.only(bottom: 6), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white.withOpacity(0.06))),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(e['item'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          Text(e['member'] as String, style: const TextStyle(color: Colors.grey, fontSize: 10)),
        ])),
        Text('₹${e["cost"]}', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF00E676), fontSize: 14)),
      ]),
    )),
    const Divider(color: Colors.white12),
    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      const Text('Total:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
      Text('₹${_ledger.fold(0, (s, e) => s + (e["cost"] as int))}',
          style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF00E676), fontSize: 16)),
    ]),
  ]);

  Widget _pantryLog() {
    const logs = [
      {'name':'Dr. Priskilla','action':'Consumed Gala Apples','time':'10 mins ago'},
      {'name':'Angel Rani',   'action':'Added Milk bottle',   'time':'2 hours ago'},
      {'name':'C. Jasvina',  'action':'Removed Spaghetti',   'time':'1 day ago'},
    ];
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _panelTitle('🗂️ Shared Pantry Log'),
      const SizedBox(height: 12),
      ...logs.map((l) => Container(
        margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white.withOpacity(0.06))),
        child: Row(children: [
          CircleAvatar(radius: 16, backgroundColor: const Color(0xFF00E676).withOpacity(0.15),
              child: Text(l['name']![0], style: const TextStyle(color: Color(0xFF00E676), fontWeight: FontWeight.bold))),
          const SizedBox(width: 10),
          Expanded(child: RichText(text: TextSpan(
            style: const TextStyle(fontSize: 12, color: Colors.grey),
            children: [TextSpan(text: l['name'], style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)), TextSpan(text: ' ${l["action"]}')],
          ))),
          Text(l['time']!, style: const TextStyle(color: Colors.grey, fontSize: 10)),
        ]),
      )),
    ]);
  }

  Widget _shopCalendar() {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _panelTitle('📅 Collaborative Shopping Calendar'),
      const SizedBox(height: 12),
      GridView.count(crossAxisCount: 7, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 6, crossAxisSpacing: 4, childAspectRatio: 0.7,
        children: days.map((d) => Container(
          decoration: BoxDecoration(
            color: d == 'Wed' ? const Color(0xFF00E676).withOpacity(0.1) : Colors.white.withOpacity(0.03),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: d == 'Wed' ? const Color(0xFF00E676).withOpacity(0.3) : Colors.white.withOpacity(0.06)),
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text(d, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: d == 'Wed' ? const Color(0xFF00E676) : Colors.grey)),
            if (d == 'Wed') const Icon(Icons.shopping_cart, color: Color(0xFF00E676), size: 12),
          ]),
        )).toList()),
      const SizedBox(height: 8),
      const Text('Wednesday is the default grocery day.', style: TextStyle(color: Colors.grey, fontSize: 11)),
    ]);
  }

  Widget _splitter() {
    final per = _splitPpl > 0 ? (_splitAmt / _splitPpl).toStringAsFixed(2) : '0.00';
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _panelTitle('🧾 Grocery Expense Splitter'),
      const SizedBox(height: 14),
      Row(children: [
        Expanded(child: TextField(keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Total Cost (₹)', prefixText: '₹ ', border: OutlineInputBorder()),
            onChanged: (v) => setState(() => _splitAmt = double.tryParse(v) ?? _splitAmt))),
        const SizedBox(width: 16),
        Column(crossAxisAlignment: CrossAxisAlignment.center, children: [
          const Text('People', style: TextStyle(color: Colors.grey, fontSize: 11)),
          _stepper(_splitPpl, 1, 20, (v) => setState(() => _splitPpl = v)),
        ]),
      ]),
      const SizedBox(height: 20),
      Container(padding: const EdgeInsets.all(20), width: double.infinity,
        decoration: BoxDecoration(color: const Color(0xFF00E676).withOpacity(0.06), borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF00E676).withOpacity(0.2))),
        child: Column(children: [
          const Text('Each Person Pays:', style: TextStyle(color: Colors.grey, fontSize: 12)),
          Text('₹$per', style: const TextStyle(fontSize: 42, fontWeight: FontWeight.w900, color: Color(0xFF00E676))),
          Text('($_splitPpl people × ₹$per = ₹${_splitAmt.toStringAsFixed(0)})',
              style: const TextStyle(color: Colors.grey, fontSize: 11)),
        ]),
      ),
    ]);
  }

  Widget _rulesPanel() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _panelTitle('📋 Co-Op Household Rules'),
    const SizedBox(height: 12),
    ..._rules.asMap().entries.map((e) => CheckboxListTile(
      title: Text(e.value['text'] as String, style: const TextStyle(fontSize: 13)),
      value: e.value['active'] as bool, activeColor: const Color(0xFF00E676), contentPadding: EdgeInsets.zero,
      onChanged: (v) => setState(() => _rules[e.key]['active'] = v ?? false),
    )),
  ]);

  Widget _wishlistPanel() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _panelTitle('🛒 Shared Grocery Wishlist'),
    const SizedBox(height: 12),
    Row(children: [
      Expanded(child: TextField(controller: _wishCtrl, decoration: const InputDecoration(labelText: 'Add item', border: OutlineInputBorder(), isDense: true))),
      const SizedBox(width: 8),
      ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black),
          onPressed: () {
            if (_wishCtrl.text.isEmpty) return;
            setState(() { _wishlist.add(_wishCtrl.text); _wishCtrl.clear(); });
          }, child: const Text('Add')),
    ]),
    const SizedBox(height: 12),
    ..._wishlist.asMap().entries.map((e) => Container(
      margin: const EdgeInsets.only(bottom: 6), padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white.withOpacity(0.06))),
      child: Row(children: [
        const Icon(Icons.check_box_outline_blank, color: Colors.grey, size: 18), const SizedBox(width: 10),
        Expanded(child: Text(e.value, style: const TextStyle(fontSize: 13))),
        IconButton(icon: const Icon(Icons.close, color: Colors.redAccent, size: 18),
            onPressed: () => setState(() => _wishlist.removeAt(e.key)),
            padding: EdgeInsets.zero, constraints: const BoxConstraints()),
      ]),
    )),
  ]);

  Widget _mapsPanel() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _panelTitle('🗺️ Neighbourhood Sharing Maps'),
    const SizedBox(height: 12),
    Container(height: 200, width: double.infinity,
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.03), borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.07))),
      child: Stack(children: [
        const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(Icons.map_outlined, color: Color(0xFF00E676), size: 48),
          SizedBox(height: 8),
          Text('Live Neighbourhood Sharing Map', style: TextStyle(color: Colors.grey, fontSize: 12)),
        ])),
        Positioned(left: 60,  top: 60,    child: _mapDot(const Color(0xFF00E676))),
        Positioned(right: 80, top: 80,    child: _mapDot(const Color(0xFFFFEA00))),
        Positioned(left: 120, bottom: 50, child: _mapDot(const Color(0xFF00E676))),
      ])),
    const SizedBox(height: 10),
    Row(children: [
      _dot(const Color(0xFF00E676)), const SizedBox(width: 4), const Text('Available', style: TextStyle(fontSize: 10, color: Colors.grey)), const SizedBox(width: 12),
      _dot(const Color(0xFFFFEA00)), const SizedBox(width: 4), const Text('Claimed',   style: TextStyle(fontSize: 10, color: Colors.grey)),
    ]),
  ]);

  Widget _claimsPanel() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _panelTitle('📋 Claim Requests Log'),
    const SizedBox(height: 12),
    Container(padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFFFEA00).withOpacity(0.2))),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Red Tomatoes × 3 pcs', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const Text('Requested by: Angel Rani · 0.2 km', style: TextStyle(color: Colors.grey, fontSize: 10)),
          const SizedBox(height: 4),
          _tag('PENDING', const Color(0xFFFFEA00)),
        ])),
        ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black),
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Approved!'))),
            child: const Text('Approve')),
      ]),
    ),
  ]);

  Widget _catalogsPanel() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _panelTitle('📚 Public Pantry Index'),
    const SizedBox(height: 12),
    ...[
      {'name':'Green Community Box','items':'Tomatoes, Spinach, Carrots'},
      {'name':'Bakers Surplus Pantry','items':'Bread, Flour, Eggs'},
    ].map((c) => Container(
      margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white.withOpacity(0.06))),
      child: Row(children: [
        const Text('📦', style: TextStyle(fontSize: 24)), const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(c['name']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          Text(c['items']!, style: const TextStyle(color: Colors.grey, fontSize: 11)),
        ])),
        _tag('Available', const Color(0xFF00E676)),
      ]),
    )),
  ]);

  Widget _neighStandings() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _panelTitle('🌍 Neighbourhood Eco Standings'),
    const SizedBox(height: 12),
    ...[
      {'n':'Greenleaf Colony',  'co2':'12.4 kg','rank':'🥇'},
      {'n':'Riverside Heights', 'co2':'8.9 kg', 'rank':'🥈'},
      {'n':'Hillside Terrace',  'co2':'5.2 kg', 'rank':'🥉'},
    ].map((e) => Container(
      margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white.withOpacity(0.06))),
      child: Row(children: [
        Text(e['rank']!, style: const TextStyle(fontSize: 20)), const SizedBox(width: 12),
        Expanded(child: Text(e['n']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13))),
        Text('${e["co2"]} saved', style: const TextStyle(color: Color(0xFF00E676), fontWeight: FontWeight.bold, fontSize: 12)),
      ]),
    )),
  ]);

  Widget _volunteer() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _panelTitle('🤝 Volunteer Dispatch Registry'),
    const SizedBox(height: 12),
    Container(padding: const EdgeInsets.all(16), decoration: _glass(), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Register as a volunteer food delivery driver for surplus items in your area.',
          style: TextStyle(color: Colors.grey, fontSize: 12, height: 1.5)),
      const SizedBox(height: 14),
      ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: _isVol ? Colors.white10 : const Color(0xFF00E676),
          foregroundColor: _isVol ? Colors.grey : Colors.black,
          minimumSize: const Size(double.infinity, 48)),
        onPressed: () => setState(() => _isVol = !_isVol),
        child: Text(_isVol ? '✓ Registered as Volunteer' : 'Register as Volunteer',
            style: const TextStyle(fontWeight: FontWeight.bold)),
      ),
    ])),
  ]);

  Widget _events() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _panelTitle('🎉 Local Food Sharing Events'),
    const SizedBox(height: 12),
    Container(padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFF00E676).withOpacity(0.04), borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF00E676).withOpacity(0.15))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('🥘 Community Potluck & Swap', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF00E676))),
        const SizedBox(height: 6),
        const Text('Sunday, 15 Nov · 4:00 PM · Greenleaf Park, Block 3', style: TextStyle(color: Colors.grey, fontSize: 11)),
        const SizedBox(height: 8),
        const Text('Bring surplus food and swap with neighbours. Free entry. Families welcome.',
            style: TextStyle(color: Colors.grey, fontSize: 11, height: 1.4)),
        const SizedBox(height: 12),
        ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black),
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Registered for event!'))),
            child: const Text('RSVP Now', style: TextStyle(fontWeight: FontWeight.bold))),
      ]),
    ),
  ]);

  Widget _tempAdvisory() {
    final first = widget.inventory.isNotEmpty ? widget.inventory.first['name'] as String? ?? 'your food' : 'your food';
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _panelTitle('🌡️ Ambient Temperature Adjuster'),
      const SizedBox(height: 12),
      Container(padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: Colors.orange.withOpacity(0.06), borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.orange.withOpacity(0.2))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('⚠️ High Ambient Temperature Warning', style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 8),
          Text('Temperatures above 25°C will cut the shelf-life of $first by 50%.',
              style: const TextStyle(color: Colors.grey, fontSize: 12, height: 1.5)),
          const SizedBox(height: 10),
          ...[
            'Move perishables to refrigerator immediately.',
            'Consume cooked food within 2 hours at high temperatures.',
            'Check packaging seals for heat damage regularly.',
          ].map((t) => Padding(padding: const EdgeInsets.only(bottom: 4),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('• ', style: TextStyle(color: Colors.orange)),
                Expanded(child: Text(t, style: const TextStyle(color: Colors.grey, fontSize: 11, height: 1.4))),
              ]))),
        ])),
    ]);
  }

  Widget _poisoning() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _panelTitle('🧼 Food Poisoning Prevention'),
    const SizedBox(height: 12),
    ...[
      {'icon':'🧽','title':'Wash hands thoroughly','desc':'Wash hands 20 seconds with soap before handling food.'},
      {'icon':'🌡️','title':'Cook to safe temperatures','desc':'Poultry 75°C, red meat 70°C, fish 63°C minimum.'},
      {'icon':'❄️','title':'Store below 4°C','desc':'Refrigerator at 4°C or below prevents bacterial growth.'},
      {'icon':'🗑️','title':'Discard spoiled items','desc':'Never taste-test — when in doubt, throw it out.'},
    ].map((t) => Container(
      margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white.withOpacity(0.06))),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(t['icon']!, style: const TextStyle(fontSize: 24)), const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(t['title']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 4),
          Text(t['desc']!, style: const TextStyle(color: Colors.grey, fontSize: 11, height: 1.4)),
        ])),
      ]),
    )),
  ]);

  Widget _mealPlanner() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _panelTitle('📅 Smart Weekly Meal Planner'),
    const SizedBox(height: 12),
    Row(children: [
      DropdownButton<String>(
        value: _newMealDay, dropdownColor: const Color(0xFF13151B),
        items: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d) => DropdownMenuItem(value: d, child: Text(d, style: const TextStyle(fontSize: 12)))).toList(),
        onChanged: (v) => setState(() => _newMealDay = v!),
      ),
      const SizedBox(width: 8),
      Expanded(child: TextField(controller: _mealCtrl, decoration: const InputDecoration(labelText: 'Meal name', border: OutlineInputBorder(), isDense: true))),
      const SizedBox(width: 8),
      ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black),
          onPressed: () {
            if (_mealCtrl.text.isEmpty) return;
            setState(() { _meals[_newMealDay] = _mealCtrl.text; _mealCtrl.clear(); });
          }, child: const Text('Plan')),
    ]),
    const SizedBox(height: 14),
    ..._meals.entries.map((e) => Container(
      margin: const EdgeInsets.only(bottom: 6), padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white.withOpacity(0.06))),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(e.key, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF00E676), fontSize: 12)),
        Text(e.value, style: const TextStyle(fontSize: 12)),
      ]),
    )),
  ]);

  Widget _nutrition() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _panelTitle('🍎 Nutrition Profiler'),
    const SizedBox(height: 12),
    ...[
      {'label':'Daily Calorie Target','target':'2000 kcal','color':const Color(0xFF00E676)},
      {'label':'Protein Target','target':'75 g / day','color':const Color(0xFF00BCD4)},
      {'label':'Carbs Target','target':'250 g / day','color':const Color(0xFFFFEA00)},
    ].map((t) => Container(
      margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white.withOpacity(0.06))),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(t['label'] as String, style: const TextStyle(fontSize: 13)),
        Text(t['target'] as String, style: TextStyle(fontWeight: FontWeight.bold, color: t['color'] as Color, fontSize: 13)),
      ]),
    )),
    const SizedBox(height: 8),
    const Text('Active allergen filters:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
    const SizedBox(height: 6),
    if (_allergens.isEmpty) const Text('No allergens configured.', style: TextStyle(color: Colors.grey, fontSize: 11))
    else Wrap(spacing: 6, runSpacing: 6, children: _allergens.map((a) => _tag(a, const Color(0xFFFFEA00))).toList()),
  ]);

  Widget _preservatives() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _panelTitle('🧪 Preservatives Safety Guide'),
    const SizedBox(height: 12),
    ...[
      {'code':'E211','name':'Sodium Benzoate','rating':'⚠️ Caution','desc':'Avoid in drinks — may affect hyperactivity in children.','color':const Color(0xFFFFEA00)},
      {'code':'E300','name':'Ascorbic Acid (Vitamin C)','rating':'✅ Safe','desc':'Natural antioxidant derived from citrus fruits.','color':const Color(0xFF00E676)},
      {'code':'E110','name':'Sunset Yellow FCF','rating':'⚠️ Caution','desc':'Artificial dye — may cause allergic reactions in sensitive individuals.','color':const Color(0xFFFF9100)},
    ].map((p) => Container(
      margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(12),
          border: Border.all(color: (p['color'] as Color).withOpacity(0.2))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('${p["code"]} — ${p["name"]}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          Text(p['rating'] as String, style: TextStyle(color: p['color'] as Color, fontSize: 11, fontWeight: FontWeight.bold)),
        ]),
        const SizedBox(height: 4),
        Text(p['desc'] as String, style: const TextStyle(color: Colors.grey, fontSize: 11, height: 1.4)),
      ]),
    )),
  ]);

  Widget _dehydration() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _panelTitle('🌬️ DIY Food Dehydration Guide'),
    const SizedBox(height: 12),
    Container(padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white.withOpacity(0.06))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('🍎 Dehydrated Apple Rings', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        const SizedBox(height: 8),
        ...[
          '1. Core and slice apples into 5mm rings.',
          '2. Soak in lemon juice for 5 minutes to prevent browning.',
          '3. Arrange on dehydrator trays with space between each slice.',
          '4. Set dehydrator to 57°C and run for 6–8 hours.',
          '5. Store in an airtight container — lasts up to 6 months.',
        ].asMap().entries.map((e) => Padding(padding: const EdgeInsets.only(bottom: 6),
            child: Text(e.value, style: const TextStyle(color: Colors.grey, fontSize: 12, height: 1.4)))),
      ])),
  ]);

  Widget _noticeSettings() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _panelTitle('⏰ Expiry Advance Warning Schedule'),
    const SizedBox(height: 14),
    const Text('Set how many days in advance to warn you:', style: TextStyle(color: Colors.grey, fontSize: 12)),
    Slider(value: _advDays.toDouble(), min: 1, max: 5, divisions: 4, activeColor: const Color(0xFF00E676),
        onChanged: (v) => setState(() {
          _advDays = v.toInt();
          final n = Map<String, dynamic>.from(widget.preferences['notificationPref'] as Map? ?? {});
          n['advanceNoticeDays'] = _advDays;
          widget.onUpdatePreferences({'notificationPref': n});
        })),
    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      const Text('1 day', style: TextStyle(color: Colors.grey, fontSize: 10)),
      Text('$_advDays day${_advDays > 1 ? "s" : ""} before spoilage',
          style: const TextStyle(color: Color(0xFF00E676), fontWeight: FontWeight.bold, fontSize: 13)),
      const Text('5 days', style: TextStyle(color: Colors.grey, fontSize: 10)),
    ]),
  ]);

  Widget _themePanel() {
    const themes = [
      {'id':'emerald-aurora','label':'🟢 Emerald Aurora'},
      {'id':'neon-cyberpunk','label':'⚡ Neon Cyberpunk'},
      {'id':'ocean-breeze',  'label':'🔵 Ocean Breeze'},
      {'id':'sunset-glow',   'label':'🟠 Sunset Glow'},
      {'id':'sakura-blossom','label':'🌸 Sakura Blossom'},
      {'id':'light',         'label':'☀️ Light Mode'},
    ];
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _panelTitle('🎨 Color Theme Selector'),
      const SizedBox(height: 12),
      GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 8, crossAxisSpacing: 8, childAspectRatio: 3.5,
        children: themes.map((t) {
          final active = widget.theme == t['id'];
          return GestureDetector(onTap: () => widget.onThemeChange(t['id']!),
            child: Container(
              decoration: BoxDecoration(
                color: active ? const Color(0xFF00E676).withOpacity(0.12) : Colors.white.withOpacity(0.03),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: active ? const Color(0xFF00E676) : Colors.white.withOpacity(0.1)),
              ),
              child: Center(child: Text(t['label']!, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold,
                  color: active ? const Color(0xFF00E676) : Colors.white70))),
            ));
        }).toList()),
    ]);
  }

  Widget _alertToggles() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _panelTitle('🔔 In-app Alert Controls'),
      const SizedBox(height: 12),
      Container(padding: const EdgeInsets.symmetric(vertical: 4), decoration: _glass(), child: Column(children: [
        CheckboxListTile(title: const Text('Play sound on urgent warning', style: TextStyle(fontSize: 13)), value: true,
            activeColor: const Color(0xFF00E676), onChanged: (_) {}, contentPadding: const EdgeInsets.symmetric(horizontal: 14)),
        CheckboxListTile(title: const Text('Show app badge count', style: TextStyle(fontSize: 13)), value: true,
            activeColor: const Color(0xFF00E676), onChanged: (_) {}, contentPadding: const EdgeInsets.symmetric(horizontal: 14)),
      ])),
    ]);
  }

  Widget _emailConfig() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _panelTitle('📧 Email Alerts Configuration'),
    const SizedBox(height: 12),
    Container(padding: const EdgeInsets.all(14), decoration: _glass(), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Registered email:', style: TextStyle(color: Colors.grey, fontSize: 11)),
      const SizedBox(height: 6),
      Text(widget.preferences['email'] as String? ?? 'Not set',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF00E676))),
      const SizedBox(height: 8),
      const Text('Spoilage alert emails are sent to this address automatically.', style: TextStyle(color: Colors.grey, fontSize: 11, height: 1.4)),
    ])),
  ]);

  Widget _badgesGallery() {
    final unlocked = List<String>.from((widget.preferences['unlockedBadges'] as List?)?.cast<String>() ?? []);
    const all = [
      {'id':'Fresh Starter',    'label':'Fresh Starter 🚀',   'desc':'Scanned your first item'},
      {'id':'Waste Warrior',    'label':'Waste Warrior 🛡️',  'desc':'Zero waste for 1 week'},
      {'id':'Streak Seeker',    'label':'Streak Seeker ⚡',   'desc':'5-day tracking streak'},
      {'id':'Consistency King', 'label':'Consistency King 👑','desc':'30-day tracking streak'},
    ];
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _panelTitle('🏅 Achievement Badges Gallery'),
      const SizedBox(height: 12),
      GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 10, crossAxisSpacing: 10, childAspectRatio: 2.0,
        children: all.map((b) {
          final got = unlocked.contains(b['id']);
          return Opacity(opacity: got ? 1.0 : 0.4, child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: got ? const Color(0xFF00E676).withOpacity(0.06) : Colors.white.withOpacity(0.02),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: got ? const Color(0xFF00E676).withOpacity(0.2) : Colors.white12),
            ),
            child: Row(children: [
              Text(got ? '🏅' : '🔒', style: const TextStyle(fontSize: 22)),
              const SizedBox(width: 8),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(b['label']!, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: got ? const Color(0xFF00E676) : Colors.white70)),
                Text(b['desc']!, style: const TextStyle(color: Colors.grey, fontSize: 9)),
              ])),
            ]),
          ));
        }).toList()),
    ]);
  }

  Widget _mockPanel() => Column(children: [
    const Center(child: Text('💡', style: TextStyle(fontSize: 64))),
    const SizedBox(height: 12),
    Text(widget.screenName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
    const SizedBox(height: 8),
    Text('Route: ${widget.screenId}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
    const SizedBox(height: 20),
    Container(padding: const EdgeInsets.all(16), decoration: _glass(), child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('ℹ️ Module Operational', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
      SizedBox(height: 6),
      Text('This screen is part of the FreshRadar enterprise module. All API routes are mapped and active.',
          style: TextStyle(color: Colors.grey, fontSize: 11, height: 1.4)),
    ])),
    const SizedBox(height: 16),
    ElevatedButton(
      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black, minimumSize: const Size(double.infinity, 48)),
      onPressed: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Simulated event: ${widget.screenName}'))),
      child: const Text('🚀 Trigger Simulation Event', style: TextStyle(fontWeight: FontWeight.bold)),
    ),
    const SizedBox(height: 10),
    TextButton(onPressed: widget.onNavigateBack, child: const Text('← Return to Dashboard', style: TextStyle(color: Colors.grey))),
  ]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  Widget _panelTitle(String t) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Text(t, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
  );

  Widget _sBtn(String label, Color bg, Color fg, VoidCallback onTap) => ElevatedButton(
    style: ElevatedButton.styleFrom(backgroundColor: bg, foregroundColor: fg,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), minimumSize: Size.zero,
        textStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
        side: bg.opacity < 0.5 ? BorderSide(color: fg.withOpacity(0.5)) : BorderSide.none),
    onPressed: onTap, child: Text(label),
  );

  Widget _greenBanner(String msg) => Container(
    padding: const EdgeInsets.all(12), margin: const EdgeInsets.only(bottom: 8),
    decoration: BoxDecoration(color: const Color(0xFF00E676).withOpacity(0.05), borderRadius: BorderRadius.circular(8)),
    child: Row(children: [const Icon(Icons.check_circle_outline, color: Color(0xFF00E676), size: 16), const SizedBox(width: 8),
      Expanded(child: Text(msg, style: const TextStyle(color: Color(0xFF00E676), fontSize: 12)))]),
  );

  Widget _sbox(String val, String label, Color color) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: color.withOpacity(0.06), borderRadius: BorderRadius.circular(10)),
    child: Column(children: [
      Text(val,   style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: color)),
      Text(label, style: const TextStyle(color: Colors.grey, fontSize: 9), textAlign: TextAlign.center),
    ]),
  );

  Widget _tag(String label, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(6), border: Border.all(color: color.withOpacity(0.3))),
    child: Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
  );

  Widget _dot(Color color) => Container(width: 7, height: 7, decoration: BoxDecoration(color: color, shape: BoxShape.circle));

  Widget _mapDot(Color color) => Container(width: 14, height: 14,
    decoration: BoxDecoration(color: color, shape: BoxShape.circle,
        boxShadow: [BoxShadow(color: color.withOpacity(0.5), blurRadius: 8)]));

  BoxDecoration _glass() => BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(14),
      border: Border.all(color: Colors.white.withOpacity(0.06)));

  Widget _glass2(Widget child) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      gradient: const LinearGradient(colors: [Color(0xFF1B4332), Color(0xFF0B1E14)], begin: Alignment.topLeft, end: Alignment.bottomRight),
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: const Color(0xFF00E676).withOpacity(0.3)),
    ),
    child: child,
  );

  Widget _stepper(int value, int min, int max, Function(int) onChange) => Row(mainAxisSize: MainAxisSize.min, children: [
    IconButton(icon: const Icon(Icons.remove_circle_outline, color: Color(0xFF00E676), size: 20),
        onPressed: value > min ? () => onChange(value - 1) : null, padding: EdgeInsets.zero, constraints: const BoxConstraints()),
    Padding(padding: const EdgeInsets.symmetric(horizontal: 6),
        child: Text('$value', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF00E676)))),
    IconButton(icon: const Icon(Icons.add_circle_outline, color: Color(0xFF00E676), size: 20),
        onPressed: value < max ? () => onChange(value + 1) : null, padding: EdgeInsets.zero, constraints: const BoxConstraints()),
  ]);
}
