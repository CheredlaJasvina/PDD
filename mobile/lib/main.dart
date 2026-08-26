import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  runApp(const FoodFreshnessApp());
}

class FoodFreshnessApp extends StatelessWidget {
  const FoodFreshnessApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FreshRadar Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0B0C10),
        primaryColor: const Color(0xFF00E676),
        fontFamily: 'Inter',
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00E676),
          secondary: Color(0xFFFFEA00),
          surface: Color(0xFF13151B),
          error: Color(0xFFFF1744),
        ),
        useMaterial3: true,
      ),
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  String _activeRoute = "dashboard"; // dashboard, scanner, inventory, recipes, eco, household, community, settings
  String _pantryStatusFilter = "all";
  Map<String, dynamic>? _loggedInUser;
  String _backendUrl = "https://pdd-9fqv.onrender.com/api"; // Default Render deployment endpoint
  
  List<dynamic> _inventory = [];
  bool _isLoading = true;
  String? _connError;

  final List<Map<String, dynamic>> _sidebarCategories = [
    {
      "title": "Dashboard & Overview",
      "icon": "📊",
      "screens": [
        {"id": "dashboard", "name": "Dashboard Summary", "icon": "📈"},
        {"id": "scanner", "name": "Visual laser scan", "icon": "📸"},
        {"id": "inventory", "name": "Dynamic Pantry Inventory", "icon": "📦"},
        {"id": "analytics", "name": "Waste Cost Tracker", "icon": "📉"},
        {"id": "alerts", "name": "Real-time Spoilage Alerts", "icon": "🚨"},
        {"id": "insights", "name": "AI Consumption Insights", "icon": "🧠"}
      ]
    },
    {
      "title": "Smart Recipe Engine",
      "icon": "🥗",
      "screens": [
        {"id": "recipes", "name": "Dish Suggestion Hub", "icon": "🥣"},
        {"id": "recipes-portions", "name": "Cooking Portion Scaler", "icon": "⚖️"},
        {"id": "recipes-kids", "name": "Kid-Friendly Adjuster", "icon": "👶"},
        {"id": "recipes-gourmet", "name": "Gourmet Upgrade Guide", "icon": "🧑‍🍳"},
        {"id": "recipes-leftovers", "name": "Leftovers Re-purposer", "icon": "♻️"},
        {"id": "recipes-spice", "name": "Spice Customizer", "icon": "🌶️"},
        {"id": "recipes-allergens", "name": "Allergen Warning Safe-List", "icon": "🚫"}
      ]
    },
    {
      "title": "Eco & Sustainability",
      "icon": "🌿",
      "screens": [
        {"id": "eco", "name": "Eco & Carbon Tracker", "icon": "🌱"},
        {"id": "eco-savings", "name": "Financial Savings Meter", "icon": "₹"},
        {"id": "eco-standings", "name": "Community Standing", "icon": "🏆"},
        {"id": "eco-donation", "name": "Food Donation Registry", "icon": "🎁"},
        {"id": "eco-compost", "name": "Compost Safety Advisor", "icon": "🍂"},
        {"id": "eco-waste", "name": "Bio-waste Optimizer", "icon": "🪱"},
        {"id": "eco-scorecard", "name": "Green Citizen Scorecard", "icon": "💳"},
        {"id": "eco-challenges", "name": "Weekly Zero-Waste Challenges", "icon": "🎯"}
      ]
    },
    {
      "title": "Co-Op & Sharing",
      "icon": "👥",
      "screens": [
        {"id": "household", "name": "Household Members Manager", "icon": "🏠"},
        {"id": "coop-ledger", "name": "Fridge Co-op Ledger", "icon": "📖"},
        {"id": "coop-pantry", "name": "Shared Pantry Log", "icon": "🪵"},
        {"id": "coop-planner", "name": "Shopping Co-op Planner", "icon": "📝"},
        {"id": "coop-splitter", "name": "Expense Splitter", "icon": "✂️"},
        {"id": "coop-rules", "name": "Co-Op Household Rules", "icon": "⚖️"},
        {"id": "coop-wishlist", "name": "Shared Grocery Wishlist", "icon": "🛒"}
      ]
    },
    {
      "title": "Community Catalog",
      "icon": "🤝",
      "screens": [
        {"id": "community", "name": "Surplus Catalog Market", "icon": "🛒"},
        {"id": "community-maps", "name": "Local Food Donation Maps", "icon": "📍"},
        {"id": "community-claims", "name": "Claim Food Requests", "icon": "🙋"},
        {"id": "community-catalogs", "name": "Public Food Catalogs", "icon": "📁"},
        {"id": "community-standings", "name": "Neighborhood Standings", "icon": "🏅"},
        {"id": "community-dispatch", "name": "Volunteer Dispatch Hub", "icon": "🚒"},
        {"id": "community-events", "name": "Local Food Sharing Events", "icon": "🎪"}
      ]
    },
    {
      "title": "Advisories & Library",
      "icon": "📖",
      "screens": [
        {"id": "adv-storage", "name": "Crop Storage Database", "icon": "🗄️"},
        {"id": "adv-temp", "name": "Ambient Temp Adjuster", "icon": "🌡️"},
        {"id": "adv-science", "name": "Spoilage Science Library", "icon": "🔬"},
        {"id": "adv-poisoning", "name": "Food Poisoning Prevention", "icon": "🧼"},
        {"id": "adv-meal", "name": "Smart Meal Planner", "icon": "📅"},
        {"id": "adv-nutrition", "name": "Nutrition Profiler", "icon": "🍎"},
        {"id": "adv-preservatives", "name": "Preservatives Warning Guide", "icon": "⚠️"},
        {"id": "adv-preservation", "name": "DIY Food Dehydrator Guide", "icon": "☀️"}
      ]
    },
    {
      "title": "Theme & Profiles",
      "icon": "⚙️",
      "screens": [
        {"id": "settings", "name": "Main Dietary Profile", "icon": "👤"},
        {"id": "settings-notice", "name": "Expiry Advance Schedule", "icon": "⏰"},
        {"id": "settings-theme", "name": "Color Theme Switcher", "icon": "🎨"},
        {"id": "settings-alerts", "name": "In-app Alert Controls", "icon": "🔔"},
        {"id": "settings-email", "name": "Email Warning Config", "icon": "📧"},
        {"id": "settings-badges", "name": "Achievement Badges", "icon": "🎖️"}
      ]
    }
  ];

  String _getScreenName(String id) {
    for (var cat in _sidebarCategories) {
      for (var s in cat["screens"] as List) {
        if (s["id"] == id) return s["name"] as String;
      }
    }
    return "Unknown Module";
  }

  final List<dynamic> _localInventoryFallback = [
    {
      "_id": "mock-m-1",
      "name": "Fresh Gala Apples",
      "category": "fruits",
      "status": "Fresh",
      "state": "Tracked",
      "addedDate": DateTime.now().subtract(const Duration(days: 1)).toIso8601String(),
      "predictedSpoilageDate": DateTime.now().add(const Duration(days: 6)).toIso8601String(),
      "originalFreshness": 95,
      "imageUrl": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200",
      "isCooked": false,
      "dietaryTags": ["vegan", "vegetarian", "gluten-free", "dairy-free", "keto", "jain"],
      "nutrition": {
        "calories": 80,
        "ingredients": "Organic Apple",
        "vitamins": ["Vitamin C"],
        "healthNotes": "High in fiber."
      },
      "storageGuidance": "Keep cool. Keep away from bananas.",
      "safetyAdvisory": "Safe to consume."
    }
  ];

  @override
  void initState() {
    super.initState();
    _fetchSession();
  }

  Map<String, String> _getHeaders() {
    final email = _loggedInUser != null ? _loggedInUser!["email"] as String? ?? "" : "";
    return {
      "Content-Type": "application/json",
      "x-user-email": email,
    };
  }

  Future<void> _fetchSession() async {
    setState(() {
      _isLoading = true;
      _connError = null;
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final savedUserJson = prefs.getString("logged_in_user");
      if (savedUserJson != null) {
        setState(() {
          _loggedInUser = jsonDecode(savedUserJson) as Map<String, dynamic>;
        });
      }

      final sessionRes = await http.get(
        Uri.parse("$_backendUrl/auth/me"),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 3));
      final Map<String, dynamic> sessionData = jsonDecode(sessionRes.body);

      if (sessionRes.statusCode == 200 && sessionData["success"] == true) {
        setState(() {
          _loggedInUser = sessionData["user"];
        });
        await prefs.setString("logged_in_user", jsonEncode(sessionData["user"]));
        await _fetchInventory();
      } else {
        if (_loggedInUser != null) {
          await _fetchInventory();
        } else {
          setState(() {
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (_loggedInUser != null) {
        await _fetchInventory();
      } else {
        setState(() {
          _inventory = _localInventoryFallback;
          _isLoading = false;
          _connError = "Offline mode active";
        });
      }
    }
  }

  Future<void> _fetchInventory() async {
    try {
      final res = await http.get(
        Uri.parse("$_backendUrl/inventory"),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 3));
      if (res.statusCode == 200) {
        setState(() {
          _inventory = jsonDecode(res.body);
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _inventory = _localInventoryFallback;
        _isLoading = false;
      });
    }
  }

  Future<void> _updateItemStatus(String id, String state) async {
    try {
      final res = await http.put(
        Uri.parse("$_backendUrl/inventory/$id/status"),
        headers: _getHeaders(),
        body: jsonEncode({"state": state})
      );
      if (res.statusCode == 200) {
        _fetchInventory();
        _fetchSession(); 
      }
    } catch (e) {
      setState(() {
        _inventory.removeWhere((item) => item["_id"] == id);
      });
    }
  }

  Future<void> _deleteItem(String id) async {
    try {
      final res = await http.delete(
        Uri.parse("$_backendUrl/inventory/$id"),
        headers: _getHeaders(),
      );
      if (res.statusCode == 200) {
        _fetchInventory();
      }
    } catch (e) {
      setState(() {
        _inventory.removeWhere((item) => item["_id"] == id);
      });
    }
  }

  Future<void> _addManualItem(Map<String, dynamic> data) async {
    try {
      final res = await http.post(
        Uri.parse("$_backendUrl/manual"),
        headers: _getHeaders(),
        body: jsonEncode(data)
      );
      if (res.statusCode == 200) {
        _fetchInventory();
        setState(() {
          _activeRoute = "inventory";
        });
      }
    } catch (e) {
      setState(() {
        _inventory.add({
          "_id": "mock-m-${DateTime.now().millisecondsSinceEpoch}",
          "name": data["name"],
          "category": data["category"],
          "status": "Fresh",
          "state": "Tracked",
          "addedDate": DateTime.now().toIso8601String(),
          "predictedSpoilageDate": DateTime.now().add(Duration(days: data["shelfLifeDays"])).toIso8601String(),
          "originalFreshness": 95,
          "imageUrl": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200",
          "isCooked": data["isCooked"],
          "dietaryTags": ["vegan", "vegetarian"],
          "nutrition": {"calories": data["calories"], "ingredients": data["name"], "vitamins": ["C"], "healthNotes": ""},
          "storageGuidance": "Normal storage.",
          "safetyAdvisory": "Safe to consume."
        });
        _activeRoute = "inventory";
      });
    }
  }

  Future<void> _updatePreferences(Map<String, dynamic> updates) async {
    if (_loggedInUser == null) return;
    try {
      final updated = {..._loggedInUser!, ...updates};
      final res = await http.put(
        Uri.parse("$_backendUrl/auth/profile"),
        headers: _getHeaders(),
        body: jsonEncode(updated)
      );
      if (res.statusCode == 200) {
        final Map<String, dynamic> resData = jsonDecode(res.body);
        setState(() {
          _loggedInUser = resData["user"];
        });
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString("logged_in_user", jsonEncode(resData["user"]));
      }
    } catch (e) {
      setState(() {
        _loggedInUser = {..._loggedInUser!, ...updates};
      });
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString("logged_in_user", jsonEncode(_loggedInUser));
      } catch (_) {}
    }
  }

  void _handleLoginSuccess(Map<String, dynamic> user, String token) async {
    setState(() {
      _loggedInUser = user;
      _activeRoute = "dashboard";
    });
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString("logged_in_user", jsonEncode(user));
    } catch (_) {}
    _fetchInventory();
  }

  Future<void> _handleLogout() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove("logged_in_user");
    } catch (_) {}
    try {
      await http.post(
        Uri.parse("$_backendUrl/auth/logout"),
        headers: _getHeaders(),
      );
    } catch (e) {
      // Silently fail offline
    }
    setState(() {
      _loggedInUser = null;
      _activeRoute = "dashboard";
    });
  }

  Widget _buildActiveView() {
    if (_loggedInUser == null) {
      return LandingAuthScreen(
        onLoginSuccess: _handleLoginSuccess,
        backendUrl: _backendUrl,
      );
    }

    switch (_activeRoute) {
      case "dashboard":
        return DashboardScreen(
          inventory: _inventory,
          preferences: _loggedInUser!,
          onUpdateState: _updateItemStatus,
          onNavigate: (route, {status}) {
            setState(() {
              _activeRoute = route;
              if (status != null) {
                _pantryStatusFilter = status;
              }
            });
          },
        );
      case "scanner":
        return ScannerScreen(
          onScanComplete: (scans) => _fetchInventory(),
          onAddManual: _addManualItem,
          backendUrl: _backendUrl,
          email: _loggedInUser != null ? _loggedInUser!["email"] as String? ?? "" : "",
        );
      case "inventory":
        return InventoryScreen(
          inventory: _inventory,
          onUpdateState: _updateItemStatus,
          onDeleteItem: _deleteItem,
          initialStatusFilter: _pantryStatusFilter,
          onClearStatusFilter: () {
            setState(() {
              _pantryStatusFilter = "all";
            });
          },
        );
      case "recipes":
        return RecipesScreen(
          preferences: _loggedInUser!,
          onUpdatePreferences: _updatePreferences,
          backendUrl: _backendUrl,
          inventory: _inventory,
        );
      case "analytics":
        return AnalyticsScreen(backendUrl: _backendUrl);
      case "eco":
        return EcoImpactScreen(backendUrl: _backendUrl);
      case "household":
        return CoOpHouseholdScreen(backendUrl: _backendUrl, userName: _loggedInUser!["name"]);
      case "community":
        return CommunityCatalogScreen(backendUrl: _backendUrl, userName: _loggedInUser!["name"]);
      case "settings":
        return ProfileSettingsScreen(
          preferences: _loggedInUser!,
          onUpdatePreferences: _updatePreferences,
        );
      case "recipes-gourmet":
        return GourmetUpgradeScreen(
          onNavigateBack: () => setState(() => _activeRoute = "dashboard"),
        );
      default:
        return MockScreenWidget(
          activeRoute: _activeRoute,
          screenName: _getScreenName(_activeRoute),
          onNavigateBack: () => setState(() => _activeRoute = "dashboard"),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final showDrawer = _loggedInUser != null;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const FreshRadarLogo(size: 32),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                RichText(
                  text: const TextSpan(
                    style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w800, fontSize: 16, letterSpacing: -0.5),
                    children: [
                      TextSpan(text: "Fresh", style: TextStyle(color: Colors.white)),
                      TextSpan(text: "Radar", style: TextStyle(color: Color(0xFF00E676))),
                    ],
                  ),
                ),
                const Text(
                  "SMART FOOD FRESHNESS TRACKING",
                  style: TextStyle(fontSize: 5.5, fontWeight: FontWeight.w600, color: Colors.grey, letterSpacing: 0.5),
                ),
              ],
            ),
            const SizedBox(width: 8),
            if (_connError != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: Colors.orange.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                child: const Text("OFFLINE", style: TextStyle(fontSize: 8, color: Colors.orange, fontWeight: FontWeight.bold)),
              )
          ],
        ),
        backgroundColor: const Color(0xFF0F1420).withOpacity(0.6),
        actions: [
          if (showDrawer)
            IconButton(
              icon: const Icon(Icons.refresh, color: Color(0xFF00E676)),
              onPressed: () {
                _fetchInventory();
                _fetchSession();
              },
            )
        ],
      ),
      drawer: showDrawer
          ? Drawer(
              backgroundColor: const Color(0xFF0B0C10),
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  UserAccountsDrawerHeader(
                    decoration: const BoxDecoration(color: Color(0xFF0F1420)),
                    accountName: Text(
                      _loggedInUser!["name"] ?? "User",
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    accountEmail: Text(
                      _loggedInUser!["email"] ?? "",
                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                    currentAccountPicture: CircleAvatar(
                      backgroundColor: const Color(0xFF00E676),
                      child: Text(
                        (_loggedInUser!["name"] as String).substring(0, 2).toUpperCase(),
                        style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  ..._sidebarCategories.map((cat) {
                    final title = cat["title"] as String;
                    final icon = cat["icon"] as String;
                    final screens = cat["screens"] as List;
                    
                    return Theme(
                      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                      child: ExpansionTile(
                        leading: Text(icon, style: const TextStyle(fontSize: 18)),
                        title: Text(
                          title,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        iconColor: const Color(0xFF00E676),
                        collapsedIconColor: Colors.white60,
                        children: screens.map((screen) {
                          final id = screen["id"] as String;
                          final name = screen["name"] as String;
                          final sIcon = screen["icon"] as String;
                          final isSelected = _activeRoute == id;
                          
                          return ListTile(
                            contentPadding: const EdgeInsets.only(left: 32, right: 16),
                            leading: Text(sIcon, style: const TextStyle(fontSize: 16)),
                            title: Text(
                              name,
                              style: TextStyle(
                                color: isSelected ? const Color(0xFF00E676) : Colors.white70,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                fontSize: 12,
                              ),
                            ),
                            selected: isSelected,
                            selectedTileColor: Colors.white.withOpacity(0.03),
                            onTap: () {
                              Navigator.pop(context);
                              setState(() {
                                _activeRoute = id;
                              });
                            },
                          );
                        }).toList(),
                      ),
                    );
                  }).toList(),
                  const Divider(color: Colors.white12),
                  ListTile(
                    leading: const Icon(Icons.exit_to_app, color: Color(0xFFFF1744)),
                    title: const Text("Sign Out", style: TextStyle(color: Color(0xFFFF1744))),
                    onTap: () {
                      Navigator.pop(context);
                      _handleLogout();
                    },
                  )
                ],
              ),
            )
          : null,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF00E676)))
          : _buildActiveView(),
    );
  }

  Widget _buildDrawerTile(String title, String route) {
    final isSelected = _activeRoute == route;
    return ListTile(
      title: Text(title, style: TextStyle(color: isSelected ? const Color(0xFF00E676) : Colors.white70, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
      selected: isSelected,
      selectedTileColor: Colors.white.withOpacity(0.03),
      onTap: () {
        Navigator.pop(context);
        setState(() {
          _activeRoute = route;
        });
      },
    );
  }
}

// ----------------------------------------------------
// SCREEN 1: LANDING PAGE & SECURITY AUTHENTICATION (6 Screens)
// ----------------------------------------------------
class LandingAuthScreen extends StatefulWidget {
  final Function(Map<String, dynamic>, String) onLoginSuccess;
  final String backendUrl;

  const LandingAuthScreen({
    super.key,
    required this.onLoginSuccess,
    required this.backendUrl,
  });

  @override
  State<LandingAuthScreen> createState() => _LandingAuthScreenState();
}

class _LandingAuthScreenState extends State<LandingAuthScreen> {
  String _state = "landing"; // landing, login, signup, forgot, otp
  
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();

  String? _error;
  String? _success;

  Future<void> _submitLogin() async {
    setState(() => _error = null);
    try {
      final res = await http.post(
        Uri.parse("${widget.backendUrl}/auth/login"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"email": _emailCtrl.text, "password": _passCtrl.text})
      );
      final Map<String, dynamic> data = jsonDecode(res.body);
      if (res.statusCode == 200 && data["success"] == true) {
        widget.onLoginSuccess(data["user"], data["token"]);
      } else {
        setState(() => _error = data["message"] ?? "Invalid credentials");
      }
    } catch (e) {
      setState(() => _error = "Offline database login. Use matching seeds.");
      if (_emailCtrl.text == "jasvina@foodfreshness.com" && _passCtrl.text == "password123") {
        widget.onLoginSuccess({
          "email": "jasvina@foodfreshness.com",
          "name": "C. Jasvina",
          "dietaryPreferences": ["vegetarian"],
          "audienceMode": "Regular",
          "servings": 2,
          "notificationPref": {"advanceNoticeDays": 2, "emailAlerts": true, "inAppAlerts": true},
          "healthScore": 88,
          "streakCount": 5,
          "unlockedBadges": ["Fresh Starter", "Waste Warrior"]
        }, "mock-token");
      } else if (_emailCtrl.text == "ram@gmail.com" && _passCtrl.text == "Ram@1234") {
        widget.onLoginSuccess({
          "email": "ram@gmail.com",
          "name": "Ram",
          "dietaryPreferences": ["vegetarian"],
          "audienceMode": "Regular",
          "servings": 2,
          "notificationPref": {"advanceNoticeDays": 2, "emailAlerts": true, "inAppAlerts": true},
          "healthScore": 100,
          "streakCount": 1,
          "unlockedBadges": ["Fresh Starter"]
        }, "mock-token");
      }
    }
  }

  Future<void> _submitSignup() async {
    setState(() => _error = null);
    
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      setState(() => _error = "Name is required.");
      return;
    }
    final nameRegExp = RegExp(r'^[a-zA-Z\s.\-]+$');
    if (!nameRegExp.hasMatch(name)) {
      setState(() => _error = "Please enter a valid name (alphabetic characters only).");
      return;
    }

    try {
      final res = await http.post(
        Uri.parse("${widget.backendUrl}/auth/signup"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"email": _emailCtrl.text, "password": _passCtrl.text, "name": name})
      );
      final Map<String, dynamic> data = jsonDecode(res.body);
      if (res.statusCode == 200 && data["success"] == true) {
        setState(() {
          _success = "Verification code sent to your email address.";
          _state = "otp";
        });
      } else {
        setState(() => _error = data["message"] ?? "Registration failed");
      }
    } catch (e) {
      setState(() => _error = "Cannot connect to server. Check your network.");
    }
  }

  Future<void> _submitForgotPassword() async {
    setState(() => _error = null);
    try {
      final res = await http.post(
        Uri.parse("${widget.backendUrl}/auth/send-otp"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"email": _emailCtrl.text})
      );
      final Map<String, dynamic> data = jsonDecode(res.body);
      if (res.statusCode == 200 && data["success"] == true) {
        setState(() {
          _success = data["message"] ?? "Verification code sent to your email.";
          _state = "otp";
        });
      } else {
        setState(() => _error = data["message"] ?? "Failed to send recovery OTP.");
      }
    } catch (e) {
      setState(() => _error = "Cannot connect to server. Check your network.");
    }
  }

  Future<void> _submitOtp() async {
    setState(() => _error = null);
    if (_otpCtrl.text.length != 4) {
      setState(() => _error = "Verification code must be exactly 4 digits.");
      return;
    }
    try {
      final res = await http.post(
        Uri.parse("${widget.backendUrl}/auth/verify-otp"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"email": _emailCtrl.text, "code": _otpCtrl.text})
      );
      final Map<String, dynamic> data = jsonDecode(res.body);
      if (res.statusCode == 200 && data["success"] == true) {
        widget.onLoginSuccess({
          "email": _emailCtrl.text,
          "name": _nameCtrl.text.isEmpty ? "New User" : _nameCtrl.text,
          "dietaryPreferences": [],
          "audienceMode": "Regular",
          "servings": 2,
          "notificationPref": {"advanceNoticeDays": 2, "emailAlerts": true, "inAppAlerts": true},
          "healthScore": 100,
          "streakCount": 1,
          "unlockedBadges": ["Fresh Starter"]
        }, "mock-token");
      } else {
        setState(() => _error = data["message"] ?? "Invalid verification code.");
      }
    } catch (e) {
      setState(() => _error = "Cannot connect to server. Check your network.");
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_state == "landing") {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const FreshRadarLogo(size: 64),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      RichText(
                        text: const TextSpan(
                          style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w900, fontSize: 32, letterSpacing: -1.0),
                          children: [
                            TextSpan(text: "Fresh", style: TextStyle(color: Colors.white)),
                            TextSpan(text: "Radar", style: TextStyle(color: Color(0xFF00E676))),
                          ],
                        ),
                      ),
                      const Text(
                        "SMART FOOD FRESHNESS TRACKING",
                        style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.w700, color: Colors.grey, letterSpacing: 0.8),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                "AI visual scans, zero waste recipes, shared co-ops, neighbors food boards, and carbon calculators.",
                style: TextStyle(color: Colors.grey, fontSize: 13),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black, minimumSize: const Size(double.infinity, 50)),
                onPressed: () => setState(() => _state = "signup"),
                child: const Text("Create Free Account", style: TextStyle(fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.white10, foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 50)),
                onPressed: () => setState(() => _state = "login"),
                child: const Text("Sign In"),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_state == "login" ? "Sign In" : (_state == "signup" ? "Create Account" : (_state == "otp" ? "OTP Verification" : "Recovery")), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              
              if (_error != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(color: const Color(0xFFFF1744).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                  child: Text(_error!, style: const TextStyle(color: Color(0xFFFF1744), fontSize: 11)),
                ),

              if (_state == "login") ...[
                TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: "Email address", border: OutlineInputBorder())),
                const SizedBox(height: 12),
                TextField(controller: _passCtrl, obscureText: true, decoration: const InputDecoration(labelText: "Password", border: OutlineInputBorder())),
                const SizedBox(height: 20),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black, minimumSize: const Size(double.infinity, 50)),
                  onPressed: _submitLogin,
                  child: const Text("Sign In", style: TextStyle(fontWeight: FontWeight.bold)),
                ),
                TextButton(onPressed: () => setState(() => _state = "forgot"), child: const Text("Forgot password?", style: TextStyle(color: Colors.grey))),
                TextButton(onPressed: () => setState(() => _state = "signup"), child: const Text("Create Free Account", style: TextStyle(color: Color(0xFF00E676)))),
              ],

              if (_state == "signup") ...[
                TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: "Your Full Name", border: OutlineInputBorder())),
                const SizedBox(height: 12),
                TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: "Email address", border: OutlineInputBorder())),
                const SizedBox(height: 12),
                TextField(controller: _passCtrl, obscureText: true, decoration: const InputDecoration(labelText: "Create Password", border: OutlineInputBorder())),
                const SizedBox(height: 20),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black, minimumSize: const Size(double.infinity, 50)),
                  onPressed: _submitSignup,
                  child: const Text("Register Account", style: TextStyle(fontWeight: FontWeight.bold)),
                ),
                TextButton(onPressed: () => setState(() => _state = "login"), child: const Text("Already have an account? Login", style: TextStyle(color: Colors.grey))),
              ],

              if (_state == "otp") ...[
                Text(_success ?? "Please enter the 4-digit code sent to your email.", style: const TextStyle(color: Colors.orange, fontSize: 12)),
                const SizedBox(height: 12),
                TextField(
                  controller: _otpCtrl,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 22, letterSpacing: 10),
                  decoration: const InputDecoration(labelText: "Verification Code", border: OutlineInputBorder()),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black, minimumSize: const Size(double.infinity, 50)),
                  onPressed: _submitOtp,
                  child: const Text("Verify & Login", style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],

              if (_state == "forgot") ...[
                TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: "Registered Email", border: OutlineInputBorder())),
                const SizedBox(height: 20),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black, minimumSize: const Size(double.infinity, 50)),
                  onPressed: _submitForgotPassword,
                  child: const Text("Send Recovery PIN", style: TextStyle(fontWeight: FontWeight.bold)),
                ),
                TextButton(onPressed: () => setState(() => _state = "login"), child: const Text("Back to Login", style: TextStyle(color: Colors.grey))),
              ]
            ],
          ),
        ),
      ),
    );
  }
}

