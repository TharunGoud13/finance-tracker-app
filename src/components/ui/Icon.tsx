import React from 'react';
import * as LucideIcons from 'lucide-react-native';

export type IconName = keyof typeof LucideIcons;

interface IconProps {
  name: string;
  size?: number;
  color?: string | any;
  strokeWidth?: number;
  style?: any;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 22,
  color = '#f8fafc',
  strokeWidth = 2,
  style,
}) => {
  // Normalize name
  const LucideComponent = (LucideIcons as any)[name] || LucideIcons.CircleHelp;

  return (
    <LucideComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
};
