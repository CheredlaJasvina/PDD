import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

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
  String _view = 'landing'; // landing | login | signup | forgot | otp
  final _emailCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();
  final _nameCtrl  = TextEditingController();
  final _otpCtrl   = TextEditingController();
  String? _error;
  String? _success;
  bool _loading = false;

  @override
  void dispose() {
    _emailCtrl.dispose(); _passCtrl.dispose();
    _nameCtrl.dispose();  _otpCtrl.dispose();
    super.dispose();
  }

  void _go(String v) => setState(() { _view = v; _error = null; _success = null; });

  // Longer timeout — Render free-tier cold starts take up to 50s
  static const _timeout = Duration(seconds: 60);

  Future<void> _login() async {
    final email = _emailCtrl.text.trim();
    final pass  = _passCtrl.text;
    if (email.isEmpty || pass.isEmpty) {
      setState(() => _error = 'Email and password are required.');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final res = await http.post(
        Uri.parse('${widget.backendUrl}/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': pass}),
      ).timeout(_timeout);
      final d = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && d['success'] == true) {
        widget.onLoginSuccess(d['user'] as Map<String, dynamic>, d['token'] as String? ?? '');
      } else {
        setState(() => _error = d['message'] as String? ?? 'Invalid email or password.');
      }
    } on Exception catch (e) {
      // Offline demo accounts – always available without network
      if (email == 'jasvina@foodfreshness.com' && pass == 'password123') {
        widget.onLoginSuccess(_demoJasvina(), 'mock'); return;
      }
      if (email == 'ram@gmail.com' && pass == 'Ram@1234') {
        widget.onLoginSuccess(_demoRam(), 'mock'); return;
      }
      setState(() => _error = 'Server unreachable (${_friendlyError(e)}). Try the demo account: jasvina@foodfreshness.com / password123');
    } finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _signup() async {
    final name  = _nameCtrl.text.trim();
    final email = _emailCtrl.text.trim();
    final pass  = _passCtrl.text;

    // Client-side validation
    if (name.isEmpty)  { setState(() => _error = 'Full name is required.'); return; }
    if (!RegExp(r'^[a-zA-Z\s.\-]+$').hasMatch(name)) {
      setState(() => _error = 'Name must contain letters only (no numbers or symbols).'); return;
    }
    if (email.isEmpty) { setState(() => _error = 'Email address is required.'); return; }
    if (!RegExp(r'^[\w\.\+\-]+@[\w\-]+\.[a-zA-Z]{2,}$').hasMatch(email)) {
      setState(() => _error = 'Please enter a valid email address.'); return;
    }
    if (pass.length < 6) { setState(() => _error = 'Password must be at least 6 characters.'); return; }

    setState(() { _loading = true; _error = null; });
    try {
      final res = await http.post(
        Uri.parse('${widget.backendUrl}/auth/signup'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': pass, 'name': name}),
      ).timeout(_timeout);
      final d = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && d['success'] == true) {
        // Success — move to OTP screen
        setState(() {
          _success = 'Verification code sent to $email. Check your inbox (and spam folder).';
          _view = 'otp';
        });
      } else {
        // Server returned a business-logic error (e.g. email already registered)
        setState(() => _error = d['message'] as String? ?? 'Registration failed. Please try again.');
      }
    } on Exception catch (e) {
      // Network / timeout — let user know clearly; don't silently fall into offline OTP
      setState(() => _error =
          'Cannot reach the server (${_friendlyError(e)}).\n\n'
          'The server may be waking up (free-tier cold start takes ~30s). '
          'Please wait a moment and try again.');
    } finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _forgot() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty) { setState(() => _error = 'Please enter your registered email.'); return; }
    setState(() { _loading = true; _error = null; });
    try {
      final res = await http.post(
        Uri.parse('${widget.backendUrl}/auth/send-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      ).timeout(_timeout);
      final d = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && d['success'] == true) {
        setState(() { _success = d['message'] as String? ?? 'Recovery code sent to $email.'; _view = 'otp'; });
      } else {
        setState(() => _error = d['message'] as String? ?? 'Failed to send OTP. Check the email address.');
      }
    } on Exception catch (e) {
      setState(() => _error = 'Cannot reach server (${_friendlyError(e)}). Please try again.');
    } finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _verifyOtp() async {
    final code = _otpCtrl.text.trim();
    if (code.length != 4) { setState(() => _error = 'Code must be exactly 4 digits.'); return; }
    setState(() { _loading = true; _error = null; });
    try {
      final res = await http.post(
        Uri.parse('${widget.backendUrl}/auth/verify-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': _emailCtrl.text.trim(), 'code': code}),
      ).timeout(_timeout);
      final d = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && d['success'] == true) {
        // Use server-returned user if available, otherwise build from form data
        final user = d['user'] as Map<String, dynamic>? ?? _newUser();
        widget.onLoginSuccess(user, d['token'] as String? ?? '');
      } else {
        setState(() => _error = d['message'] as String? ?? 'Invalid verification code. Check your email.');
      }
    } on Exception catch (e) {
      // Offline bypass codes for testing without network
      if (code == '8844' || code == '1234') {
        widget.onLoginSuccess(_newUser(), 'mock'); return;
      }
      setState(() => _error = 'Cannot connect (${_friendlyError(e)}). Use code 8844 to test offline.');
    } finally { if (mounted) setState(() => _loading = false); }
  }

  /// Converts a network exception into a short human-readable label.
  String _friendlyError(Exception e) {
    final msg = e.toString().toLowerCase();
    if (msg.contains('timeout'))        return 'timeout – server may be starting up';
    if (msg.contains('socketexception')) return 'no internet connection';
    if (msg.contains('handshake'))      return 'SSL error';
    return 'network error';
  }

  Map<String, dynamic> _newUser() => {
    'email': _emailCtrl.text.trim(),
    'name': _nameCtrl.text.isEmpty ? 'New User' : _nameCtrl.text.trim(),
    'dietaryPreferences': [], 'audienceMode': 'Regular',
    'servings': 2, 'membersCount': 2,
    'notificationPref': {'advanceNoticeDays': 2, 'emailAlerts': true, 'inAppAlerts': true},
    'healthScore': 100, 'streakCount': 1, 'unlockedBadges': ['Fresh Starter'],
  };
  Map<String, dynamic> _demoJasvina() => {
    'email': 'jasvina@foodfreshness.com', 'name': 'C. Jasvina',
    'dietaryPreferences': ['vegetarian'], 'audienceMode': 'Regular',
    'servings': 2, 'membersCount': 2,
    'notificationPref': {'advanceNoticeDays': 2, 'emailAlerts': true, 'inAppAlerts': true},
    'healthScore': 88, 'streakCount': 5, 'unlockedBadges': ['Fresh Starter', 'Waste Warrior'],
  };
  Map<String, dynamic> _demoRam() => {
    'email': 'ram@gmail.com', 'name': 'Ram',
    'dietaryPreferences': ['vegetarian'], 'audienceMode': 'Regular',
    'servings': 2, 'membersCount': 2,
    'notificationPref': {'advanceNoticeDays': 2, 'emailAlerts': true, 'inAppAlerts': true},
    'healthScore': 100, 'streakCount': 1, 'unlockedBadges': ['Fresh Starter'],
  };

  @override
  Widget build(BuildContext context) {
    if (_view == 'landing') return _buildLanding();
    return _buildForm();
  }

  Widget _buildLanding() {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0C10),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
          child: Column(children: [
            // Logo + brand name
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Container(
                width: 72, height: 72,
                decoration: BoxDecoration(
                  color: const Color(0xFF0E1B18),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFF00E676).withOpacity(0.5), width: 1.5),
                ),
                child: const Center(child: Text('🍏', style: TextStyle(fontSize: 38))),
              ),
              const SizedBox(width: 16),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                RichText(text: const TextSpan(
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 34, letterSpacing: -1.2),
                  children: [
                    TextSpan(text: 'Fresh', style: TextStyle(color: Colors.white)),
                    TextSpan(text: 'Radar', style: TextStyle(color: Color(0xFF00E676))),
                  ],
                )),
                const Text('SMART FOOD FRESHNESS TRACKING',
                    style: TextStyle(fontSize: 8, fontWeight: FontWeight.w700, color: Colors.grey, letterSpacing: 1.0)),
              ]),
            ]),
            const SizedBox(height: 20),
            const Text(
              'AI visual scans, zero-waste recipes, shared co-ops, neighbourhood food boards and carbon calculators — all in one app.',
              style: TextStyle(color: Colors.grey, fontSize: 13, height: 1.6),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            // Feature cards row
            Row(children: [
              _featCard('📸', 'AI Vision\nScan', 'Instant freshness score'),
              const SizedBox(width: 8),
              _featCard('🥗', 'Zero-Waste\nRecipes', 'Uses expiring items first'),
              const SizedBox(width: 8),
              _featCard('🌿', 'Carbon\nOffset', 'Track eco impact'),
            ]),
            const SizedBox(height: 36),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black,
                minimumSize: const Size(double.infinity, 52),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: () => _go('signup'),
              child: const Text('Get Started Free', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white10, foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 52),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: const BorderSide(color: Colors.white12)),
              ),
              onPressed: () => _go('login'),
              child: const Text('Sign In to Fridge', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _featCard(String emoji, String title, String sub) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.07)),
      ),
      child: Column(children: [
        Text(emoji, style: const TextStyle(fontSize: 24)),
        const SizedBox(height: 6),
        Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: Colors.white), textAlign: TextAlign.center),
        const SizedBox(height: 4),
        Text(sub, style: const TextStyle(color: Colors.grey, fontSize: 9, height: 1.4), textAlign: TextAlign.center),
      ]),
    ),
  );

  Widget _buildForm() {
    const titles = {'login': 'Sign In', 'signup': 'Create Account', 'forgot': 'Forgot Password', 'otp': 'OTP Verification'};
    return Scaffold(
      backgroundColor: const Color(0xFF0B0C10),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(children: [
              Align(
                alignment: Alignment.centerLeft,
                child: GestureDetector(
                  onTap: () => _go('landing'),
                  child: const Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.arrow_back_ios, size: 14, color: Colors.grey),
                    SizedBox(width: 4),
                    Text('Back', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  ]),
                ),
              ),
              const SizedBox(height: 24),
              Text(titles[_view] ?? '', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold)),
              const SizedBox(height: 24),
              if (_error != null) _banner(_error!, const Color(0xFFFF1744)),
              if (_success != null) _banner(_success!, const Color(0xFF00E676), isSuccess: true),

              if (_view == 'login') ...[
                _field(_emailCtrl, 'Email address', icon: Icons.email_outlined),
                const SizedBox(height: 12),
                _field(_passCtrl, 'Password', obscure: true, icon: Icons.lock_outline),
                const SizedBox(height: 20),
                _btn('Sign In', _login),
                _link('Forgot password?', () => _go('forgot')),
                _linkRich('No account? ', 'Create one free', () => _go('signup')),
              ],

              if (_view == 'signup') ...[
                _field(_nameCtrl, 'Full Name', icon: Icons.person_outline),
                const SizedBox(height: 12),
                _field(_emailCtrl, 'Email address', icon: Icons.email_outlined),
                const SizedBox(height: 12),
                _field(_passCtrl, 'Create Password', obscure: true, icon: Icons.lock_outline),
                const SizedBox(height: 20),
                _btn('Register Account', _signup),
                _linkRich('Have an account? ', 'Login', () => _go('login')),
              ],

              if (_view == 'forgot') ...[
                const Text('Enter your registered email for a recovery code.',
                    style: TextStyle(color: Colors.grey, fontSize: 12, height: 1.5), textAlign: TextAlign.center),
                const SizedBox(height: 16),
                _field(_emailCtrl, 'Registered Email', icon: Icons.email_outlined),
                const SizedBox(height: 20),
                _btn('Send Recovery PIN', _forgot),
                _link('Back to Login', () => _go('login')),
              ],

              if (_view == 'otp') ...[
                if (_success == null)
                  const Text('Enter the 4-digit code sent to your email.',
                      style: TextStyle(color: Colors.orange, fontSize: 13), textAlign: TextAlign.center),
                const SizedBox(height: 16),
                TextField(
                  controller: _otpCtrl,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  maxLength: 4,
                  style: const TextStyle(fontSize: 30, letterSpacing: 18, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    counterText: '',
                    labelText: 'Verification Code',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 20),
                _btn('Verify & Login', _verifyOtp),
                _link('Back to Login', () => _go('login')),
              ],
            ]),
          ),
        ),
      ),
    );
  }

  Widget _banner(String msg, Color color, {bool isSuccess = false}) => Container(
    width: double.infinity, padding: const EdgeInsets.all(12),
    margin: const EdgeInsets.only(bottom: 16),
    decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(10), border: Border.all(color: color.withOpacity(0.3))),
    child: Row(children: [
      Icon(isSuccess ? Icons.check_circle_outline : Icons.error_outline, color: color, size: 16),
      const SizedBox(width: 8),
      Expanded(child: Text(msg, style: TextStyle(color: color, fontSize: 12, height: 1.4))),
    ]),
  );

  Widget _field(TextEditingController c, String label, {bool obscure = false, IconData? icon}) =>
    TextField(controller: c, obscureText: obscure, decoration: InputDecoration(
      labelText: label,
      prefixIcon: icon != null ? Icon(icon, size: 18, color: Colors.grey) : null,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.white24)),
    ));

  Widget _btn(String label, VoidCallback onTap) => ElevatedButton(
    style: ElevatedButton.styleFrom(
      backgroundColor: const Color(0xFF00E676), foregroundColor: Colors.black,
      minimumSize: const Size(double.infinity, 52),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
    onPressed: _loading ? null : onTap,
    child: _loading
        ? const Row(mainAxisAlignment: MainAxisAlignment.center, mainAxisSize: MainAxisSize.min, children: [
            SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black)),
            SizedBox(width: 12),
            Text('Connecting to server…', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black)),
          ])
        : Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
  );

  Widget _link(String label, VoidCallback onTap) =>
    TextButton(onPressed: onTap, child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)));

  Widget _linkRich(String pre, String link, VoidCallback onTap) =>
    GestureDetector(onTap: onTap, child: Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: RichText(text: TextSpan(
        text: pre, style: const TextStyle(color: Colors.grey, fontSize: 13),
        children: [TextSpan(text: link, style: const TextStyle(color: Color(0xFF00E676), fontWeight: FontWeight.bold))],
      )),
    ));
}