// ----------------------------------------------------
// SCREEN 2: DASHBOARD SCREEN
// ----------------------------------------------------
class DashboardScreen extends StatelessWidget {
  final List<dynamic> inventory;
  final Map<String, dynamic> preferences;
  final Function(String, String) onUpdateState;
  final Function(String, {String? status}) onNavigate;

  const DashboardScreen({
    super.key,
    required this.inventory,
    required this.preferences,
    required this.onUpdateState,
    required this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    final activeItems = inventory.where((item) => item["state"] == "Tracked").toList();
    final freshCount = activeItems.where((item) => item["status"] == "Fresh").length;
    final warningCount = activeItems.where((item) => item["status"] == "Slightly Spoiled").length;
    final spoiledCount = activeItems.where((item) => item["status"] == "Spoiled").length;

    final alarms = activeItems.map((item) {
      final spoilageDate = DateTime.parse(item["predictedSpoilageDate"]);
      final daysDiff = spoilageDate.difference(DateTime.now()).inDays + 1;
      
      if (item["status"] == "Spoiled" || daysDiff <= 0) {
        return {"id": item["_id"], "name": item["name"], "type": "critical", "isSpoiled": true, "msg": "Spoiled: Avoid consuming ${item["name"]}!"};
      } else if (daysDiff == 1) {
        return {"id": item["_id"], "name": item["name"], "type": "urgent", "isSpoiled": false, "msg": "Urgent Alert (Stage 2): Consume ${item["name"]} today!"};
      } else if (daysDiff == 2) {
        return {"id": item["_id"], "name": item["name"], "type": "warning", "isSpoiled": false, "msg": "Proactive Alert (Stage 1): ${item["name"]} will spoil in 2 days."};
      }
      return null;
    }).where((element) => element != null).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Smart Freshness", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                  Text("Streak Tracker 🔥 ${preferences["streakCount"]} Days", style: const TextStyle(color: Colors.orange, fontSize: 13, fontWeight: FontWeight.bold)),
                ],
              ),
              Container(
                decoration: BoxDecoration(color: const Color(0xFF00E676).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                child: Text("Health score: ${preferences["healthScore"]}", style: const TextStyle(color: Color(0xFF00E676), fontWeight: FontWeight.bold)),
              )
            ],
          ),
          const SizedBox(height: 20),

          if (alarms.isNotEmpty) ...[
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFFFF1744).withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFF1744).withOpacity(0.3)),
              ),
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.only(bottom: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("🚨 ACTIVE SPOILAGE ALERTS", style: TextStyle(color: Color(0xFFFF1744), fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 10),
                  ...alarms.map((alarm) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(child: Text(alarm!["msg"]!, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500))),
                        alarm["isSpoiled"] != true
                            ? Row(
                                children: [
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black, padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), minimumSize: Size.zero),
                                    onPressed: () => onUpdateState(alarm["id"]!, "Used"),
                                    child: const Text("✅ Used", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                  ),
                                  const SizedBox(width: 4),
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF1744).withOpacity(0.1), foregroundColor: const Color(0xFFFF1744), padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), minimumSize: Size.zero, side: const BorderSide(color: Color(0xFFFF1744), width: 0.5)),
                                    onPressed: () => onUpdateState(alarm["id"]!, "Wasted"),
                                    child: const Text("🗑️ Not Used", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                  )
                                ],
                              )
                            : const Text("⚠️ Discard Recommended", style: TextStyle(color: Color(0xFFFF1744), fontSize: 10, fontWeight: FontWeight.bold))
                      ],
                    ),
                  )),
                ],
              ),
            ),
          ],

          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => onNavigate("inventory", status: "Fresh"),
                  child: _buildMetricTile("FRESH", freshCount, const Color(0xFF00E676)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () => onNavigate("inventory", status: "Warning"),
                  child: _buildMetricTile("WARNING", warningCount, const Color(0xFFFFEA00)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () => onNavigate("inventory", status: "Spoiled"),
                  child: _buildMetricTile("SPOILED", spoiledCount, const Color(0xFFFF1744)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Real-Time Inventory Status", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              TextButton(onPressed: () => onNavigate("inventory"), child: const Text("View All", style: TextStyle(color: Color(0xFF00E676))))
            ],
          ),

          if (activeItems.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Column(
                  children: [
                    const Text("Inventory is empty", style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 8),
                    ElevatedButton(onPressed: () => onNavigate("scanner"), child: const Text("Scan Food")),
                  ],
                ),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: activeItems.length.clamp(0, 4),
              itemBuilder: (context, index) {
                final item = activeItems[index];
                
                final totalDur = DateTime.parse(item["predictedSpoilageDate"]).difference(DateTime.parse(item["addedDate"])).inSeconds;
                final elapsed = DateTime.now().difference(DateTime.parse(item["addedDate"])).inSeconds;
                double pct = 1.0 - (elapsed / totalDur);
                pct = pct.clamp(0.0, 1.0);
                final freshnessPct = (item["originalFreshness"] * pct).round();
                
                final statusColor = freshnessPct > 70 ? const Color(0xFF00E676) : (freshnessPct > 30 ? const Color(0xFFFFEA00) : const Color(0xFFFF1744));

                return Container(
                  margin: const EdgeInsets.symmetric(vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.02),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withOpacity(0.05))
                  ),
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(item["imageUrl"], width: 44, height: 44, fit: BoxFit.cover, errorBuilder: (c, e, s) => const Icon(Icons.fastfood, size: 44)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item["name"], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                Text("${item["category"]} • ${item["isCooked"] ? "Cooked" : "Raw"}", style: const TextStyle(color: Colors.grey, fontSize: 11)),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text("$freshnessPct%", style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 13)),
                              Text(item["status"], style: TextStyle(color: statusColor.withOpacity(0.8), fontSize: 11)),
                            ],
                          )
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(2),
                        child: LinearProgressIndicator(
                          value: pct,
                          backgroundColor: Colors.white12,
                          color: statusColor,
                          minHeight: 4,
                        ),
                      )
                    ],
                  ),
                );
              },
            )
        ],
      ),
    );
  }

  Widget _buildMetricTile(String label, int val, Color color) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2), width: 1.5)
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
          const SizedBox(height: 6),
          Text("$val", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }
}

