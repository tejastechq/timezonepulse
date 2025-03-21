declare module 'react-simple-maps' {
  import React from 'react';
  
  // Geography interfaces
  interface GeographyProps {
    geography: any;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    onClick?: (event: React.MouseEvent<SVGPathElement>) => void;
    onMouseEnter?: (event: React.MouseEvent<SVGPathElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<SVGPathElement>) => void;
  }
  
  // Geographies interfaces
  interface GeographiesProps {
    geography: string | object;
    children: (props: { geographies: any[] }) => React.ReactNode;
  }
  
  // MapPosition interface
  interface MapPosition {
    coordinates: [number, number];
    zoom: number;
  }
  
  // ZoomableGroup interfaces
  interface ZoomableGroupProps {
    zoom?: number;
    center?: [number, number];
    maxZoom?: number;
    onMoveStart?: (position: MapPosition) => void;
    onMove?: (position: MapPosition) => void;
    onMoveEnd?: (position: MapPosition) => void;
    children?: React.ReactNode;
  }
  
  // ComposableMap interfaces
  interface ComposableMapProps {
    projection?: string;
    projectionConfig?: any;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
  }
  
  // Marker interfaces
  interface MarkerProps {
    coordinates: [number, number];
    style?: React.CSSProperties;
    className?: string;
    onClick?: (event: React.MouseEvent<SVGGElement>) => void;
    onMouseEnter?: (event: React.MouseEvent<SVGGElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<SVGGElement>) => void;
    children?: React.ReactNode;
  }
  
  // Line interfaces
  interface LineProps {
    from: [number, number];
    to: [number, number];
    stroke?: string;
    strokeWidth?: number;
    strokeLinecap?: string;
    strokeOpacity?: number;
    style?: React.CSSProperties;
    className?: string;
    onClick?: (event: React.MouseEvent<SVGLineElement>) => void;
    onMouseEnter?: (event: React.MouseEvent<SVGLineElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<SVGLineElement>) => void;
  }
  
  // Export the components
  export const ComposableMap: React.FC<ComposableMapProps>;
  export const Geographies: React.FC<GeographiesProps>;
  export const Geography: React.FC<GeographyProps>;
  export const ZoomableGroup: React.FC<ZoomableGroupProps>;
  export const Marker: React.FC<MarkerProps>;
  export const Line: React.FC<LineProps>;
} 