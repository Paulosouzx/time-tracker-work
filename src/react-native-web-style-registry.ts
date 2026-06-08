// @ts-ignore: no typed declaration available for this internal react-native-web path
import StyleSheet from 'react-native-web/dist/exports/StyleSheet/index.js';

const StyleRegistry = {
  resolve(style: any) {
    if (style == null) return null;
    if (typeof StyleSheet.resolve === 'function') return StyleSheet.resolve(style);
    if (typeof StyleSheet.flatten === 'function') return StyleSheet.flatten(style);
    return style;
  },
};

export default StyleRegistry;
