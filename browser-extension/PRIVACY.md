# ReadFocus Extension - Privacy Policy

**Last Updated:** December 2024  
**Version:** 2.0.0

## 🔒 Our Privacy Commitment

ReadFocus is designed with privacy as a core principle. We believe focused reading should be personal and secure. This policy explains what data we collect, how we use it, and your control over your information.

## 📋 Data Collection Summary

### ✅ What We Collect

- **Reading Preferences**: Font size, theme, chunk size (stored locally)
- **Usage Statistics**: Session duration, reading speed (anonymous, optional)
- **Site Preferences**: Whitelist/blacklist sites for auto-activation

### ❌ What We Don't Collect

- **Content**: We never store, transmit, or analyze the text you read
- **Personal Info**: No names, emails, or personal identifiers
- **Browsing History**: No tracking of websites visited
- **Location Data**: No geographical information

## 🛠️ How Data is Used

### Local Storage Only

- All your settings and preferences are stored **locally on your device**
- No data is transmitted to external servers
- Chrome's built-in sync (if enabled) may sync settings across your devices

### Optional Analytics

- **Completely Optional**: You control whether to share usage data
- **Anonymous Only**: No personal identifiers linked to data
- **Aggregated**: Used only to improve reading algorithms
- **Opt-out Anytime**: Change your mind in settings

## 🔐 Data Security

### Local-First Architecture

- Settings stored using Chrome's secure storage API
- No external databases or cloud storage
- Data encrypted using Chrome's built-in encryption

### Minimal Permissions

- **activeTab**: Only access the current webpage when Focus Mode is active
- **storage**: Store your preferences locally
- **contextMenus**: Add right-click menu options
- **scripting**: Inject Focus Mode overlay (only when activated)

## 🎛️ Your Control

### Complete Control

- **View All Data**: Settings page shows all stored information
- **Export Settings**: Download your preferences as a file
- **Clear Everything**: One-click data deletion
- **Granular Control**: Choose exactly what features to enable

### Easy Management

- **Settings Access**: Right-click extension → Options
- **Instant Changes**: Updates apply immediately
- **No Account Required**: No login or registration

## 🌍 Site Interaction

### Content Reading

- **Temporary Access**: Only while Focus Mode is active
- **No Storage**: Webpage content is never saved or cached
- **Local Processing**: All text analysis happens on your device
- **Immediate Cleanup**: Content cleared when mode is deactivated

### Auto-Detection

- **Pattern Recognition**: Identifies articles using layout analysis
- **No Tracking**: Detection doesn't log or store site visits
- **User Control**: Disable detection entirely in settings

## 📊 Optional Analytics Details

If you choose to enable anonymous analytics, we collect:

### Usage Metrics

- Reading session duration
- Average reading speed
- Chunk completion rates
- Quiz accuracy (aggregated)
- Feature usage frequency

### Technical Data

- Browser version (for compatibility)
- Extension version
- Error reports (anonymous)

### What We Don't Track

- Specific websites visited
- Article titles or content
- Time of day or frequency of use
- Any personally identifiable information

## 🔄 Data Retention

### Local Data

- **Settings**: Kept until you clear them or uninstall
- **Reading History**: Optional, you control retention period
- **Session Data**: Automatically cleaned after 30 days

### Analytics Data

- **Aggregated Only**: Individual sessions not stored
- **Anonymous**: No way to trace back to individual users
- **Temporary**: Used for analysis then deleted

## 👥 Data Sharing

### Zero Sharing Policy

- **No Third Parties**: We don't share data with anyone
- **No Advertising**: No ads, no ad networks, no tracking
- **No Sales**: Your data is never sold or monetized
- **No Partnerships**: No data sharing agreements

### Open Source Transparency

- **Code Inspection**: Extension code available for review
- **Community Oversight**: Privacy practices verified by community
- **No Hidden Features**: What you see is what you get

## 🔧 Technical Implementation

### Chrome Storage API

```javascript
// Example of how we store settings
chrome.storage.sync.set({
  readfocusSettings: {
    fontSize: 18,
    theme: 'light',
    chunkSize: 150,
    // No personal data ever stored
  },
});
```

### Content Script Isolation

- Runs in isolated environment
- No access to other extensions or browser data
- Automatically removed when Focus Mode exits

## 📱 Cross-Device Sync

### Chrome Sync (Optional)

- **Your Choice**: Uses Chrome's built-in sync if you enable it
- **Google's Control**: Follows Google's privacy policies for Chrome sync
- **Local Fallback**: Works completely offline if sync is disabled

## ⚖️ Legal Compliance

### GDPR Compliance

- **Data Minimization**: We collect only what's necessary
- **User Consent**: All features are opt-in
- **Right to Delete**: Easy data deletion tools
- **Data Portability**: Export your settings anytime

### CCPA Compliance

- **No Sale of Data**: We don't sell personal information
- **Right to Know**: This policy explains all data practices
- **Right to Delete**: Full deletion available in settings

## 📞 Contact & Support

### Questions or Concerns

- **Issues**: Create an issue on our GitHub repository
- **Privacy Questions**: Contact through GitHub discussions
- **Security Reports**: Responsible disclosure via GitHub security tab

### Updates to This Policy

- **Version Control**: All changes tracked in GitHub
- **User Notification**: Significant changes highlighted in extension updates
- **Backward Compatibility**: Settings won't change without your consent

## 🎯 Summary

ReadFocus is built for privacy:

- ✅ **Local-first**: Everything happens on your device
- ✅ **Minimal data**: Only settings and preferences
- ✅ **Your control**: Complete control over your data
- ✅ **No tracking**: No behavioral monitoring
- ✅ **Optional sharing**: You choose what (if anything) to share
- ✅ **Open source**: Code available for inspection

**Bottom Line**: We help you read better without compromising your privacy. Your reading habits, content, and personal information stay with you.

---

_This privacy policy is written in plain language to be easily understood. If you have questions about any section, please reach out through our GitHub repository._