// ----------------------------------------------------
// ----------------------------------------------------
// SCREEN 3: VISUAL SCANNER SCREEN
// ----------------------------------------------------
class ScannerScreen extends StatefulWidget {
  final Function(dynamic) onScanComplete;
  final Function(Map<String, dynamic>) onAddManual;
  final String backendUrl;
  final String email;

  const ScannerScreen({
    super.key,
    required this.onScanComplete,
    required this.onAddManual,
    required this.backendUrl,
    required this.email,
  });

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  bool _useManual = false;
  bool _isScanning = false;
  String? _error;
  List<dynamic>? _results;
  String? _pickedImagePath; // local path for preview

  // Manual form
  final _nameCtrl = TextEditingController();
  String _cat      = "fruits";
  int    _life     = 5;
  bool   _isCooked = false;
  int    _cals     = 100;

  final Map<String, Map<String, dynamic>> foodAutocompleteDB = {
    "apple": {"category": "fruits", "shelfLife": 14, "calories": 52, "isCooked": false},
    "banana": {"category": "fruits", "shelfLife": 7, "calories": 89, "isCooked": false},
    "orange": {"category": "fruits", "shelfLife": 10, "calories": 47, "isCooked": false},
    "strawberry": {"category": "fruits", "shelfLife": 4, "calories": 32, "isCooked": false},
    "grape": {"category": "fruits", "shelfLife": 7, "calories": 67, "isCooked": false},
    "mango": {"category": "fruits", "shelfLife": 5, "calories": 60, "isCooked": false},
    "blueberry": {"category": "fruits", "shelfLife": 6, "calories": 57, "isCooked": false},
    "pineapple": {"category": "fruits", "shelfLife": 5, "calories": 50, "isCooked": false},
    "watermelon": {"category": "fruits", "shelfLife": 7, "calories": 30, "isCooked": false},
    "lemon": {"category": "fruits", "shelfLife": 14, "calories": 29, "isCooked": false},
    "peach": {"category": "fruits", "shelfLife": 5, "calories": 39, "isCooked": false},
    "pear": {"category": "fruits", "shelfLife": 6, "calories": 57, "isCooked": false},
    "cherry": {"category": "fruits", "shelfLife": 4, "calories": 50, "isCooked": false},
    "kiwi": {"category": "fruits", "shelfLife": 7, "calories": 61, "isCooked": false},
    "avocado": {"category": "fruits", "shelfLife": 4, "calories": 160, "isCooked": false},
    "carrot": {"category": "vegetables", "shelfLife": 21, "calories": 41, "isCooked": false},
    "broccoli": {"category": "vegetables", "shelfLife": 7, "calories": 34, "isCooked": false},
    "spinach": {"category": "vegetables", "shelfLife": 5, "calories": 23, "isCooked": false},
    "tomato": {"category": "vegetables", "shelfLife": 7, "calories": 18, "isCooked": false},
    "potato": {"category": "vegetables", "shelfLife": 30, "calories": 77, "isCooked": false},
    "onion": {"category": "vegetables", "shelfLife": 30, "calories": 40, "isCooked": false},
    "garlic": {"category": "vegetables", "shelfLife": 60, "calories": 149, "isCooked": false},
    "cucumber": {"category": "vegetables", "shelfLife": 7, "calories": 15, "isCooked": false},
    "lettuce": {"category": "vegetables", "shelfLife": 5, "calories": 15, "isCooked": false},
    "cabbage": {"category": "vegetables", "shelfLife": 14, "calories": 25, "isCooked": false},
    "mushroom": {"category": "vegetables", "shelfLife": 5, "calories": 22, "isCooked": false},
    "milk": {"category": "packaged food", "shelfLife": 7, "calories": 42, "isCooked": false},
    "cheese": {"category": "packaged food", "shelfLife": 21, "calories": 402, "isCooked": false},
    "yogurt": {"category": "packaged food", "shelfLife": 14, "calories": 59, "isCooked": false},
    "bread": {"category": "packaged food", "shelfLife": 6, "calories": 265, "isCooked": false},
    "eggs": {"category": "packaged food", "shelfLife": 21, "calories": 155, "isCooked": false},
    "chicken": {"category": "packaged food", "shelfLife": 3, "calories": 165, "isCooked": false},
    "beef": {"category": "packaged food", "shelfLife": 3, "calories": 250, "isCooked": false},
    "fish": {"category": "packaged food", "shelfLife": 2, "calories": 206, "isCooked": false},
    "rice": {"category": "cooked food", "shelfLife": 4, "calories": 130, "isCooked": true},
    "pasta": {"category": "cooked food", "shelfLife": 4, "calories": 131, "isCooked": true},
    "soup": {"category": "cooked food", "shelfLife": 3, "calories": 50, "isCooked": true},
    "pizza": {"category": "cooked food", "shelfLife": 3, "calories": 266, "isCooked": true}
  };

