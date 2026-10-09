// حركات الأزرار (الزر فوق البلوكات + الزر العائم). نفس الملف في المتجر:
// mdstore-store/src/components/builderPages/buttonAnimations.ts — عدّلهما معاً.
// تستعمل خصائص scale/translate/rotate المستقلة (لا transform) حتى لا تتعارض مع
// transform الذي يضع الزر في مكانه. لا حركة لمن فعّل "تقليل الحركة" في جهازه.

export const BUTTON_ANIMATIONS = ['none', 'pulse', 'bounce', 'shake', 'glow', 'heartbeat'];

// الحركة تُبنى فوق transform التموضع (--md-btn-base) حتى تدور/تكبر حول مركز الزر الظاهر
export const BUTTON_ANIMATION_CSS = `
@keyframes md-btn-pulse { 0%, 100% { transform: var(--md-btn-base, translate(0, 0)) scale(1); } 50% { transform: var(--md-btn-base, translate(0, 0)) scale(1.06); } }
@keyframes md-btn-bounce { 0%, 100% { transform: var(--md-btn-base, translate(0, 0)) translateY(0); } 50% { transform: var(--md-btn-base, translate(0, 0)) translateY(-8px); } }
@keyframes md-btn-shake { 0%, 80%, 100% { transform: var(--md-btn-base, translate(0, 0)) rotate(0deg); } 84% { transform: var(--md-btn-base, translate(0, 0)) rotate(-4deg); } 88% { transform: var(--md-btn-base, translate(0, 0)) rotate(4deg); } 92% { transform: var(--md-btn-base, translate(0, 0)) rotate(-3deg); } 96% { transform: var(--md-btn-base, translate(0, 0)) rotate(2deg); } }
@keyframes md-btn-glow { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--md-btn-color, #10b981) 65%, transparent); } 100% { box-shadow: 0 0 0 14px transparent; } }
@keyframes md-btn-heartbeat { 0%, 100% { transform: var(--md-btn-base, translate(0, 0)) scale(1); } 14% { transform: var(--md-btn-base, translate(0, 0)) scale(1.1); } 28% { transform: var(--md-btn-base, translate(0, 0)) scale(1); } 42% { transform: var(--md-btn-base, translate(0, 0)) scale(1.1); } 70% { transform: var(--md-btn-base, translate(0, 0)) scale(1); } }
@media (prefers-reduced-motion: no-preference) {
  .md-btn-anim-pulse { animation: md-btn-pulse 1.6s ease-in-out infinite; }
  .md-btn-anim-bounce { animation: md-btn-bounce 1.4s ease-in-out infinite; }
  .md-btn-anim-shake { animation: md-btn-shake 3s ease-in-out infinite; }
  .md-btn-anim-glow { animation: md-btn-glow 1.8s ease-out infinite; }
  .md-btn-anim-heartbeat { animation: md-btn-heartbeat 1.8s ease-in-out infinite; }
}
`;

/** className للحركة المختارة (فارغ بدون حركة) */
export const buttonAnimationClass = (animation) =>
  animation && animation !== 'none' && BUTTON_ANIMATIONS.includes(animation) ? `md-btn-anim-${animation}` : undefined;
