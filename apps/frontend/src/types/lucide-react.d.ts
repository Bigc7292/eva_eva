declare module 'lucide-react' {
  import type { ComponentType } from 'react'

  interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string
    color?: string
    strokeWidth?: number | string
  }

  type Icon = ComponentType<IconProps>

  export const Phone: Icon
  export const Users: Icon
  export const Calendar: Icon
  export const Star: Icon
  export const TrendingUp: Icon
  export const Clock: Icon
  export const Building2: Icon
  export const Menu: Icon
  export const X: Icon
  export const LogOut: Icon
  export const Bell: Icon
  export const Search: Icon
  export const Upload: Icon
  export const MapPin: Icon
  export const Mail: Icon
  export const Building: Icon
  export const DollarSign: Icon
  export const PlayCircle: Icon
  export const Send: Icon
  export const User: Icon
  export const Settings: Icon
} 