  void _onNameChanged(String val) {
    final key = val.toLowerCase().trim();
    if (foodAutocompleteDB.containsKey(key)) {
      final match = foodAutocompleteDB[key]!;
      setState(() {
        _cat = match["category"] as String;
        _life = match["shelfLife"] as int;
        _cals = match["calories"] as int;
        _isCooked = match["isCooked"] as bool;
      });
      return;
    }
    final matchedKey = foodAutocompleteDB.keys.firstWhere(
      (k) => key.contains(k) || k.contains(key),
      orElse: () => "",
    );
    if (matchedKey.isNotEmpty && key.length > 2) {
      final match = foodAutocompleteDB[matchedKey]!;
      setState(() {
        _cat = match["category"] as String;
        _life = match["shelfLife"] as int;
        _cals = match["calories"] as int;
        _isCooked = match["isCooked"] as bool;
      });
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickAndScan(bool fromCamera) async {
    try {
      final picker = ImagePicker();
      final XFile? xFile = await picker.pickImage(
        source: fromCamera ? ImageSource.camera : ImageSource.gallery,
        imageQuality: 85,
        maxWidth: 1024,
        maxHeight: 1024,
      );
      if (xFile == null) return; // user cancelled

      setState(() {
        _isScanning = true;
        _error      = null;
        _results    = null;
        _pickedImagePath = xFile.path;
      });

      final uri     = Uri.parse("${widget.backendUrl}/scan");
      final request = http.MultipartRequest("POST", uri);
      request.headers["x-user-email"] = widget.email;
      request.files.add(await http.MultipartFile.fromPath("image", xFile.path));

      final streamed  = await request.send().timeout(const Duration(seconds: 30));
      final response  = await http.Response.fromStream(streamed);
      final Map<String, dynamic> data = jsonDecode(response.body);

      if (response.statusCode == 200 && data["success"] == true) {
        setState(() {
          _results    = data["scannedItems"];
          _isScanning = false;
        });
        widget.onScanComplete(data["scannedItems"]);
      } else {
        setState(() {
          _error      = data["message"] ?? "Scan rejected.";
          _isScanning = false;
        });
      }
    } catch (e) {
      setState(() {
        _error      = "Cannot reach server. Check your connection and that the backend is running.";
        _isScanning = false;
      });
    }
  }

  void _reset() => setState(() {
    _results         = null;
    _error           = null;
    _pickedImagePath = null;
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("AI Visual Freshness Scanner",
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          const Text(
            "Take a photo or upload one   the AI identifies the food and "
            "estimates freshness automatically. No labels or dropdowns.",
            style: TextStyle(color: Colors.grey, fontSize: 12),
          ),
          const SizedBox(height: 20),

          // -- Mode tabs --
          Row(children: [
            Expanded(child: _modeBtn("?? Camera / Gallery", !_useManual,
                () { setState(() => _useManual = false); _reset(); })),
            const SizedBox(width: 10),
            Expanded(child: _modeBtn("?? Manual Entry", _useManual,
                () => setState(() => _useManual = true))),
          ]),
          const SizedBox(height: 20),

          if (!_useManual) _buildScannerTab() else _buildManualTab(),
        ],
      ),
    );
  }

  // -- Scanner tab ----------------------------------------------------------
  Widget _buildScannerTab() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // How-it-works banner
      Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF00E676).withOpacity(0.05),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFF00E676).withOpacity(0.2)),
        ),
        child: const Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text("?? ", style: TextStyle(fontSize: 16)),
          Expanded(child: Text(
            "The AI uses MobileNetV3 (1 000 ImageNet classes). It identifies the food, "
            "cross-checks colours, and rejects mismatches   a cauliflower photo will "
            "never be accepted as an apple.",
            style: TextStyle(color: Colors.grey, fontSize: 11, height: 1.5),
          )),
        ]),
      ),
      const SizedBox(height: 16),

      // Pick buttons
      if (!_isScanning && _results == null && _error == null) ...[
        Row(children: [
          Expanded(child: ElevatedButton.icon(
            icon: const Icon(Icons.camera_alt),
            label: const Text("Take Photo"),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00E676),
              foregroundColor: Colors.black,
              minimumSize: const Size(0, 52),
            ),
            onPressed: () => _pickAndScan(true),
          )),
          const SizedBox(width: 10),
          Expanded(child: ElevatedButton.icon(
            icon: const Icon(Icons.photo_library),
            label: const Text("Upload Image"),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white10,
              foregroundColor: Colors.white,
              minimumSize: const Size(0, 52),
            ),
            onPressed: () => _pickAndScan(false),
          )),
        ]),
        const SizedBox(height: 12),
        const Center(child: Text(
          "Supports JPG   PNG   WEBP   any photo from your gallery or camera",
          style: TextStyle(color: Colors.grey, fontSize: 10),
        )),
      ],

      // Scanning spinner
      if (_isScanning) ...[
        const SizedBox(height: 20),
        Center(child: Column(children: [
          const CircularProgressIndicator(color: Color(0xFF00E676)),
          const SizedBox(height: 16),
          const Text("Analysing food composition ",
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text(
            "Running MobileNetV3   cross-validating colours   estimating freshness",
            style: TextStyle(color: Colors.grey, fontSize: 11),
            textAlign: TextAlign.center,
          ),
        ])),
        const SizedBox(height: 20),
      ],

      // Error card
      if (_error != null) ...[
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFFF1744).withOpacity(0.06),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFFF1744).withOpacity(0.3)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Row(children: [
              Icon(Icons.warning_amber_rounded, color: Color(0xFFFF1744), size: 18),
              SizedBox(width: 6),
              Text("Scan Rejected", style: TextStyle(
                  color: Color(0xFFFF1744), fontWeight: FontWeight.bold)),
            ]),
            const SizedBox(height: 8),
            Text(_error!, style: const TextStyle(color: Colors.grey, fontSize: 12, height: 1.4)),
            const SizedBox(height: 12),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white10, foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 40)),
              onPressed: _reset,
              child: const Text("Try Again"),
            ),
          ]),
        ),
      ],

      // Results
      if (_results != null && _results!.isNotEmpty) ...[
        const SizedBox(height: 16),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text("? ${_results!.length} Item${_results!.length > 1 ? 's' : ''} Detected",
              style: const TextStyle(
                  color: Color(0xFF00E676), fontWeight: FontWeight.bold, fontSize: 15)),
          TextButton(onPressed: _reset, child: const Text("Scan Another",
              style: TextStyle(color: Colors.grey, fontSize: 12))),
        ]),
        const SizedBox(height: 10),
        ..._results!.map((item) => _buildResultCard(item, _pickedImagePath)),
      ],
    ]);
  }

  Widget _buildResultCard(dynamic item, String? imagePath) {
    final status     = item["status"] as String? ?? "Fresh";
    final freshness  = item["originalFreshness"] as int? ?? 85;
    final confidence = item["confidence"];

    final statusColor = status == "Fresh"
        ? const Color(0xFF00E676)
        : status == "Slightly Spoiled"
            ? const Color(0xFFFFEA00)
            : const Color(0xFFFF1744);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.015),
        borderRadius: BorderRadius.circular(14),
        border: Border(left: BorderSide(color: statusColor, width: 5)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Expanded(child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (imagePath != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.file(
                  File(imagePath),
                  width: 54, height: 54, fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const SizedBox(width: 54, height: 54),
                ),
              ),
            if (imagePath != null) const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(item["name"] ?? "Unknown",
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              const SizedBox(height: 2),
              Text(
                "${item["category"] ?? ""}   ${item["isCooked"] == true ? "Cooked" : "Raw"}",
                style: const TextStyle(color: Colors.grey, fontSize: 11),
              ),
            ])),
          ])),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: statusColor.withOpacity(0.4)),
              ),
              child: Text("$status   $freshness%",
                  style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold)),
            ),
            if (confidence != null) ...[
              const SizedBox(height: 4),
              Text("?? AI: $confidence%",
                  style: const TextStyle(color: Colors.grey, fontSize: 9)),
            ],
          ]),
        ]),
        const SizedBox(height: 10),
        // Freshness bar
        ClipRRect(
          borderRadius: BorderRadius.circular(3),
          child: LinearProgressIndicator(
            value: freshness / 100.0,
            backgroundColor: Colors.white12,
            color: statusColor,
            minHeight: 5,
          ),
        ),
        const SizedBox(height: 10),
        Text("??? ${item["storageGuidance"] ?? ""}",
            style: const TextStyle(color: Colors.grey, fontSize: 11, height: 1.4)),
        const SizedBox(height: 4),
        Text(
          "??? ${item["safetyAdvisory"] ?? ""}",
          style: TextStyle(
            color: status == "Spoiled" ? const Color(0xFFFF1744) : Colors.grey,
            fontSize: 11, height: 1.4,
          ),
        ),
      ]),
    );
  }

  // -- Manual entry tab -----------------------------------------------------
  Widget _buildManualTab() {
    final cats = ["fruits", "vegetables", "cooked food", "packaged food"];
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: const Color(0xFFFFEA00).withOpacity(0.04),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFFFEA00).withOpacity(0.15)),
        ),
        child: const Text(
          "?? Use this when the AI scanner can't identify an item (poor lighting, unusual packaging, etc.).",
          style: TextStyle(color: Colors.grey, fontSize: 11, height: 1.4),
        ),
      ),
      const SizedBox(height: 16),
      TextField(
        controller: _nameCtrl,
        onChanged: _onNameChanged,
        decoration: const InputDecoration(
          labelText: "Food item name",
          hintText: "e.g. Organic Strawberries",
          border: OutlineInputBorder(),
        ),
      ),
      const SizedBox(height: 12),
      DropdownButtonFormField<String>(
        value: _cat,
        decoration: const InputDecoration(labelText: "Category", border: OutlineInputBorder()),
        dropdownColor: const Color(0xFF13151B),
        items: cats.map((c) => DropdownMenuItem(
          value: c,
          child: Text(c[0].toUpperCase() + c.substring(1)),
        )).toList(),
        onChanged: (v) => setState(() => _cat = v!),
      ),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: TextField(
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: "Shelf-life (days)", border: OutlineInputBorder()),
          onChanged: (v) => _life = int.tryParse(v) ?? 5,
          controller: TextEditingController(text: "$_life"),
        )),
        const SizedBox(width: 12),
        Expanded(child: TextField(
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: "Calories (kcal)", border: OutlineInputBorder()),
          onChanged: (v) => _cals = int.tryParse(v) ?? 100,
          controller: TextEditingController(text: "$_cals"),
        )),
      ]),
      const SizedBox(height: 12),
      CheckboxListTile(
        title: const Text("Already cooked / ready to eat?", style: TextStyle(fontSize: 13)),
        value: _isCooked,
        activeColor: const Color(0xFF00E676),
        onChanged: (v) => setState(() => _isCooked = v!),
        contentPadding: EdgeInsets.zero,
      ),
      const SizedBox(height: 16),
      ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF00E676),
          foregroundColor: Colors.black,
          minimumSize: const Size(double.infinity, 50),
        ),
        onPressed: () {
          if (_nameCtrl.text.trim().isEmpty) return;
          widget.onAddManual({
            "name": _nameCtrl.text.trim(),
            "category": _cat,
            "shelfLifeDays": _life,
            "isCooked": _isCooked,
            "calories": _cals,
          });
          _nameCtrl.clear();
          setState(() => _useManual = false);
        },
        child: const Text("Save to Inventory", style: TextStyle(fontWeight: FontWeight.bold)),
      ),
    ]);
  }

  Widget _modeBtn(String label, bool active, VoidCallback onTap) => ElevatedButton(
    style: ElevatedButton.styleFrom(
      backgroundColor: active
          ? const Color(0xFF00E676).withOpacity(0.15)
          : Colors.transparent,
      foregroundColor: active ? const Color(0xFF00E676) : Colors.grey,
      side: BorderSide(
        color: active ? const Color(0xFF00E676) : Colors.white12,
      ),
      minimumSize: const Size(0, 44),
    ),
    onPressed: onTap,
    child: Text(label, style: const TextStyle(fontSize: 12)),
  );
}


// ----------------------------------------------------
// SCREEN 4: INVENTORY TRACKER SCREEN
// ----------------------------------------------------
class InventoryScreen extends StatefulWidget {
  final List<dynamic> inventory;
  final Function(String, String) onUpdateState;
  final Function(String) onDeleteItem;
  final String initialStatusFilter;
  final VoidCallback onClearStatusFilter;

  const InventoryScreen({
    super.key,
    required this.inventory,
    required this.onUpdateState,
    required this.onDeleteItem,
    required this.initialStatusFilter,
    required this.onClearStatusFilter,
  });

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  String _tempMode = "Cool";
  String _activeCategory = "all";
  final Set<String> _markedUsed = {};
  late String _statusFilter;

  @override
  void initState() {
    super.initState();
    _statusFilter = widget.initialStatusFilter;
  }

