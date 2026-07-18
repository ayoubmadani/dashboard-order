import { Image as ImageIcon, SeparatorHorizontal, ClipboardList, Pin } from 'lucide-react';
import ImageBlock from './ImageBlock';
import SpacerBlock from './SpacerBlock';
import ProductFormBlock from './ProductFormBlock';
import FloatingButtonBlock from './FloatingButtonBlock';
import { FLOATING_BUTTON_ICONS } from './floatingButtonIcons';

const FLOATING_BUTTON_POSITIONS = ['top-right', 'top-left', 'top-center', 'bottom-right', 'bottom-left', 'bottom-center'];

// Shared registry: same block Components render in the editor canvas (selectable/draggable)
// and, later, in the storefront (view-only). Keep block Components free of Tailwind —
// storefront rendering is CSS-variables/inline-style only.
export const componentsMap = {
  image: {
    labelKey: 'editor.blocks.image.label',
    icon: ImageIcon,
    Component: ImageBlock,
    resizableHeight: true, // Canvas.jsx adds a drag handle on the bottom edge for this
    defaultProps: {
      src: '',
      alt: '',
      caption: '',
      width: 100,
      align: 'center',
      // No default height — renders at the image's natural aspect ratio
      // until the block is actually resized, so existing pages keep
      // rendering exactly as before.
      height: null,
    },
    fields: [
      // Uploading a new image clears any manually-set height so the block
      // goes back to following the new image's own natural aspect ratio,
      // instead of cropping it to whatever height an old, differently-shaped
      // image happened to be resized to. The resize handle still works
      // afterward — this only resets the starting point on a fresh upload.
      { key: 'src', labelKey: 'editor.fields.image', type: 'image', clearsFields: ['height'] },
      { key: 'alt', labelKey: 'editor.fields.alt', type: 'text' },
      { key: 'caption', labelKey: 'editor.fields.caption', type: 'text' },
      { key: 'width', labelKey: 'editor.fields.width', type: 'number' },
      { key: 'height', labelKey: 'editor.fields.height', type: 'number', min: 20, max: 8000 },
      {
        key: 'align',
        labelKey: 'editor.fields.align',
        type: 'select',
        options: [
          { value: 'start', labelKey: 'editor.fields.alignOptions.start' },
          { value: 'center', labelKey: 'editor.fields.alignOptions.center' },
          { value: 'end', labelKey: 'editor.fields.alignOptions.end' },
        ],
      },
    ],
  },
  spacer: {
    labelKey: 'editor.blocks.spacer.label',
    icon: SeparatorHorizontal,
    Component: SpacerBlock,
    resizableHeight: true, // Canvas.jsx adds a drag handle on the bottom edge for this
    defaultProps: {
      height: 60,
      backgroundColor: '#ffffff',
      locked: false,
      // 'static' = normal in-flow block (default). 'top'/'bottom' pin it to
      // the top/bottom of the screen on the published page (SpacerBlock.jsx
      // renders real position:fixed). The editor itself always shows it as
      // a normal in-flow block instead of actually going fixed — see the
      // isPinned handling in Canvas.jsx for why — with just a small badge
      // marking that it'll be pinned once published.
      position: 'static',
    },
    fields: [
      { key: 'height', labelKey: 'editor.fields.height', type: 'number', min: 20, max: 8000 },
      { key: 'backgroundColor', labelKey: 'editor.fields.backgroundColor', type: 'color' },
      { key: 'locked', labelKey: 'editor.fields.lockHeight', type: 'checkbox' },
      {
        key: 'position',
        labelKey: 'editor.fields.position',
        type: 'select',
        options: [
          { value: 'static', labelKey: 'editor.fields.positionOptions.static' },
          { value: 'top', labelKey: 'editor.fields.positionOptions.top' },
          { value: 'bottom', labelKey: 'editor.fields.positionOptions.bottom' },
        ],
      },
    ],
  },
  productForm: {
    labelKey: 'editor.blocks.productForm.label',
    icon: ClipboardList,
    Component: ProductFormBlock,
    singleton: true, // only one order form makes sense per page
    defaultProps: {
      productId: '',
      showProductName: true,
      productName: '',
      title: 'أكمل طلبك الآن',
      buttonText: 'اطلب الآن',
      containerBackgroundColor: '',
      backgroundColor: '#ffffff',
      textColor: '#27272a',
      buttonBackgroundColor: '#10b981',
      buttonTextColor: '#ffffff',
      buttonBorderColor: '',
      inputBackgroundColor: '#f9fafb',
      inputBorderColor: '#e4e4e7',
      inputTextColor: '#18181b',
      // ~20px at the page's 720px reference width, expressed as a
      // percentage of the container's own width so it stays proportional
      // at any screen size instead of using up more and more of a narrow
      // phone screen the way a fixed px value would.
      paddingX: 3,
      borderRadius: 0,
    },
    fields: [
      { key: 'title', labelKey: 'editor.fields.title', type: 'text' },
      { key: 'showProductName', labelKey: 'editor.fields.showProductName', type: 'checkbox' },
      { key: 'productName', labelKey: 'editor.fields.productNameOverride', type: 'text' },
      { key: 'buttonText', labelKey: 'editor.fields.buttonText', type: 'text' },
      { key: 'containerBackgroundColor', labelKey: 'editor.fields.containerBackgroundColor', type: 'color' },
      { key: 'paddingX', labelKey: 'editor.fields.paddingX', type: 'number', min: 0, max: 50 },
      { key: 'borderRadius', labelKey: 'editor.fields.borderRadius', type: 'number', min: 0, max: 60 },
      {
        key: 'formColors',
        type: 'colorGroup',
        groupLabelKey: 'editor.fields.formColors',
        items: [
          { key: 'backgroundColor', labelKey: 'editor.fields.backgroundColor' },
          { key: 'textColor', labelKey: 'editor.fields.textColor' },
        ],
      },
      {
        key: 'inputColors',
        type: 'colorGroup',
        groupLabelKey: 'editor.fields.inputColors',
        items: [
          { key: 'inputBackgroundColor', labelKey: 'editor.fields.backgroundColor' },
          { key: 'inputBorderColor', labelKey: 'editor.fields.inputBorderColor' },
          { key: 'inputTextColor', labelKey: 'editor.fields.textColor' },
        ],
      },
      {
        key: 'buttonColors',
        type: 'colorGroup',
        groupLabelKey: 'editor.fields.buttonColors',
        items: [
          { key: 'buttonBackgroundColor', labelKey: 'editor.fields.backgroundColor' },
          { key: 'buttonTextColor', labelKey: 'editor.fields.textColor' },
          { key: 'buttonBorderColor', labelKey: 'editor.fields.buttonBorderColor' },
        ],
      },
    ],
  },
  floatingButton: {
    labelKey: 'editor.blocks.floatingButton.label',
    icon: Pin,
    Component: FloatingButtonBlock,
    singleton: true, // one page-wide floating button makes sense per page
    defaultProps: {
      link: '',
      linkType: 'external',
      position: 'bottom-right',
      contentType: 'icon',
      text: 'تواصل معنا',
      icon: 'MessageCircle',
      width: 56,
      height: 56,
      backgroundColor: '#10b981',
      textColor: '#ffffff',
    },
    fields: [
      {
        key: 'linkType',
        labelKey: 'editor.fields.linkType',
        type: 'select',
        options: [
          { value: 'external', labelKey: 'editor.fields.linkTypeOptions.external' },
          { value: 'form', labelKey: 'editor.fields.linkTypeOptions.form' },
        ],
      },
      // Only relevant for an external link — jumping to the order form
      // doesn't need a URL, it scrolls to the productForm block already on
      // the page (same behavior as a floating element's own button type).
      { key: 'link', labelKey: 'editor.fields.buttonLink', type: 'url', showIf: (v) => (v.linkType || 'external') !== 'form' },
      {
        key: 'position',
        labelKey: 'editor.fields.position',
        type: 'select',
        options: FLOATING_BUTTON_POSITIONS.map((value) => ({ value, labelKey: `editor.fields.floatingPositionOptions.${value}` })),
      },
      {
        key: 'contentType',
        labelKey: 'editor.fields.floatingContentType',
        type: 'select',
        options: [
          { value: 'icon', labelKey: 'editor.fields.floatingContentTypeOptions.icon' },
          { value: 'text', labelKey: 'editor.fields.floatingContentTypeOptions.text' },
        ],
      },
      { key: 'text', labelKey: 'editor.fields.text', type: 'text', showIf: (v) => v.contentType === 'text' },
      {
        key: 'icon',
        labelKey: 'editor.fields.floatingIcon',
        type: 'select',
        options: Object.keys(FLOATING_BUTTON_ICONS).map((name) => ({ value: name, labelKey: `editor.fields.floatingIconOptions.${name}` })),
        showIf: (v) => (v.contentType || 'icon') === 'icon',
      },
      { key: 'width', labelKey: 'editor.fields.floatingWidth', type: 'number', min: 32, max: 300 },
      { key: 'height', labelKey: 'editor.fields.floatingHeight', type: 'number', min: 32, max: 300 },
      { key: 'backgroundColor', labelKey: 'editor.fields.backgroundColor', type: 'color' },
      { key: 'textColor', labelKey: 'editor.fields.textColor', type: 'color' },
    ],
  },
};

export const blockTypes = Object.keys(componentsMap);
