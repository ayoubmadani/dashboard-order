// Seed data for /editor/demo — lets the editor UI be reviewed end-to-end
// (drag, reorder, props editing, save/publish) before the NestJS backend exists.
export const DEMO_PAGE_NAME = 'صفحة تجريبية';

export function getDemoBlocks() {
  return [
    {
      id: crypto.randomUUID(),
      type: 'spacer',
      props: {
        height: 360,
        elements: [
          { id: crypto.randomUUID(), type: 'text', content: 'هيمن على الأناقة', x: 50, y: 30, fontSize: 34, fontWeight: 700, color: '#27272a' },
          { id: crypto.randomUUID(), type: 'text', content: 'اسحب هذا النص لتحريكه، أو اضغط مرتين لتعديله', x: 50, y: 48, fontSize: 15, fontWeight: 400, color: '#52525b' },
          { id: crypto.randomUUID(), type: 'button', text: 'تسوق الآن', link: '#', x: 50, y: 66, backgroundColor: '#10b981', textColor: '#ffffff' },
        ],
      },
    },
    {
      id: crypto.randomUUID(),
      type: 'image',
      props: {
        src: '',
        alt: '',
        caption: '',
        width: 100,
        align: 'center',
      },
    },
    {
      id: crypto.randomUUID(),
      type: 'spacer',
      props: { height: 40 },
    },
  ];
}