  @override
  void didUpdateWidget(InventoryScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialStatusFilter != oldWidget.initialStatusFilter) {
      setState(() {
        _statusFilter = widget.initialStatusFilter;
      });
    }
  }

  String _getAdvisory(dynamic item) {
    if (_tempMode == "Hot") {
      final cat = item["category"];
      if (cat == "fruits" || cat == "vegetables") return "⚠️ High temp (32°C): move to fridge immediately!";
      if (cat == "cooked food") return "⚠️ Hot weather: Cooked food spoils in 2 hours. Freeze now.";
      return "⚠️ Packaged seal risk in heat. Store in cool cupboard.";
    }
    return item["storageGuidance"] ?? "Store appropriately.";
  }

  int _getDaysLeft(dynamic item) {
    try {
      return DateTime.parse(item["predictedSpoilageDate"]).difference(DateTime.now()).inDays.clamp(0, 999);
    } catch (_) { return 0; }
  }

  @override
  Widget build(BuildContext context) {
    final activeItems = widget.inventory.where((item) => item["state"] == "Tracked").toList();
    
    final filtered = activeItems.where((item) {
      final matchesCategory = _activeCategory == "all" || item["category"] == _activeCategory;
      bool matchesStatus = true;
      if (_statusFilter != "all") {
        final itemStatus = item["status"] == "Slightly Spoiled" ? "Warning" : item["status"];
        matchesStatus = itemStatus == _statusFilter;
      }
      return matchesCategory && matchesStatus;
    }).toList();

    return Column(
      children: [
        if (_statusFilter != "all")
          Container(
            margin: const EdgeInsets.only(left: 16, right: 16, top: 16),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF00E676).withOpacity(0.04),
              border: Border.all(color: const Color(0xFF00E676).withOpacity(0.15)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    "🔍 Filter: ${_statusFilter.toUpperCase()} items active",
                    style: const TextStyle(fontSize: 12, color: Color(0xFF00E676), fontWeight: FontWeight.bold),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _statusFilter = "all";
                    });
                    widget.onClearStatusFilter();
                  },
                  child: const Text("Clear", style: TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Ambient temperature selector", style: TextStyle(color: Colors.grey, fontSize: 11)),
                  Text("Advisory: $_tempMode", style: TextStyle(fontWeight: FontWeight.bold, color: _tempMode == "Hot" ? Colors.orange : const Color(0xFF00E676))),
                ],
              ),
              Row(
                children: [
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _tempMode == "Cool" ? const Color(0xFF00E676).withOpacity(0.2) : Colors.transparent,
                      foregroundColor: _tempMode == "Cool" ? const Color(0xFF00E676) : Colors.grey,
                      minimumSize: const Size(60, 36),
                      padding: EdgeInsets.zero,
                    ),
                    onPressed: () => setState(() => _tempMode = "Cool"),
                    child: const Text("18°C", style: TextStyle(fontSize: 11)),
                  ),
                  const SizedBox(width: 6),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _tempMode == "Hot" ? Colors.orange.withOpacity(0.2) : Colors.transparent,
                      foregroundColor: _tempMode == "Hot" ? Colors.orange : Colors.grey,
                      minimumSize: const Size(60, 36),
                      padding: EdgeInsets.zero,
                    ),
                    onPressed: () => setState(() => _tempMode = "Hot"),
                    child: const Text("32°C", style: TextStyle(fontSize: 11)),
                  ),
                ],
              )
            ],
          ),
        ),

        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: ["all", "fruits", "vegetables", "cooked food", "packaged food"].map((cat) {
              final isSelected = _activeCategory == cat;
              return Padding(
                padding: const EdgeInsets.only(right: 6.0),
                child: ChoiceChip(
                  label: Text(cat[0].toUpperCase() + cat.substring(1)),
                  selected: isSelected,
                  selectedColor: const Color(0xFF00E676).withOpacity(0.15),
                  labelStyle: TextStyle(color: isSelected ? const Color(0xFF00E676) : Colors.white, fontSize: 11),
                  onSelected: (val) => setState(() => _activeCategory = cat),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 10),

        Expanded(
          child: filtered.isEmpty
              ? const Center(child: Text("No items tracked in this category"))
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final item = filtered[index];
                    
                    final totalDur = DateTime.parse(item["predictedSpoilageDate"]).difference(DateTime.parse(item["addedDate"])).inSeconds;
                    final elapsed = DateTime.now().difference(DateTime.parse(item["addedDate"])).inSeconds;
                    double pct = 1.0 - (elapsed / totalDur);
                    pct = pct.clamp(0.0, 1.0);
                    final freshnessPct = (item["originalFreshness"] * pct).round();
                    
                    final statusColor = freshnessPct > 70 ? const Color(0xFF00E676) : (freshnessPct > 30 ? const Color(0xFFFFEA00) : const Color(0xFFFF1744));

                    String customAdvisory = _getAdvisory(item);
                    // ignore: unused_local_variable
                    final int daysLeft = _getDaysLeft(item);

                    return Container(
                      margin: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.015),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withOpacity(0.06))
                      ),
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(item["imageUrl"], width: 64, height: 64, fit: BoxFit.cover, errorBuilder: (c, e, s) => const Icon(Icons.lunch_dining, size: 64)),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(item["name"], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                          decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                                          child: Text("${item["status"]} ($freshnessPct%)", style: TextStyle(color: statusColor, fontSize: 8, fontWeight: FontWeight.bold)),
                                        )
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    if (freshnessPct <= 50 || item["status"] == "Spoiled") ...[
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(color: const Color(0xFFFF1744).withOpacity(0.08), borderRadius: BorderRadius.circular(6)),
                                        child: const Text("⚠️ WARNING: This item is spoiled. Do not eat!", style: TextStyle(color: Color(0xFFFF1744), fontSize: 10, fontWeight: FontWeight.bold)),
                                      ),
                                    ] else ...[
                                      Text(customAdvisory, style: TextStyle(color: _tempMode == "Hot" ? Colors.orange : Colors.grey, fontSize: 11, fontStyle: _tempMode == "Hot" ? FontStyle.italic : FontStyle.normal)),
                                      const SizedBox(height: 2),
                                      Text("Calories: ${item["nutrition"]["calories"]} kcal", style: const TextStyle(color: Colors.grey, fontSize: 10)),
                                    ],
                                  ],
                                ),
                              )
                            ],
                          ),
                          const SizedBox(height: 10),
                          // Did you use this item? Used / Not Used
                          if (!_markedUsed.contains(item["_id"])) ...[
                            if (freshnessPct > 50 && item["status"] != "Spoiled") ...[
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.white12)),
                                child: Column(
                                  children: [
                                    const Text("Did you use this item?", style: TextStyle(fontSize: 10, color: Colors.grey)),
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: ElevatedButton(
                                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black, padding: EdgeInsets.zero, minimumSize: const Size(0, 34)),
                                            onPressed: () {
                                              setState(() => _markedUsed.add(item["_id"]));
                                              widget.onUpdateState(item["_id"], "Used");
                                            },
                                            child: const Text("✅ Used", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: ElevatedButton(
                                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF1744).withOpacity(0.1), foregroundColor: const Color(0xFFFF1744), padding: EdgeInsets.zero, minimumSize: const Size(0, 34), side: const BorderSide(color: Color(0xFFFF1744), width: 0.5)),
                                            onPressed: () => widget.onUpdateState(item["_id"], "Wasted"),
                                            child: const Text("🗑️ Not Used", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton(
                                      style: ElevatedButton.styleFrom(backgroundColor: Colors.white10, foregroundColor: Colors.grey, padding: EdgeInsets.zero, minimumSize: const Size(0, 32)),
                                      onPressed: () => widget.onUpdateState(item["_id"], "Eaten"),
                                      child: const Text("🍽️ Eaten/Cooked", style: TextStyle(fontSize: 10)),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, color: Colors.grey, size: 20),
                                    onPressed: () => widget.onDeleteItem(item["_id"]),
                                  ),
                                ],
                              ),
                            ] else ...[
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(color: const Color(0xFFFF1744).withOpacity(0.05), borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFFFF1744).withOpacity(0.2))),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text("❌ Don't Use (Spoiled)", style: TextStyle(color: Color(0xFFFF1744), fontWeight: FontWeight.bold, fontSize: 11)),
                                    ElevatedButton.icon(
                                      icon: const Icon(Icons.delete_outline, size: 14, color: Colors.white),
                                      label: const Text("Remove", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF1744), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 10), minimumSize: const Size(0, 30)),
                                      onPressed: () => widget.onDeleteItem(item["_id"]),
                                    )
                                  ],
                                ),
                              ),
                            ],
                          ] else ...[
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(color: const Color(0xFF00E676).withOpacity(0.05), borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFF00E676).withOpacity(0.2))),
                              child: const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.check_circle, color: Color(0xFF00E676), size: 16),
                                  SizedBox(width: 6),
                                  Text("Used — no waste recorded", style: TextStyle(color: Color(0xFF00E676), fontWeight: FontWeight.bold, fontSize: 11)),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    );
                  },
                ),
        )
      ],
    );
  }
}

// ----------------------------------------------------
// SCREEN 5: RECIPES SUGGESTIONS SCREEN
// ----------------------------------------------------
class RecipesScreen extends StatefulWidget {
  final Map<String, dynamic> preferences;
  final Function(Map<String, dynamic>) onUpdatePreferences;
  final String backendUrl;
  final List<dynamic> inventory;

  const RecipesScreen({
    super.key,
    required this.preferences,
    required this.onUpdatePreferences,
    required this.backendUrl,
    required this.inventory,
  });

  @override
  State<RecipesScreen> createState() => _RecipesScreenState();
}

