export default function SpacerBlock({ height, backgroundColor, position }) {
  const isPinned = position === 'top' || position === 'bottom';
  return (
    <div
      style={{
        height: height || 60,
        backgroundColor: backgroundColor || '#ffffff',
        ...(isPinned && { position: 'fixed', [position]: 0, left: 0, right: 0, zIndex: 30 }),
      }}
    />
  );
}
