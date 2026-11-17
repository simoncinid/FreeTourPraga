import Image from "next/image";
type IconProps = { size?: number; className?: string; fill?: string };
function Icon({ name, size = 16, className = "" }: IconProps & { name: string }) {
  return <Image src={`/images/illustrated/${name}.webp`} alt="" aria-hidden width={size} height={size} className={`shrink-0 ${className}`} />;
}
export const Clock = (props: IconProps) => <Icon name="clock" {...props} />;
export const MapPin = (props: IconProps) => <Icon name="pin" {...props} />;
export const ShoppingCart = (props: IconProps) => <Icon name="cart" {...props} />;
export function Footprints({ size = 16, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="currentColor" className={`shrink-0 ${className}`} aria-hidden><path d="M17 7c-7 0-10 11-8 21l3 12 12-3-1-12c-1-9 1-18-6-18zm-4 37 12-3 1 8c1 8-10 11-12 4zm34-26c7 0 10 11 8 21l-3 12-12-3 1-12c1-9-1-18 6-18zm4 37-12-3-1 5c-1 8 10 11 12 4z" /></svg>;
}