class _RecipesScreenState extends State<RecipesScreen> {
  List<dynamic> _recipes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchRecipes();
  }

  @override
  void didUpdateWidget(covariant RecipesScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.preferences["servings"] != widget.preferences["servings"] ||
        oldWidget.preferences["audienceMode"] != widget.preferences["audienceMode"]) {
      _fetchRecipes();
    }
  }

  Future<void> _fetchRecipes() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final String email = widget.preferences["email"] as String? ?? "";
      final res = await http.get(
        Uri.parse("${widget.backendUrl}/recipes"),
        headers: {
          "Content-Type": "application/json",
          "x-user-email": email,
        },
      ).timeout(const Duration(seconds: 3));
      final Map<String, dynamic> data = jsonDecode(res.body);

      if (data["success"] == true) {
        setState(() {
          _recipes = data["recipes"];
          _isLoading = false;
        });
      }
    } catch (e) {
      final int servings = widget.preferences["servings"];
      final String mode = widget.preferences["audienceMode"];

      setState(() {
        _recipes = [
          {
            "title": "Warm Cinnamon Baked Apples",
            "primaryIngredient": "Fresh Gala Apples",
            "daysToExpiry": 5,
            "description": "Sweet dessert using raw apples.",
            "servings": servings,
            "advice": mode == "Kid-friendly" ? "Child Mode: Sweet & mild." : "Gourmet touch: Serve hot.",
            "ingredients": [
              {"name": "Apples", "qty": (servings * 1.0), "unit": "pcs"},
              {"name": "Cinnamon", "qty": (servings * 0.5), "unit": "tsp"},
            ],
            "steps": [
              "Hollow out the apple core seeds.",
              "Stuff honey and cinnamon.",
              "Bake at 180°C for 25 minutes."
            ]
          }
        ];
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final int currentServings = widget.preferences["servings"] ?? 2;
    final int currentMembers = widget.preferences["membersCount"] ?? 2;
    final String mode = widget.preferences["audienceMode"] ?? "Regular";

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              // Members + Servings row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Text("👨‍👩‍👧 Members: ", style: TextStyle(color: Color(0xFF00E676), fontSize: 12, fontWeight: FontWeight.bold)),
                      IconButton(
                        icon: const Icon(Icons.remove_circle_outline, size: 18, color: Color(0xFF00E676)),
                        onPressed: () => widget.onUpdatePreferences({"membersCount": (currentMembers - 1).clamp(1, 20)}),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                      Text("$currentMembers", style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF00E676))),
                      IconButton(
                        icon: const Icon(Icons.add_circle_outline, size: 18, color: Color(0xFF00E676)),
                        onPressed: () => widget.onUpdatePreferences({"membersCount": (currentMembers + 1).clamp(1, 20)}),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      const Text("Servings: ", style: TextStyle(color: Colors.grey, fontSize: 12)),
                      IconButton(
                        icon: const Icon(Icons.remove_circle_outline, size: 18),
                        onPressed: () => widget.onUpdatePreferences({"servings": (currentServings - 1).clamp(1, 10)}),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                      Text("$currentServings", style: const TextStyle(fontWeight: FontWeight.bold)),
                      IconButton(
                        icon: const Icon(Icons.add_circle_outline, size: 18),
                        onPressed: () => widget.onUpdatePreferences({"servings": (currentServings + 1).clamp(1, 10)}),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("Cooking for $currentMembers member${currentMembers > 1 ? 's' : ''} — Buy Qty auto-scaled", style: const TextStyle(color: Colors.grey, fontSize: 10)),
                  DropdownButton<String>(
                    value: mode,
                    dropdownColor: const Color(0xFF13151B),
                    underline: const SizedBox(),
                    isDense: true,
                    items: const [
                      DropdownMenuItem(value: "Regular", child: Text("Regular", style: TextStyle(fontSize: 12))),
                      DropdownMenuItem(value: "Kid-friendly", child: Text("Kid-Friendly 👶", style: TextStyle(fontSize: 12))),
                      DropdownMenuItem(value: "Gourmet", child: Text("Gourmet", style: TextStyle(fontSize: 12))),
                    ],
                    onChanged: (val) => widget.onUpdatePreferences({"audienceMode": val!}),
                  ),
                ],
              ),
            ],
          ),
        ),

        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : (() {
                  final activeRecipes = _recipes.where((recipe) {
                    final matchingItem = widget.inventory.firstWhere(
                      (item) {
                        final name = item["name"].toString().toLowerCase();
                        final prim = recipe["primaryIngredient"].toString().toLowerCase();
                        return name == prim || name.contains(prim) || prim.contains(name);
                      },
                      orElse: () => null,
                    );
                    if (matchingItem != null) {
                      final totalDur = DateTime.parse(matchingItem["predictedSpoilageDate"]).difference(DateTime.parse(matchingItem["addedDate"])).inSeconds;
                      final elapsed = DateTime.now().difference(DateTime.parse(matchingItem["addedDate"])).inSeconds;
                      double pct = 1.0 - (elapsed / totalDur);
                      pct = pct.clamp(0.0, 1.0);
                      final freshnessPct = (matchingItem["originalFreshness"] * pct).round();

                      if (matchingItem["status"] == "Spoiled" || freshnessPct <= 50 || matchingItem["isCooked"] == true || matchingItem["category"] == "cooked food") {
                        return false;
                      }
                    }
                    return true;
                  }).toList();

                  if (activeRecipes.isEmpty) {
                    return const Center(child: Text("No recipes match raw inventory items."));
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: activeRecipes.length,
                    itemBuilder: (context, index) {
                      final recipe = activeRecipes[index];
                        return Container(
                          margin: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.015),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white.withOpacity(0.06))
                          ),
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("💡 Expiry Match: ${recipe["primaryIngredient"]}", style: const TextStyle(color: Colors.orange, fontSize: 10, fontWeight: FontWeight.bold)),
                              Text(recipe["title"], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              const SizedBox(height: 4),
                              Text(recipe["description"], style: const TextStyle(color: Colors.grey, fontSize: 12)),
                              const SizedBox(height: 10),
                              
                              if (recipe["advice"] != null)
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  margin: const EdgeInsets.only(bottom: 12),
                                  decoration: BoxDecoration(color: const Color(0xFF00E676).withOpacity(0.06), borderRadius: BorderRadius.circular(8)),
                                  child: Text(recipe["advice"], style: const TextStyle(color: Color(0xFF00E676), fontSize: 11)),
                                ),

                              const Text("Ingredients Needed:", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              const SizedBox(height: 6),
                              ...List.generate(recipe["ingredients"].length, (idx) {
                                final ing = recipe["ingredients"][idx];
                                return Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 2.0),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text("• ${ing["name"]}", style: const TextStyle(fontSize: 12, color: Colors.white70)),
                                      Text("${ing["qty"]} ${ing["unit"]}", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                );
                              }),

                              const SizedBox(height: 12),
                              const Text("Directions Steps:", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              const SizedBox(height: 6),
                              ...List.generate(recipe["steps"].length, (sIdx) {
                                return Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 4.0),
                                  child: Text("${sIdx + 1}. ${recipe["steps"][sIdx]}", style: const TextStyle(fontSize: 12, color: Colors.white60)),
                                );
                              })
                            ],
                          ),
                        );
                      },
                    );
                  })(),
        )
      ],
    );
  }
}

// ----------------------------------------------------
// SCREEN 6: ECO-IMPACT & CARBON TRACKING (5 Screens)
// ----------------------------------------------------
class EcoImpactScreen extends StatefulWidget {
  final String backendUrl;
  const EcoImpactScreen({super.key, required this.backendUrl});

  @override
  State<EcoImpactScreen> createState() => _EcoImpactScreenState();
}

class _EcoImpactScreenState extends State<EcoImpactScreen> {
  Map<String, dynamic> _eco = {
    "co2SavedKg": 24.8,
    "moneySaved": 140.0,
    "foodHealthLevel": "Waste Warden",
    "ecoMilestones": [
      {"title": "CO2 Savior 🌿", "desc": "Saved 20kg of carbon emissions.", "unlocked": true},
      {"title": "Zero Waste Hero 💎", "desc": "Keep wastage below 5% for one month.", "unlocked": false}
    ],
    "comparisonStats": {"communityAvgKg": 15.2, "userSavingPct": 63}
  };
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchEco();
  }

  Future<void> _fetchEco() async {
    try {
      final res = await http.get(Uri.parse("${widget.backendUrl}/eco")).timeout(const Duration(seconds: 3));
      final Map<String, dynamic> data = jsonDecode(res.body);
      if (data["success"] == true) {
        setState(() {
          _eco = data["eco"];
          _loading = false;
        });
      }
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    final milestones = _eco["ecoMilestones"] as List<dynamic>;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Eco-Impact & Cost savings", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          
          Row(
            children: [
              Expanded(
                child: _buildValueCard("CO2 EMISSIONS", "${_eco["co2SavedKg"]} kg", const Color(0xFF00E676)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildValueCard("FINANCIAL SAVING", "₹${_eco["moneySaved"]}", Colors.orange),
              )
            ],
          ),
          const SizedBox(height: 20),

          const Text("Composting Safety & Bio-waste directions", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.015), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.06))),
            child: const Column(
              children: [
                _CompostTipTile(icon: "♻️", title: "Separate Packaging", desc: "Always strip plastic wraps before throwing produce in compost."),
                Divider(color: Colors.white10),
                _CompostTipTile(icon: "🍂", title: "Compost Browns", desc: "Maintain 1:3 ratio of food scraps to dry leaves."),
              ],
            ),
          ),
          const SizedBox(height: 20),

          const Text("Eco Savings Milestones", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 8),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: milestones.length,
            itemBuilder: (c, idx) {
              final ms = milestones[idx];
              final isUnlocked = ms["unlocked"] == true;
              return Container(
                margin: const EdgeInsets.symmetric(vertical: 4),
                decoration: BoxDecoration(
                  color: isUnlocked ? const Color(0xFF00E676).withOpacity(0.04) : Colors.white10,
                  border: Border.all(color: isUnlocked ? const Color(0xFF00E676).withOpacity(0.2) : Colors.transparent),
                  borderRadius: BorderRadius.circular(12)
                ),
                child: ListTile(
                  leading: Text(isUnlocked ? "🏆" : "🔒", style: const TextStyle(fontSize: 20)),
                  title: Text(ms["title"], style: TextStyle(fontWeight: FontWeight.bold, color: isUnlocked ? Colors.white : Colors.grey)),
                  subtitle: Text(ms["desc"], style: const TextStyle(fontSize: 11, color: Colors.grey)),
                ),
              );
            },
          )
        ],
      ),
    );
  }

  Widget _buildValueCard(String label, String value, Color color) {
    return Container(
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.015), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.06))),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }
}

// ----------------------------------------------------
// SCREEN 7: COLLABORATIVE CO-OP HOUSEHOLD (4 Screens)
// ----------------------------------------------------
class CoOpHouseholdScreen extends StatefulWidget {
  final String backendUrl;
  final String userName;

  const CoOpHouseholdScreen({
    super.key,
    required this.backendUrl,
    required this.userName,
  });

  @override
  State<CoOpHouseholdScreen> createState() => _CoOpHouseholdScreenState();
}

class _CoOpHouseholdScreenState extends State<CoOpHouseholdScreen> {
  Map<String, dynamic>? _household;
  bool _loading = true;
  
  final _joinCtrl = TextEditingController();
  final _choreCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchHousehold();
  }

  @override
  void dispose() {
    _joinCtrl.dispose();
    _choreCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchHousehold() async {
    try {
      final res = await http.get(Uri.parse("${widget.backendUrl}/household")).timeout(const Duration(seconds: 3));
      final Map<String, dynamic> data = jsonDecode(res.body);
      if (data["success"] == true) {
        setState(() {
          _household = data["household"];
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _household = {
          "code": "FRIDGE-JOIN-MOCK",
          "members": ["C. Jasvina", "Dr. Priskilla"],
          "chores": [
            {"id": "ch-m-1", "task": "Eat tomatoes before Friday decay", "assignee": "C. Jasvina", "done": false}
          ],
          "logs": [
            {"member": "Dr. Priskilla", "action": "Added", "item": "Lettuce", "timestamp": DateTime.now().toIso8601String()}
          ]
        };
        _loading = false;
      });
    }
  }

  Future<void> _joinGroup() async {
    if (_joinCtrl.text.isEmpty) return;
    try {
      final res = await http.post(
        Uri.parse("${widget.backendUrl}/household/join"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"code": _joinCtrl.text})
      );
      if (res.statusCode == 200) {
        _joinCtrl.clear();
        _fetchHousehold();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Joined simulated co-op")));
    }
  }

  Future<void> _addChore() async {
    if (_choreCtrl.text.isEmpty) return;
    try {
      final res = await http.post(
        Uri.parse("${widget.backendUrl}/household/chores"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"task": _choreCtrl.text, "assignee": widget.userName})
      );
      if (res.statusCode == 200) {
        _choreCtrl.clear();
        _fetchHousehold();
      }
    } catch (e) {
      setState(() {
        final chores = _household!["chores"] as List<dynamic>;
        chores.add({"id": "c-${DateTime.now().millisecondsSinceEpoch}", "task": _choreCtrl.text, "assignee": widget.userName, "done": false});
        _choreCtrl.clear();
      });
    }
  }

  Future<void> _toggleChore(String id) async {
    try {
      final res = await http.put(Uri.parse("${widget.backendUrl}/household/chores/$id/toggle"));
      if (res.statusCode == 200) {
        _fetchHousehold();
      }
    } catch (e) {
      setState(() {
        final chores = _household!["chores"] as List<dynamic>;
        final idx = chores.indexWhere((c) => c["id"] == id);
        if (idx > -1) {
          chores[idx]["done"] = !chores[idx]["done"];
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    final members = _household!["members"] as List<dynamic>;
    final chores = _household!["chores"] as List<dynamic>;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Fridge Collaborative Sharing", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.015), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.06))),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("Household invite Code", style: TextStyle(fontSize: 10, color: Colors.grey)),
                Text(_household!["code"], style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF00E676))),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _joinCtrl,
                        decoration: const InputDecoration(labelText: "Enter household join code", border: OutlineInputBorder()),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black, minimumSize: const Size(60, 50)),
                      onPressed: _joinGroup,
                      child: const Text("Join"),
                    )
                  ],
                )
              ],
            ),
          ),
          const SizedBox(height: 20),

          const Text("Fridge Chore Tasks list", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.01), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white.withOpacity(0.05))),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _choreCtrl,
                        decoration: const InputDecoration(labelText: "New chore (e.g. Eat lettuce)", isDense: true, border: OutlineInputBorder()),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black),
                      onPressed: _addChore,
                      child: const Text("Add"),
                    )
                  ],
                ),
                const SizedBox(height: 12),
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: chores.length,
                  itemBuilder: (c, idx) {
                    final chore = chores[idx];
                    final isDone = chore["done"] == true;
                    return CheckboxListTile(
                      title: Text(chore["task"], style: TextStyle(decoration: isDone ? TextDecoration.lineThrough : null, fontSize: 13)),
                      subtitle: Text("Assignee: ${chore["assignee"]}", style: const TextStyle(fontSize: 10, color: Colors.grey)),
                      value: isDone,
                      activeColor: const Color(0xFF00E676),
                      onChanged: (val) => _toggleChore(chore["id"]),
                    );
                  },
                )
              ],
            ),
          ),
          const SizedBox(height: 20),

          const Text("Family Members Group", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: members.map((m) => Chip(
              label: Text(m),
              avatar: const Icon(Icons.person, size: 16),
            )).toList(),
          )
        ],
      ),
    );
  }
}

// ----------------------------------------------------
// SCREEN 8: NEIGHBOR SHARING & DATABASE (4 Screens)
// ----------------------------------------------------
class CommunityCatalogScreen extends StatefulWidget {
  final String backendUrl;
  final String userName;

  const CommunityCatalogScreen({
    super.key,
    required this.backendUrl,
    required this.userName,
  });

  @override
  State<CommunityCatalogScreen> createState() => _CommunityCatalogScreenState();
}

class _CommunityCatalogScreenState extends State<CommunityCatalogScreen> {
  int _subTab = 0; 
  List<dynamic> _donations = [];
  List<dynamic> _catalog = [];
  bool _loading = true;

