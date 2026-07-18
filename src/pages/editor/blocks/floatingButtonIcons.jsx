import { Phone, MessageCircle, Mail, MapPin, ShoppingCart, ArrowUp, ArrowDown, Facebook, Instagram } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';

// Curated CTA-relevant icon set for the floatingButton block (see
// componentsMap.js and FloatingButtonBlock.jsx) — shared by name string
// with the live page (store/BuilderPageRenderer.tsx keeps its own matching
// icon map keyed by the same names) so the stored value is just a portable
// string, not a component reference. Kept in its own file, not exported
// from a component file, so editing this list doesn't break Fast Refresh
// on any component that imports it.
export const FLOATING_BUTTON_ICONS = {
  Phone, MessageCircle, Mail, MapPin, ShoppingCart, ArrowUp, ArrowDown, Facebook, Instagram,
  WhatsApp: WhatsAppIcon,
};
