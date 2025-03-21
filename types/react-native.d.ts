/**
 * Stub type declarations for React Native.
 * This is used to satisfy TypeScript when some dependencies reference React Native types,
 * but we're not actually using React Native in our web application.
 */

declare module 'react-native' {
  import * as React from 'react';

  export interface ViewProps {
    style?: any;
    children?: React.ReactNode;
    [key: string]: any; // Allow any additional props
  }

  export interface TextProps {
    style?: any;
    children?: React.ReactNode;
    [key: string]: any; // Allow any additional props
  }

  export const View: React.ComponentType<ViewProps>;
  export const Text: React.ComponentType<TextProps>;
  export const TouchableOpacity: React.ComponentType<any>;
  export const TouchableWithoutFeedback: React.ComponentType<any>;
  export const ScrollView: React.ComponentType<any>;
  export const StyleSheet: {
    create: (styles: Record<string, any>) => Record<string, any>;
    flatten: (style: any) => any;
    compose: (style1: any, style2: any) => any;
  };
  export const Platform: {
    OS: string;
    select: (obj: Record<string, any>) => any;
    Version: number;
    isPad: boolean;
    isTV: boolean;
  };
  export const Dimensions: {
    get: (dimension: string) => { width: number; height: number; scale: number; fontScale: number };
    addEventListener: (type: string, handler: Function) => { remove: () => void };
    removeEventListener: (type: string, handler: Function) => void;
  };
  export const Animated: {
    View: React.ComponentType<any>;
    Text: React.ComponentType<any>;
    createAnimatedComponent: (component: React.ComponentType<any>) => React.ComponentType<any>;
    timing: (value: any, config: any) => { start: (callback?: () => void) => void };
    Value: any;
  };
} 