  final _foodNameCtrl = TextEditingController();
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
    _foodNameCtrl.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    try {
      final donRes = await http.get(Uri.parse("${widget.backendUrl}/donations")).timeout(const Duration(seconds: 3));
      final catRes = await http.get(Uri.parse("${widget.backendUrl}/catalog")).timeout(const Duration(seconds: 3));

      if (donRes.statusCode == 200 && catRes.statusCode == 200) {
        setState(() {
          _donations = jsonDecode(donRes.body)["donations"];
          _catalog = jsonDecode(catRes.body)["catalog"];
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _donations = [
          {"_id": "d-1", "name": "Red Tomatoes", "quantity": "3 pcs", "distance": "0.2 km", "daysLeft": 2, "status": "Available"}
        ];
        _catalog = [
          {"name": "Spinach", "category": "vegetables", "calories": 23, "storageAdvice": "Wrap in dry container"}
        ];
        _loading = false;
      });
    }
  }

  Future<void> _postDonation() async {
    if (_foodNameCtrl.text.isEmpty) return;
    try {
      final res = await http.post(
        Uri.parse("${widget.backendUrl}/donations"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"name": _foodNameCtrl.text, "quantity": "1 item", "daysLeft": 2})
      );
      if (res.statusCode == 200) {
        _foodNameCtrl.clear();
        _fetchData();
      }
    } catch (e) {
      setState(() {
        _donations.insert(0, {"_id": "d-${DateTime.now().millisecondsSinceEpoch}", "name": _foodNameCtrl.text, "quantity": "1 item", "distance": "0.1 km", "daysLeft": 2, "status": "Available"});
        _foodNameCtrl.clear();
      });
    }
  }

  Future<void> _claimItem(String id) async {
    try {
      final res = await http.put(Uri.parse("${widget.backendUrl}/donations/$id/request"));
      if (res.statusCode == 200) {
        _fetchData();
      }
    } catch (e) {
      setState(() {
        final idx = _donations.indexWhere((d) => d["_id"] == id);
        if (idx > -1) {
          _donations[idx]["status"] = _donations[idx]["status"] == "Available" ? "Requested" : "Available";
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            TextButton(
              onPressed: () => setState(() => _subTab = 0),
              child: Text("🤝 Share Board", style: TextStyle(color: _subTab == 0 ? const Color(0xFF00E676) : Colors.grey)),
            ),
            TextButton(
              onPressed: () => setState(() => _subTab = 1),
              child: Text("🔍 Catalog DB", style: TextStyle(color: _subTab == 1 ? const Color(0xFF00E676) : Colors.grey)),
            ),
            TextButton(
              onPressed: () => setState(() => _subTab = 2),
              child: Text("📍 food Banks", style: TextStyle(color: _subTab == 2 ? const Color(0xFF00E676) : Colors.grey)),
            ),
          ],
        ),

        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: _buildSubTabContent(),
          ),
        )
      ],
    );
  }

  Widget _buildSubTabContent() {
    if (_subTab == 0) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Post food to neighborhood", style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _foodNameCtrl,
                  decoration: const InputDecoration(labelText: "Surplus Food name", isDense: true, border: OutlineInputBorder()),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black),
                onPressed: _postDonation,
                child: const Text("Post"),
              )
            ],
          ),
          const SizedBox(height: 20),

          const Text("Available neighbors food posts", style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _donations.length,
            itemBuilder: (c, idx) {
              final don = _donations[idx];
              final isClaimed = don["status"] == "Requested";
              return Container(
                margin: const EdgeInsets.symmetric(vertical: 4),
                decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(12)),
                child: ListTile(
                  title: Text(don["name"], style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text("Qty: ${don["quantity"]} • Distance: ${don["distance"]}\nWill decay in ${don["daysLeft"]} days", style: const TextStyle(fontSize: 11, color: Colors.grey)),
                  trailing: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: isClaimed ? Colors.white12 : const Color(0xFF00E676), foregroundColor: isClaimed ? Colors.white : Colors.black),
                    onPressed: () => _claimItem(don["_id"]),
                    child: Text(isClaimed ? "Requested" : "Claim"),
                  ),
                ),
              );
            },
          )
        ],
      );
    } else if (_subTab == 1) {
      return Column(
        children: [
          TextField(
            controller: _searchCtrl,
            onChanged: (val) => setState(() {}),
            decoration: const InputDecoration(labelText: "Search nutritional catalog presets", border: OutlineInputBorder(), prefixIcon: Icon(Icons.search)),
          ),
          const SizedBox(height: 16),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _catalog.length,
            itemBuilder: (c, idx) {
              final cat = _catalog[idx];
              if (_searchCtrl.text.isNotEmpty && !cat["name"].toString().toLowerCase().contains(_searchCtrl.text.toLowerCase())) {
                return const SizedBox();
              }
              return Container(
                margin: const EdgeInsets.symmetric(vertical: 6),
                decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(12)),
                child: ListTile(
                  title: Text(cat["name"], style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text("Preservation storage: ${cat["storageAdvice"] ?? "Store cool"}", style: const TextStyle(fontSize: 11, color: Colors.grey)),
                  trailing: Text("${cat["calories"]} kcal", style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFFFEA00))),
                ),
              );
            },
          )
        ],
      );
    } else {
      return const Column(
        children: [
          Card(
            color: Colors.white10,
            child: ListTile(
              leading: Icon(Icons.business, color: Color(0xFF00E676)),
              title: Text("Central City food Bank", style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text("122 Broadway Rd. | distance: 1.2 km\nAccepts dry goods, tins, packaging."),
            ),
          ),
          Card(
            color: Colors.white10,
            child: ListTile(
              leading: Icon(Icons.recycling, color: Colors.orange),
              title: Text("Municipal bio-compost center", style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text("Sector 4 landfills. | distance: 3.4 km\nAccepts organic scrap, decayed rot produce."),
            ),
          ),
        ],
      );
    }
  }
}

// ----------------------------------------------------
// SCREEN 9: WASTAGE HISTOGRAM ANALYTICS SCREEN
// ----------------------------------------------------
// ----------------------------------------------------
// SCREEN 6: ANALYTICS & WASTE REPORT SCREEN
// ----------------------------------------------------
class AnalyticsScreen extends StatefulWidget {
  final String backendUrl;
  const AnalyticsScreen({super.key, required this.backendUrl});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  Map<String, dynamic>? _analytics;
  Map<String, dynamic>? _wasteSummary;
  bool _loading = true;
  String _wasteView = "weekly"; // weekly | monthly

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    try {
      final results = await Future.wait([
        http.get(Uri.parse("${widget.backendUrl}/analytics")).timeout(const Duration(seconds: 4)),
        http.get(Uri.parse("${widget.backendUrl}/waste-summary")).timeout(const Duration(seconds: 4)),
      ]);
      final aData = jsonDecode(results[0].body);
      final wData = jsonDecode(results[1].body);
      setState(() {
        if (aData["success"] == true) _analytics = aData;
        if (wData["success"] == true) _wasteSummary = wData;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _analytics = null;
        _wasteSummary = {
          "weeklyWastedCount": 1,
          "monthlyWastedCount": 2,
          "weeklyWastedItems": [{"name": "Leftover Pizza", "category": "cooked food"}],
          "monthlyWastedItems": [{"name": "Leftover Pizza", "category": "cooked food"}, {"name": "Old Milk", "category": "packaged food"}],
          "buyAdvice": [{"advice": "You wasted Leftover Pizza 1 time. For 2 members, try buying only 1 unit at a time."}],
          "membersCount": 2
        };
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: Color(0xFF00E676)));

    final ws = _wasteSummary;
    final wastedItems = ws != null
        ? (_wasteView == "weekly" ? (ws["weeklyWastedItems"] as List? ?? []) : (ws["monthlyWastedItems"] as List? ?? []))
        : [];
    final buyAdvice = ws != null ? (ws["buyAdvice"] as List? ?? []) : [];
    final weekCount = ws?["weeklyWastedCount"] ?? 0;
    final monthCount = ws?["monthlyWastedCount"] ?? 0;
    final members = ws?["membersCount"] ?? 2;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Wastage & Consumption Report", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          const Text("Track what you wasted and get smart buy-less advice.", style: TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(height: 20),

          // ── WASTE REPORT ──
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFF1744).withOpacity(0.04),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFFF1744).withOpacity(0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text("🗑️ Food Waste Report", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () => setState(() => _wasteView = "weekly"),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: _wasteView == "weekly" ? const Color(0xFF00E676).withOpacity(0.15) : Colors.transparent,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: _wasteView == "weekly" ? const Color(0xFF00E676) : Colors.white24),
                            ),
                            child: Text("Week", style: TextStyle(fontSize: 11, color: _wasteView == "weekly" ? const Color(0xFF00E676) : Colors.grey, fontWeight: FontWeight.bold)),
                          ),
                        ),
                        const SizedBox(width: 6),
                        GestureDetector(
                          onTap: () => setState(() => _wasteView = "monthly"),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: _wasteView == "monthly" ? const Color(0xFF00E676).withOpacity(0.15) : Colors.transparent,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: _wasteView == "monthly" ? const Color(0xFF00E676) : Colors.white24),
                            ),
                            child: Text("Month", style: TextStyle(fontSize: 11, color: _wasteView == "monthly" ? const Color(0xFF00E676) : Colors.grey, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    )
                  ],
                ),
                const SizedBox(height: 14),

                // Stat tiles
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: const Color(0xFFFF1744).withOpacity(0.08), borderRadius: BorderRadius.circular(10)),
                        child: Column(
                          children: [
                            Text("${_wasteView == "weekly" ? weekCount : monthCount}", style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFFFF1744))),
                            Text(_wasteView == "weekly" ? "wasted this week" : "wasted this month", style: const TextStyle(color: Colors.grey, fontSize: 10)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: const Color(0xFF00E676).withOpacity(0.06), borderRadius: BorderRadius.circular(10)),
                        child: Column(
                          children: [
                            Text("$members", style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF00E676))),
                            const Text("household members", style: TextStyle(color: Colors.grey, fontSize: 10)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Wasted items list
                if (wastedItems.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: const Color(0xFF00E676).withOpacity(0.05), borderRadius: BorderRadius.circular(8)),
                    child: const Row(
                      children: [
                        Icon(Icons.check_circle_outline, color: Color(0xFF00E676), size: 18),
                        SizedBox(width: 8),
                        Expanded(child: Text("Zero waste! Great job.", style: TextStyle(color: Color(0xFF00E676), fontWeight: FontWeight.w600, fontSize: 12))),
                      ],
                    ),
                  )
                else ...[
                  Text("Wasted items (${_wasteView == "weekly" ? "last 7 days" : "last 30 days"}):", style: const TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  ...wastedItems.map((it) => Container(
                    margin: const EdgeInsets.only(bottom: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                    decoration: BoxDecoration(color: const Color(0xFFFF1744).withOpacity(0.04), borderRadius: BorderRadius.circular(6)),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text("🗑️ ${it["name"]}", style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12)),
                        Text(it["category"] ?? "", style: const TextStyle(color: Colors.grey, fontSize: 10)),
                      ],
                    ),
                  )),
                ],

                // Buy-less advice
                if (buyAdvice.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: const Color(0xFFFFEA00).withOpacity(0.04), borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFFFFEA00).withOpacity(0.15))),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("🛒 Buy Less Next Time — for $members member${members > 1 ? 's' : ''}:", style: const TextStyle(color: Color(0xFFFFEA00), fontWeight: FontWeight.bold, fontSize: 12)),
                        const SizedBox(height: 8),
                        ...buyAdvice.map((adv) => Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text("📦 ", style: TextStyle(fontSize: 12)),
                              Expanded(child: Text(adv["advice"] ?? "", style: const TextStyle(color: Colors.grey, fontSize: 11, height: 1.4))),
                            ],
                          ),
                        )),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Weekly bar chart (if analytics loaded)
          if (_analytics != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.015), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.06))),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Weekly Consumption vs Wastage", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 100,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: List.generate(7, (i) {
                        final days = (_analytics!["weeklyReport"]["days"] as List);
                        final consumed = (_analytics!["weeklyReport"]["consumed"] as List)[i] as int;
                        final wasted = (_analytics!["weeklyReport"]["wasted"] as List)[i] as int;
                        final maxVal = [consumed, wasted, 1].reduce((a, b) => a > b ? a : b);
                        return Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Container(width: 6, height: (consumed / maxVal * 70).toDouble(), color: const Color(0xFF00E676), margin: const EdgeInsets.only(right: 2)),
                                  Container(width: 6, height: (wasted / maxVal * 70).toDouble(), color: const Color(0xFFFF1744)),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(days[i], style: const TextStyle(fontSize: 9, color: Colors.grey)),
                            ],
                          ),
                        );
                      }),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Row(
                    children: [
                      Icon(Icons.square, color: Color(0xFF00E676), size: 10),
                      SizedBox(width: 4),
                      Text("Consumed", style: TextStyle(fontSize: 10, color: Colors.grey)),
                      SizedBox(width: 12),
                      Icon(Icons.square, color: Color(0xFFFF1744), size: 10),
                      SizedBox(width: 4),
                      Text("Wasted", style: TextStyle(fontSize: 10, color: Colors.grey)),
                    ],
                  )
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ----------------------------------------------------
// SCREEN 10: ACCOUNT PROFILE EDIT SCREEN (Settings)
// ----------------------------------------------------
class ProfileSettingsScreen extends StatefulWidget {
  final Map<String, dynamic> preferences;
  final Function(Map<String, dynamic>) onUpdatePreferences;

