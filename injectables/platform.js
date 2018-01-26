var platform;
var isCordova = false;
var isWindowsPhone = false;
var isAndroid = false;
var isIOS = false;
var isReactNative;
try {
    var ReactNative = require('react-native');
    isAndroid = ReactNative.Platform.OS === 'android';
    isIOS = ReactNative.Platform.OS === 'ios';
    isReactNative = true;
} catch (e) {
    isReactNative = false;
}

var isNativeScript =
    Boolean(
        (typeof android !== 'undefined' &&
            android &&
            android.widget &&
            android.widget.Button) ||
            (typeof UIButton !== 'undefined' && UIButton)
    ) && !isReactNative;

if (typeof window !== 'undefined' && !isNativeScript && !isReactNative) {
    isCordova =
        /^file:\/{3}[^\/]|x-wmapp/i.test(window.location.href) &&
        /ios|iphone|ipod|ipad|android|iemobile/i.test(navigator.userAgent);
    isWindowsPhone = isCordova && /iemobile/i.test(navigator.userAgent);
    isAndroid = isCordova && cordova.platformId === 'android';
}

var isNodejs = typeof exports === 'object' && typeof window === 'undefined';
var isRequirejs = typeof define === 'function' && define.amd;
var isDesktop = !isNativeScript && !isCordova && !isNodejs && !isReactNative;

if (isNativeScript) {
    platform = 'ns';
} else if (isNodejs) {
    platform = 'nodejs';
} else if (isDesktop) {
    platform = 'desktop';
} else if (isCordova) {
    platform = 'cordova';
} else if (isReactNative) {
    platform = 'reactnative';
}

var isInAppBuilderSimulator = function() {
    return (
        typeof window !== 'undefined' &&
        window.navigator &&
        window.navigator.simulator
    );
};

module.exports = {
    isCordova: isCordova,
    isNativeScript: isNativeScript,
    isDesktop: isDesktop,
    isWindowsPhone: isWindowsPhone,
    isAndroid: isAndroid,
    isIOS: isIOS,
    isNodejs: isNodejs,
    isRequirejs: isRequirejs,
    isReactNative: isReactNative,
    platform: platform,
    isInAppBuilderSimulator: isInAppBuilderSimulator
};
