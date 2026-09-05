declare const require: any;
declare const process: any;

declare module 'react-native' {
  export const View: any;
  export const Text: any;
  export const Image: any;
  export const TouchableOpacity: any;
  export const ScrollView: any;
  export const TextInput: any;
  export const ActivityIndicator: any;
  export const StyleSheet: {
    create: <T extends Record<string, any>>(styles: T) => T;
  };
  export const SafeAreaView: any;
  export const StatusBar: any;
  export const Platform: {
    OS: 'web' | 'ios' | 'android';
    select: <T>(obj: { web?: T; ios?: T; android?: T; default?: T }) => T;
  };
  export const Modal: any;
  export const Linking: any;
}

declare module 'react-native-web' {
  export const View: any;
  export const Text: any;
  export const Image: any;
  export const TouchableOpacity: any;
  export const ScrollView: any;
  export const TextInput: any;
  export const ActivityIndicator: any;
  export const StyleSheet: any;
  export const SafeAreaView: any;
  export const StatusBar: any;
  export const Platform: any;
  export const Modal: any;
  export const Linking: any;
}