  const ProfileSettingsScreen({
    super.key,
    required this.preferences,
    required this.onUpdatePreferences,
  });

  @override
  State<ProfileSettingsScreen> createState() => _ProfileSettingsScreenState();
}

class _ProfileSettingsScreenState extends State<ProfileSettingsScreen> {
  final _nameEditCtrl = TextEditingController();
  final List<String> _dietOptions = ["vegetarian", "vegan", "gluten-free", "dairy-free", "keto", "jain"];

  @override
  void initState() {
    super.initState();
    _nameEditCtrl.text = widget.preferences["name"] ?? "";
  }

  @override
  void dispose() {
    _nameEditCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final List<dynamic> activePrefs = widget.preferences["dietaryPreferences"] ?? [];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Security Settings & Profile edit", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),

          // Members count
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: const Color(0xFF00E676).withOpacity(0.04), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF00E676).withOpacity(0.15))),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("👨‍👩‍👧 How many members to cook for?", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      SizedBox(height: 3),
                      Text("Used for recipe quantities & buy-less advice.", style: TextStyle(color: Colors.grey, fontSize: 11)),
                    ],
                  ),
                ),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.remove_circle_outline, color: Color(0xFF00E676)),
                      onPressed: () {
                        final current = (widget.preferences["membersCount"] ?? 2) as int;
                        if (current > 1) widget.onUpdatePreferences({"membersCount": current - 1});
                      },
                    ),
                    Text("${widget.preferences["membersCount"] ?? 2}", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF00E676))),
                    IconButton(
                      icon: const Icon(Icons.add_circle_outline, color: Color(0xFF00E676)),
                      onPressed: () {
                        final current = (widget.preferences["membersCount"] ?? 2) as int;
                        if (current < 20) widget.onUpdatePreferences({"membersCount": current + 1});
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          TextField(
            controller: _nameEditCtrl,
            decoration: const InputDecoration(labelText: "Display Profile Name", border: OutlineInputBorder()),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black, minimumSize: const Size(double.infinity, 44)),
            onPressed: () {
              widget.onUpdatePreferences({"name": _nameEditCtrl.text});
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Name profile parameter updated")));
            },
            child: const Text("Update Profile", style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          const SizedBox(height: 24),

          const Text("Dietary Constraints checkboxes", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 8),
          ..._dietOptions.map((opt) {
            final isChecked = activePrefs.contains(opt);
            return CheckboxListTile(
              title: Text(opt[0].toUpperCase() + opt.substring(1)),
              value: isChecked,
              activeColor: const Color(0xFF00E676),
              onChanged: (val) {
                final List<String> updatedList = List.from(activePrefs);
                if (val == true) {
                  updatedList.add(opt);
                } else {
                  updatedList.remove(opt);
                }
                widget.onUpdatePreferences({"dietaryPreferences": updatedList});
              },
            );
          }),
        ],
      ),
    );
  }
}

class _CompostTipTile extends StatelessWidget {
  final String icon;
  final String title;
  final String desc;
  const _CompostTipTile({required this.icon, required this.title, required this.desc});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 22)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                Text(desc, style: const TextStyle(color: Colors.grey, fontSize: 11)),
              ],
            ),
          )
        ],
      ),
    );
  }
}

class MockScreenWidget extends StatelessWidget {
  final String activeRoute;
  final String screenName;
  final VoidCallback onNavigateBack;

  const MockScreenWidget({
    super.key,
    required this.activeRoute,
    required this.screenName,
    required this.onNavigateBack,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF0B0C10),
      padding: const EdgeInsets.all(24),
      child: Center(
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Text("💡", style: TextStyle(fontSize: 64)),
              const SizedBox(height: 16),
              Text(
                screenName,
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                "FreshRadar Mobile Portal · Route: '$activeRoute'",
                style: const TextStyle(fontSize: 12, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF00E676).withOpacity(0.04),
                  border: Border.all(color: const Color(0xFF00E676).withOpacity(0.15)),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      "ℹ️ System Module Operational",
                      style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13),
                    ),
                    SizedBox(height: 6),
                    Text(
                      "This section represents one of our 50 advanced working screens. The server has mapped this route successfully to manage this module.",
                      style: TextStyle(fontSize: 12, color: Colors.grey, height: 1.4),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                "Interactive Mock Demonstration",
                style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
              ),
              const SizedBox(height: 6),
              const Text(
                "Telemetry status is ONLINE. Press below to simulate events.",
                style: TextStyle(fontSize: 11, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00E676),
                  foregroundColor: Colors.black,
                  minimumSize: const Size(double.infinity, 50),
                ),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text("Simulated event triggered for $screenName")),
                  );
                },
                child: const Text("🚀 Trigger Simulation Event", style: TextStyle(fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: onNavigateBack,
                child: const Text("← Return to Dashboard", style: TextStyle(color: Colors.grey)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class FreshRadarLogo extends StatelessWidget {
  final double size;
  const FreshRadarLogo({super.key, this.size = 40});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: const Color(0xFF0E1B18),
        borderRadius: BorderRadius.circular(size * 0.28),
        border: Border.all(color: const Color(0x8000E676), width: 1.5),
      ),
      child: Stack(
        children: [
          Positioned(
            left: -size * 0.1,
            top: -size * 0.1,
            child: Container(
              width: size * 0.7,
              height: size * 0.7,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: const Color(0x3300E676),
                  width: 1,
                ),
              ),
            ),
          ),
          Positioned(
            left: -size * 0.2,
            top: -size * 0.2,
            child: Container(
              width: size * 0.9,
              height: size * 0.9,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: const Color(0x2200E676),
                  width: 1,
                ),
              ),
            ),
          ),
          Center(
            child: CustomPaint(
              size: Size(size * 0.5, size * 0.5),
              painter: _ApplePainter(),
            ),
          ),
        ],
      ),
    );
  }
}

class _ApplePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // 1. Solid Apple Body
    final bodyPaint = Paint()
      ..color = const Color(0xFF00E676)
      ..style = PaintingStyle.fill;

    final bodyPath = Path();
    bodyPath.moveTo(w * 0.5, h * 0.22);
    bodyPath.cubicTo(w * 0.35, h * 0.22, w * 0.2, h * 0.14, w * 0.1, h * 0.22);
    bodyPath.cubicTo(w * -0.1, h * 0.34, w * -0.1, h * 0.74, w * 0.1, h * 0.94);
    bodyPath.cubicTo(w * 0.22, h * 1.14, w * 0.42, h * 1.20, w * 0.5, h * 1.07);
    bodyPath.cubicTo(w * 0.58, h * 1.20, w * 0.78, h * 1.14, w * 0.9, h * 0.94);
    bodyPath.cubicTo(w * 0.95, h * 0.82, w * 0.98, h * 0.80, w * 0.88, h * 0.74);
    bodyPath.cubicTo(w * 0.76, h * 0.68, w * 0.76, h * 0.48, w * 0.88, h * 0.42);
    bodyPath.cubicTo(w * 0.98, h * 0.36, w * 0.96, h * 0.34, w * 0.9, h * 0.30);
    bodyPath.cubicTo(w * 0.8, h * 0.14, w * 0.65, h * 0.22, w * 0.5, h * 0.22);
    bodyPath.close();

    canvas.drawPath(bodyPath, bodyPaint);

    // 2. White Highlight Reflection
    final highlightPaint = Paint()
      ..color = Colors.white.withOpacity(0.4)
      ..style = PaintingStyle.fill;
    
    canvas.save();
    canvas.translate(w * 0.35, h * 0.5);
    canvas.rotate(-15 * 3.14159 / 180);
    canvas.drawOval(Rect.fromCenter(center: Offset.zero, width: w * 0.12, height: h * 0.25), highlightPaint);
    canvas.restore();

    // 3. Brown Stem
    final stemPaint = Paint()
      ..color = const Color(0xFF8B5A2B)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round;

    final stemPath = Path();
    stemPath.moveTo(w * 0.5, h * 0.22);
    stemPath.cubicTo(w * 0.5, h * 0.05, w * 0.6, h * 0.0, w * 0.6, h * 0.0);
    canvas.drawPath(stemPath, stemPaint);

    // 4. Green Leaf
    final leafPaint = Paint()
      ..color = const Color(0xFF2E7D32)
      ..style = PaintingStyle.fill;

    final leafPath = Path();
    leafPath.moveTo(w * 0.6, h * 0.0);
    leafPath.cubicTo(w * 0.75, h * -0.05, w * 0.85, h * 0.05, w * 0.7, h * 0.12);
    leafPath.cubicTo(w * 0.6, h * 0.16, w * 0.58, h * 0.08, w * 0.6, h * 0.0);
    leafPath.close();
    canvas.drawPath(leafPath, leafPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class GourmetUpgradeScreen extends StatefulWidget {
  final VoidCallback onNavigateBack;

  const GourmetUpgradeScreen({
    super.key,
    required this.onNavigateBack,
  });

  @override
  State<GourmetUpgradeScreen> createState() => _GourmetUpgradeScreenState();
}

class _GourmetUpgradeScreenState extends State<GourmetUpgradeScreen> {
  String _gourmetLevel = "Home Cook";

  final Map<String, List<Map<String, String>>> _substitutions = {
    "Home Cook": [
      {"original": "Ordinary Cheddar Cheese", "replacement": "Sharp Cheddar"},
      {"original": "Standard Apple Slice", "replacement": "Apple Honey Drizzle"},
      {"original": "White Rice", "replacement": "Jasmine Rice"},
      {"original": "Standard Milk", "replacement": "Organic Milk"},
    ],
    "Bistro Chef": [
      {"original": "Ordinary Cheddar Cheese", "replacement": "Aged Gouda"},
      {"original": "Standard Apple Slice", "replacement": "Caramel Drizzle Glaze"},
      {"original": "White Rice", "replacement": "Basmati Pilaf"},
      {"original": "Standard Milk", "replacement": "Almond Milk"},
    ],
    "Pro Master": [
      {"original": "Ordinary Cheddar Cheese", "replacement": "Truffle Infused Pecorino"},
      {"original": "Standard Apple Slice", "replacement": "Sun-Dried Apple chips"},
      {"original": "White Rice", "replacement": "Saffron Risotto Rice"},
      {"original": "Standard Milk", "replacement": "Macadamia Nut Milk"},
    ],
  };

  void _handleSubstitutionTap(String replacement) {
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Text("✨ ", style: TextStyle(fontSize: 16)),
            Expanded(
              child: Text(
                "Selected $replacement! Added to your wishlist.",
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF00E676),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final list = _substitutions[_gourmetLevel] ?? [];

    return Container(
      color: const Color(0xFF0B0C10),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: widget.onNavigateBack,
              ),
              const SizedBox(width: 8),
              const Text(
                "Gourmet Upgrade",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Card(
            color: Color(0xFF13151B),
            child: Padding(
              padding: EdgeInsets.all(12.0),
              child: Row(
                children: [
                  Text("🧑‍🍳", style: TextStyle(fontSize: 24)),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Gourmet Substitution Guide",
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                        ),
                        SizedBox(height: 4),
                        Text(
                          "Upgrade simple grocery ingredients to professional chef alternatives. Tap on any replacement to add it to your wishlist.",
                          style: TextStyle(fontSize: 11, color: Colors.grey, height: 1.3),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Tab bar buttons
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: ["Home Cook", "Bistro Chef", "Pro Master"].map((lvl) {
              final isSelected = _gourmetLevel == lvl;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4.0),
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isSelected ? const Color(0xFF00E676).withOpacity(0.15) : Colors.transparent,
                      foregroundColor: isSelected ? const Color(0xFF00E676) : Colors.white60,
                      side: BorderSide(
                        color: isSelected ? const Color(0xFF00E676) : Colors.white12,
                        width: 1,
                      ),
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    onPressed: () {
                      setState(() {
                        _gourmetLevel = lvl;
                      });
                    },
                    child: Text(
                      lvl,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: ListView.builder(
              itemCount: list.length,
              itemBuilder: (context, index) {
                final item = list[index];
                return Container(
                  margin: const EdgeInsets.symmetric(vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.015),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withOpacity(0.06)),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    title: Text(
                      item["original"] ?? "",
                      style: const TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          "➔ ",
                          style: TextStyle(color: Colors.grey, fontSize: 14),
                        ),
                        Text(
                          item["replacement"] ?? "",
                          style: const TextStyle(
                            color: Color(0xFF00E676),
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    onTap: () => _handleSubstitutionTap(item["replacement"] ?? ""),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}


