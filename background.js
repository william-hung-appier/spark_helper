/**
 * Background Service Worker
 *
 * Handles extension icon click to open side panel.
 */

// Open side panel when extension icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
